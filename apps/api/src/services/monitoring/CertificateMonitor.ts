import https from 'https';

export interface CertInfo {
  valid_from?: string;
  valid_to?: string;
  subject?: any;
  issuer?: any;
  fingerprint256?: string;
}

export class CertificateMonitor {
  async fetchServerCertificate(host: string, port = 443): Promise<CertInfo> {
    return new Promise((resolve, reject) => {
      try {
        const req = https.request({ host, port, method: 'GET' }, res => {
          const anySocket = res.socket as any;
          const cert =
            anySocket && typeof anySocket.getPeerCertificate === 'function'
              ? anySocket.getPeerCertificate(true)
              : {};
          resolve({
            valid_from: (cert as any).valid_from,
            valid_to: (cert as any).valid_to,
            subject: (cert as any).subject,
            issuer: (cert as any).issuer,
            fingerprint256: (cert as any).fingerprint256,
          });
          res.resume();
        });
        req.on('error', reject);
        req.end();
      } catch (e) {
        reject(e);
      }
    });
  }

  async fetchCTEntries(domain: string): Promise<any[]> {
    const url = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`;
    return new Promise((resolve, reject) => {
      https
        .get(url, res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(Array.isArray(json) ? json : []);
            } catch (e) {
              resolve([]);
            }
          });
        })
        .on('error', reject);
    });
  }
}

export const certificateMonitor = new CertificateMonitor();
