import crypto from 'crypto';
import archiver from 'archiver';

export class ExportArchiveService {
  // Create a simple portability manifest without extra deps
  buildManifest(
    userId: string,
    formats: string[],
    counts: Record<string, number>
  ) {
    return {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      userId,
      formats,
      counts,
      checksum: this.hash(JSON.stringify({ userId, counts })),
    };
  }

  async buildZip(
    files: Array<{ name: string; content: string | Buffer }>
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('warning', (err: any) =>
        console.warn('Archive warning:', err)
      );
      archive.on('error', (err: any) => reject(err));
      archive.on('end', () => resolve(Buffer.concat(chunks)));

      files.forEach(f => archive.append(f.content, { name: f.name }));
      archive.finalize();
    });
  }

  hash(input: string) {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}

export const exportArchiveService = new ExportArchiveService();
