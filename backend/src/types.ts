export type CertificateStatus = "ACTIVE" | "REVOKED" | "SUPERSEDED";

export interface CertificateRecord {
  certId: string;
  nim: string;
  name: string;
  majority: string;
  program: string;
  cid: string;
  hash: string;
  status: CertificateStatus;
  issuedAt: string; // ISO string, e.g. new Date().toISOString()
}
