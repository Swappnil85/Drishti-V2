import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Email configuration
export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

// Password validation result
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

// Email verification token
export interface EmailVerificationToken {
  token: string;
  expiresAt: Date;
}

// Password reset token
export interface PasswordResetToken {
  token: string;
  expiresAt: Date;
}

// Email authentication service
export class EmailAuthService {
  private emailConfig: EmailConfig | null;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.emailConfig = this.getEmailConfig();
    if (this.emailConfig) {
      this.initializeTransporter();
    }
  }

  private getEmailConfig(): EmailConfig | null {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const fromEmail = process.env.FROM_EMAIL;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !fromEmail) {
      console.warn(
        '[Email Auth] SMTP configuration missing. Email features will be disabled.'
      );
      return null;
    }

    return {
      smtpHost,
      smtpPort: parseInt(smtpPort, 10),
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser,
      smtpPassword,
      fromEmail,
      fromName: process.env.FROM_NAME || 'Drishti',
    };
  }

  private initializeTransporter(): void {
    if (!this.emailConfig) return;

    this.transporter = nodemailer.createTransport({
      host: this.emailConfig.smtpHost,
      port: this.emailConfig.smtpPort,
      secure: this.emailConfig.smtpSecure,
      auth: {
        user: this.emailConfig.smtpUser,
        pass: this.emailConfig.smtpPassword,
      },
    });
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Validate password strength
  validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain repeated characters');
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      errors.push('Password cannot contain common patterns');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generate email verification token
  generateEmailVerificationToken(): EmailVerificationToken {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return { token, expiresAt };
  }

  // Generate password reset token
  generatePasswordResetToken(): PasswordResetToken {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    return { token, expiresAt };
  }

  // Send email verification email
  async sendEmailVerification(
    email: string,
    name: string,
    token: string
  ): Promise<void> {
    if (!this.transporter || !this.emailConfig) {
      console.warn(
        '[Email Auth] Email not configured, skipping verification email'
      );
      return;
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"${this.emailConfig.fromName}" <${this.emailConfig.fromEmail}>`,
      to: email,
      subject: 'Verify your Drishti account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Drishti, ${name}!</h2>
          <p>Thank you for creating your account. Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[Email Auth] Verification email sent to ${email}`);
    } catch (error) {
      console.error('[Email Auth] Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Send password reset email
  async sendPasswordReset(
    email: string,
    name: string,
    token: string
  ): Promise<void> {
    if (!this.transporter || !this.emailConfig) {
      console.warn(
        '[Email Auth] Email not configured, skipping password reset email'
      );
      return;
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"${this.emailConfig.fromName}" <${this.emailConfig.fromEmail}>`,
      to: email,
      subject: 'Reset your Drishti password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password for your Drishti account. Click the button below to reset it:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This reset link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[Email Auth] Password reset email sent to ${email}`);
    } catch (error) {
      console.error('[Email Auth] Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Check if email service is configured
  isConfigured(): boolean {
    return this.emailConfig !== null && this.transporter !== null;
  }

  // Test email configuration
  async testEmailConfiguration(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('[Email Auth] Email configuration test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailAuthService = new EmailAuthService();
