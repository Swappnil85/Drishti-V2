import PDFDocument from 'pdfkit';

export class ExportPdfService {
  async generateUserDataPdf(userId: string, data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).text('Drishti Data Export', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#555').text(`User ID: ${userId}`);
      doc.text(`Generated: ${new Date().toISOString()}`);
      doc.moveDown();
      doc.fillColor('#000');

      // Sections
      const addSection = (title: string) => {
        doc.moveDown();
        doc.fontSize(14).text(title, { underline: true });
        doc.moveDown(0.2);
      };

      // User profile
      addSection('Profile');
      const user = data.user || {};
      const profileLines = [
        `Email: ${user.email ?? 'N/A'}`,
        `Name: ${user.name ?? 'N/A'}`,
        `Created: ${user.created_at ?? 'N/A'}`,
        `Updated: ${user.updated_at ?? 'N/A'}`,
        `Active: ${user.is_active ?? 'N/A'}`,
      ];
      profileLines.forEach(line => doc.fontSize(11).text(line));

      // Accounts summary
      addSection('Accounts');
      const accounts = Array.isArray(data.accounts) ? data.accounts : [];
      doc.text(`Total accounts: ${accounts.length}`);
      accounts.slice(0, 10).forEach((acc: any, idx: number) => {
        doc.text(`${idx + 1}. ${acc.name ?? acc.id ?? 'Account'} — balance: ${acc.balance ?? 'N/A'}`);
      });
      if (accounts.length > 10) doc.text(`... and ${accounts.length - 10} more`);

      // Goals summary
      addSection('Goals');
      const goals = Array.isArray(data.goals) ? data.goals : [];
      doc.text(`Total goals: ${goals.length}`);
      goals.slice(0, 10).forEach((g: any, idx: number) => {
        doc.text(`${idx + 1}. ${g.name ?? g.id ?? 'Goal'} — target: ${g.target_amount ?? 'N/A'}`);
      });
      if (goals.length > 10) doc.text(`... and ${goals.length - 10} more`);

      // Scenarios summary
      addSection('Scenarios');
      const scenarios = Array.isArray(data.scenarios) ? data.scenarios : [];
      doc.text(`Total scenarios: ${scenarios.length}`);

      // Sessions summary (minimal)
      addSection('Sessions');
      const sessions = Array.isArray(data.sessions) ? data.sessions : [];
      doc.text(`Total sessions: ${sessions.length}`);

      // Footer
      doc.moveDown();
      doc.fontSize(9).fillColor('#777').text('Note: This is a human-readable summary. For full portability, use JSON/CSV export.', { align: 'left' });

      doc.end();
    });
  }
}

export const exportPdfService = new ExportPdfService();

