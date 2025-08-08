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
      const req = https.request({ host, port, method: 'GET' }, res => {
        const cert = res.socket.getPeerCertificate(true);
        resolve({
          valid_from: cert.valid_from,
          valid_to: cert.valid_to,
          subject: cert.subject,
          issuer: cert.issuer,
          fingerprint256: cert.fingerprint256,
        });
        res.resume();
      });
      req.on('error', reject);
      req.end();
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
