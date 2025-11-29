// src/certRepo.ts
import { query } from "./db";
import { CertificateRecord } from "./types";

export async function saveCertificate(
  record: CertificateRecord
): Promise<void> {
  await query(
    `
    INSERT INTO certificates
      (cert_id, nim, name, majority, program, cid, hash, status, issued_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (cert_id) DO UPDATE SET
      nim = EXCLUDED.nim,
      name = EXCLUDED.name,
      majority = EXCLUDED.majority,
      program = EXCLUDED.program,
      cid = EXCLUDED.cid,
      hash = EXCLUDED.hash,
      status = EXCLUDED.status,
      issued_at = EXCLUDED.issued_at,
      updated_at = NOW()
    `,
    [
      record.certId,
      record.nim,
      record.name,
      record.majority,
      record.program,
      record.cid,
      record.hash,
      record.status,
      record.issuedAt,
    ]
  );
}

export async function findCertificateById(
  certId: string
): Promise<CertificateRecord | null> {
  const rows = await query<{
    cert_id: string;
    nim: string;
    name: string;
    majority: string;
    program: string;
    cid: string;
    hash: string;
    status: string;
    issued_at: string;
  }>(
    `
    SELECT cert_id, nim, name, majority, program, cid, hash, status, issued_at
    FROM certificates
    WHERE cert_id = $1
    LIMIT 1
    `,
    [certId]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    certId: row.cert_id,
    nim: row.nim,
    name: row.name,
    majority: row.majority,
    program: row.program,
    cid: row.cid,
    hash: row.hash,
    status: row.status as any,
    issuedAt: row.issued_at,
  };
}

export async function revokeCertificate(
  certId: string,
  reason: string
): Promise<void> {
  await query(
    `
    UPDATE certificates
    SET status = 'REVOKED',
        revoked_at = NOW(),
        revocation_reason = $1
    WHERE cert_id = $2
    `,
    [reason, certId]
  );
}

// backend/src/certRepo.ts
export async function supersedeCertificate(
  oldCertId: string,
  newCertId: string
): Promise<void> {
  // update cert lama
  await query(
    `
    UPDATE certificates
    SET status = 'SUPERSEDED',
        superseded_by = $1
    WHERE cert_id = $2
    `,
    [newCertId, oldCertId]
  );

  // pastikan cert baru ACTIVE
  await query(
    `
    UPDATE certificates
    SET status = 'ACTIVE'
    WHERE cert_id = $1
    `,
    [newCertId]
  );
}
