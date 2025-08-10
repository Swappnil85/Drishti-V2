import { query, transaction } from '../../db/connection';

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: 'owner' | 'member' | 'child';
  permissions: {
    viewData: boolean;
    editData: boolean;
    exportData: boolean;
    deleteData: boolean;
  };
  addedAt: string;
  addedBy: string;
}

export interface FamilyAccount {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members: FamilyMember[];
}

export class FamilyAccountService {
  async createFamilyAccount(
    ownerId: string,
    name: string
  ): Promise<FamilyAccount> {
    return await transaction(async client => {
      // Create family account
      const familyResult = await client.query(
        `INSERT INTO family_accounts (id, name, owner_id, created_at) 
         VALUES (gen_random_uuid(), $1, $2, NOW()) 
         RETURNING *`,
        [name, ownerId]
      );

      const family = familyResult.rows[0];

      // Add owner as first member
      await client.query(
        `INSERT INTO family_members (id, family_id, user_id, role, permissions, added_at, added_by)
         VALUES (gen_random_uuid(), $1, $2, 'owner', $3, NOW(), $2)`,
        [
          family.id,
          ownerId,
          JSON.stringify({
            viewData: true,
            editData: true,
            exportData: true,
            deleteData: true,
          }),
        ]
      );

      return {
        id: family.id,
        name: family.name,
        ownerId: family.owner_id,
        createdAt: family.created_at,
        members: [],
      };
    });
  }

  async addFamilyMember(
    familyId: string,
    userId: string,
    addedBy: string,
    role: 'member' | 'child' = 'member'
  ): Promise<FamilyMember> {
    // Verify addedBy has permission to add members
    const hasPermission = await this.userHasPermission(
      addedBy,
      familyId,
      'editData'
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions to add family member');
    }

    const defaultPermissions =
      role === 'child'
        ? {
            viewData: true,
            editData: false,
            exportData: false,
            deleteData: false,
          }
        : {
            viewData: true,
            editData: true,
            exportData: true,
            deleteData: false,
          };

    const result = await query(
      `INSERT INTO family_members (id, family_id, user_id, role, permissions, added_at, added_by)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), $5)
       RETURNING *`,
      [familyId, userId, role, JSON.stringify(defaultPermissions), addedBy]
    );

    const member = result.rows[0];
    return {
      id: member.id,
      familyId: member.family_id,
      userId: member.user_id,
      role: member.role,
      permissions: member.permissions,
      addedAt: member.added_at,
      addedBy: member.added_by,
    };
  }

  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    const result = await query(
      `SELECT * FROM family_members WHERE family_id = $1 ORDER BY added_at`,
      [familyId]
    );

    return result.rows.map(row => ({
      id: row.id,
      familyId: row.family_id,
      userId: row.user_id,
      role: row.role,
      permissions: row.permissions,
      addedAt: row.added_at,
      addedBy: row.added_by,
    }));
  }

  async exportFamilyData(
    familyId: string,
    requestedBy: string,
    memberIds?: string[]
  ): Promise<any> {
    // Verify requester has export permission
    const hasPermission = await this.userHasPermission(
      requestedBy,
      familyId,
      'exportData'
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions to export family data');
    }

    const members = await this.getFamilyMembers(familyId);
    const targetMembers = memberIds
      ? members.filter(m => memberIds.includes(m.userId))
      : members;

    const familyData: any = {
      familyId,
      exportedAt: new Date().toISOString(),
      exportedBy: requestedBy,
      members: {},
    };

    // Export data for each member
    for (const member of targetMembers) {
      try {
        // Get user data (simplified - would use PrivacyService in production)
        const userData = await query(
          `SELECT id, email, name, created_at FROM users WHERE id = $1`,
          [member.userId]
        );

        const accounts = await query(
          `SELECT * FROM financial_accounts WHERE user_id = $1`,
          [member.userId]
        );

        const goals = await query(
          `SELECT * FROM financial_goals WHERE user_id = $1`,
          [member.userId]
        );

        familyData.members[member.userId] = {
          memberInfo: member,
          userData: userData.rows[0],
          accounts: accounts.rows,
          goals: goals.rows,
        };
      } catch (error) {
        console.error(
          `Failed to export data for member ${member.userId}:`,
          error
        );
        familyData.members[member.userId] = {
          memberInfo: member,
          error: 'Failed to export data',
        };
      }
    }

    return familyData;
  }

  async deleteFamilyMemberData(
    familyId: string,
    memberUserId: string,
    requestedBy: string
  ): Promise<{ success: boolean; receiptHash: string }> {
    // Verify requester has delete permission or is deleting their own data
    const hasPermission = await this.userHasPermission(
      requestedBy,
      familyId,
      'deleteData'
    );
    const isSelfDelete = requestedBy === memberUserId;

    if (!hasPermission && !isSelfDelete) {
      throw new Error('Insufficient permissions to delete member data');
    }

    return await transaction(async client => {
      // Remove from family
      await client.query(
        `DELETE FROM family_members WHERE family_id = $1 AND user_id = $2`,
        [familyId, memberUserId]
      );

      // Anonymize user data (simplified - would use PrivacyService in production)
      await client.query(
        `UPDATE users SET 
         email = $2,
         name = 'Deleted Family Member',
         is_active = false
         WHERE id = $1`,
        [memberUserId, `deleted+${memberUserId}@family.example.com`]
      );

      // Soft delete related data
      await client.query(
        `UPDATE financial_accounts SET is_active = false WHERE user_id = $1`,
        [memberUserId]
      );

      await client.query(
        `UPDATE financial_goals SET is_active = false WHERE user_id = $1`,
        [memberUserId]
      );

      const receiptHash = this.generateReceiptHash({
        familyId,
        memberUserId,
        deletedBy: requestedBy,
        deletedAt: new Date().toISOString(),
      });

      return { success: true, receiptHash };
    });
  }

  private async userHasPermission(
    userId: string,
    familyId: string,
    permission: keyof FamilyMember['permissions']
  ): Promise<boolean> {
    const result = await query(
      `SELECT permissions FROM family_members 
       WHERE family_id = $1 AND user_id = $2`,
      [familyId, userId]
    );

    if (result.rows.length === 0) return false;

    const permissions = result.rows[0].permissions;
    return permissions[permission] === true;
  }

  private generateReceiptHash(payload: Record<string, any>): string {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}

export const familyAccountService = new FamilyAccountService();
