// backend/src/types.ts

// Status sesuai Smart Contract + PENDING untuk Database Transaction
export type CertificateStatus =
  | "ACTIVE" // Legacy/Default
  | "REVOKED" // Sesuai Fabric
  | "SUPERSEDED" // Sesuai Fabric
  | "PENDING" // Status Transisi (Saat masuk DB tapi belum masuk Blockchain)
  | "ISSUED"; // Status Final di Blockchain

export interface CertificateRecord {
  certId: string;
  nisn: string;
  name: string;
  majority: string; // Jurusan
  program: string;
  cid: string; // IPFS Content ID
  hash: string; // IPFS Hash / File Hash
  status: CertificateStatus;
  issuedAt: string;
  nonce: string;
  // nisn removed (merged)

  // Field Opsional (Diisi saat Revoke/Supersede)
  supersededBy?: string | null;
  revokedAt?: string; // Tambahan: Waktu pencabutan
  revocationReason?: string; // Tambahan: Alasan pencabutan
}

export interface HistoryEvent {
  txId: string;
  action: "ISSUE" | "REVOKE" | "SUPERSEDE" | "UPDATE";
  timestamp: string;
  payload: Partial<CertificateRecord> & {
    reason?: string;
    oldId?: string;
    newId?: string;
  };
}

// Alias for CertRecord widely used in other files
export type CertRecord = CertificateRecord;

// UPDATE: Tambahkan role 'admin'
export type UserRole = "student" | "teacher" | "admin";

export interface UserBase {
  id?: number;
  identifier: string; // PENTING: Username login (admin/nisn/nip)
  name: string;
  email?: string; // Opsional
  role: UserRole;
  password?: string; // hashed
}

export interface Student extends UserBase {
  role: "student";
  nisn: string;
  majority: string;
  program: string;
  // nisn removed (merged)
}

export interface Teacher extends UserBase {
  role: "teacher";
  nip: string;
  lectureMajority: string;
}

export interface Admin extends UserBase {
  role: "admin";
  // Admin mungkin tidak butuh field akademik spesifik
}

// Union Type User sekarang mencakup Admin
export type User = Student | Teacher | Admin;

export interface RegisterPayload {
  role: UserRole;
  identifier: string; // Wajib ada untuk login
  name: string;
  password: string;
  email?: string;

  // Student specific

  majority?: string;
  program?: string;

  // Teacher specific
  nip?: string;
  lectureMajority?: string;
}
