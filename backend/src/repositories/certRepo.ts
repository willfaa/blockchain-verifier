import { query } from "../config/db";
import { CertificateRecord } from "../types";

// Helper: Ubah snake_case DB ke camelCase App
const mapRowToCert = (row: any): CertificateRecord => {
  return {
    // Pastikan mapping ini sesuai dengan nama kolom di DB Anda
    certId: row.cert_id || row.id,
    nim: row.nim,
    name: row.name,
    majority: row.majority,
    program: row.program,
    cid: row.cid,
    hash: row.hash,
    status: row.status,
    issuedAt: row.issued_at,
    nonce: row.nonce,
    revokedAt: row.revoked_at,
    revocationReason: row.revocation_reason,
    supersededBy: row.superseded_by,
  };
};

export const saveCertificate = async (cert: CertificateRecord) => {
  console.log("Saving to DB. certId:", cert.certId, "| Status:", cert.status);

  // PERUBAHAN UTAMA DISINI: Menggunakan 'cert_id' bukan 'id'
  const text = `
    INSERT INTO certificates (
      cert_id, nim, name, majority, program, cid, hash, status, issued_at, nonce
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (cert_id) DO UPDATE SET
      status = EXCLUDED.status,
      hash = EXCLUDED.hash,
      cid = EXCLUDED.cid,
      nonce = EXCLUDED.nonce;
  `;

  const values = [
    cert.certId, // $1 -> Masuk ke kolom 'cert_id'
    cert.nim,
    cert.name,
    cert.majority,
    cert.program,
    cert.cid,
    cert.hash,
    cert.status,
    cert.issuedAt,
    cert.nonce,
  ];

  await query(text, values);
};

export const findCertificateById = async (
  certId: string
): Promise<CertificateRecord | null> => {
  // Ubah WHERE id menjadi WHERE cert_id
  const text = `SELECT * FROM certificates WHERE cert_id = $1`;

  const res = await query<any>(text, [certId]);

  if (res.length === 0) return null;
  return mapRowToCert(res[0]);
};

export const revokeCertificate = async (certId: string, reason: string) => {
  // Ubah WHERE id menjadi WHERE cert_id
  const text = `
    UPDATE certificates 
    SET status = 'REVOKED', 
        revoked_at = NOW(), 
        revocation_reason = $2
    WHERE cert_id = $1
  `;
  await query(text, [certId, reason]);
};
