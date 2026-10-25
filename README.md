# Chainnesa — Blockchain-Based LMS & Certificate Verifier

Chainnesa adalah platform **Learning Management System (LMS)** berbasis kejuruan (SMK) yang terintegrasi dengan teknologi **Blockchain (Hyperledger Fabric)** dan **Decentralized Storage (IPFS)** untuk penerbitan serta verifikasi sertifikat digital (termasuk Uji Kompetensi Keahlian / UKK) yang anti-pemalsuan (*tamper-proof*).

---

## 🚀 Fitur Utama

- **Learning Management System (LMS) & CBT**:
  - Manajemen materi pembelajaran berbasis modul, teks interaktif, dan video streaming.
  - Penugasan siswa dengan dukungan upload tugas ke cloud/IPFS.
  - Computer-Based Testing (CBT) dengan auto-grading dan evaluasi kompetensi.
- **UKK & Transkrip 2 Halaman (Standar Sertifikasi Kejuruan)**:
  - Halaman 1: Sertifikat kompetensi utama dengan custom background template dan tanda tangan pimpinan/asesor.
  - Halaman 2: Transkrip daftar unit kompetensi (SKKNI/LSP/DUDI) dengan penandatangan fleksibel (nama, identitas/NIP/NIDN, sub-label/peran) yang posisinya dinamis mengikuti panjang tabel nilai.
  - Live preview editor di Admin Dashboard tersinkronisasi presisi dengan Teacher Dashboard.
- **Dual-Layer Verification & Explorers**:
  - Verifikasi instan melalui scan QR code tanpa perlu login.
  - Audit trail transparan: SHA-256 hash matching, IPFS CID permanence, dan riwayat ledger Hyperledger Fabric.
- **Arsitektur Dual-Mode (Cloud Resilience & Blockchain Mode)**:
  - **Standalone Mode (`FABRIC_ENABLED=false`)**: Berjalan ringan tanpa container Hyperledger Fabric (cocok untuk deployment cloud cepat, presentasi UI/UX, dan demo evaluasi).
  - **Consortium Blockchain Mode (`FABRIC_ENABLED=true`)**: Sinkronisasi penuh ke node peer dan smart contract (chaincode) Hyperledger Fabric.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Recharts, Sonner.
- **Backend API**: Node.js, Express.js 5, TypeScript, Prisma ORM 7, Multer.
- **Database & Storage**: PostgreSQL (Supabase Connection Pooling), Supabase Storage Bucket (`lms`).
- **Distributed & Blockchain**: Hyperledger Fabric v2.5 (Channel: `chainnesa`, Go Chaincode), Pinata IPFS Cloud / Kubo IPFS Node.

---

## 📦 Panduan Instalasi & Implementasi Step-by-Step

Ikuti langkah-langkah berikut untuk mengimplementasikan proyek ini dari awal di perangkat baru:

### 1. Prasyarat Sistem
- **Node.js**: Versi `20.x` atau lebih baru (`node -v`)
- **NPM**: Versi `10.x` atau lebih baru (`npm -v`)
- **Docker Desktop & WSL2 Ubuntu**: *(Hanya diperlukan jika ingin mengaktifkan jaringan Hyperledger Fabric lokal)*

---

### 2. Clone Repository
```bash
git clone https://github.com/username/blockchain-verifier.git
cd blockchain-verifier
```

---

### 3. Setup Backend & Database

#### A. Install Dependencies
```bash
cd backend
npm install
```

#### B. Konfigurasi Environment (`backend/.env`)
Salin file template `.env.example`:
```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan nilainya:
- **`DATABASE_URL` & `DIRECT_URL`**: Buat project baru di [Supabase](https://supabase.com) (gratis). Buka menu **Project Settings > Database > Connection String** lalu salin connection URI pooler dan direct connection.
- **`SUPABASE_API_URL` & `SUPABASE_SERVICE_ROLE_KEY`**: Dari **Project Settings > API**, salin Project URL dan `service_role` key.
- **`PINATA_JWT`**: Dapatkan JWT Token dari [Pinata Cloud](https://pinata.cloud). *(Opsional jika hanya menggunakan penyimpanan Supabase).*
- **`FABRIC_ENABLED`**:
  - Set `false` jika **TIDAK** menjalankan Hyperledger Fabric di Docker/WSL.
  - Set `true` jika jaringan Fabric sudah menyala.

#### C. Inisialisasi Database (Prisma Push & Seed)
Jalankan migrasi skema tabel otomatis dan seeder data awal:
```bash
# Generate Prisma Client & buat semua tabel di Supabase
npx prisma db push

# Isi data awal (Akun Admin default & Master Kejuruan SMK)
npx prisma db seed
```
> **Akun Default Admin yang Dibuat:**
> - Email: `admin@chainnesa.com`
> - Password: `admin123`

#### D. Buat Bucket Storage di Supabase
1. Masuk ke dashboard Supabase Anda.
2. Buka menu **Storage** -> Klik **New Bucket**.
3. Beri nama: `lms`.
4. Pastikan toggle **Public Bucket** dalam keadaan **Aktif / ON**.

---

### 4. Setup Frontend

#### A. Install Dependencies
Buka terminal baru di root proyek:
```bash
cd frontend
npm install
```

#### B. Konfigurasi Environment (`frontend/.env.local`)
Salin file template `.env.example`:
```bash
cp .env.example .env.local
```
Sesuaikan variabel berikut pada `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

---

### 5. Menjalankan Aplikasi

Jalankan backend dan frontend secara bersamaan di terminal terpisah:

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Server aktif di: http://localhost:4000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Web app aktif di: http://localhost:3000
```

Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

---

## ⛓️ (Opsional) Setup Hyperledger Fabric Network

Jika Anda ingin menjalankan jaringan blockchain lokal:
1. Pastikan Docker Desktop berjalan dengan engine **WSL2 Ubuntu**.
2. Masuk ke environment WSL2:
   ```bash
   cd ~/fabric-samples/test-network
   ./network.sh up createChannel -c chainnesa -ca
   ```
3. Deploy chaincode Go yang berada pada direktori `chaincode-go/`:
   ```bash
   ./network.sh deployCC -ccn basic -ccp <path_to_chaincode-go> -ccl go -c chainnesa
   ```
4. Di terminal backend, jalankan script konfigurasi otomatis:
   ```bash
   cd backend
   ./auto-config.sh
   ```
5. Ubah `FABRIC_ENABLED=true` pada `backend/.env`.

*(Petunjuk lengkap troubleshooting dan manajemen container tersedia di file [petunjuk.txt](file:///c:/Users/willfaa/Documents/VSCode-Project/blockchain-verifier/petunjuk.txt)).*

---

## 🗂️ Struktur Direktori Proyek

```text
blockchain-verifier/
├── backend/
│   ├── prisma/             # Schema database Prisma & script seeding
│   ├── src/
│   │   ├── config/         # Konfigurasi database & environment
│   │   ├── controllers/    # Controller LMS, CBT, Sertifikat, Admin, Auth
│   │   ├── fabric/         # Client gRPC SDK Hyperledger Fabric
│   │   ├── middleware/     # Auth JWT & Multer upload middleware
│   │   ├── routes/         # Endpoint routing Express
│   │   ├── services/       # Generator gambar sertifikat & rendering PDF
│   │   ├── utils/          # Supabase storage handler, IPFS helper, Excel
│   │   └── index.ts        # Entrypoint server Express
│   ├── clean-uploads.js    # Garbage collector file upload yang tidak terpakai
│   └── auto-config.sh      # Otomasi sinkronisasi crypto material Fabric ke backend
├── frontend/
│   ├── app/                # Next.js 16 App Router (Admin, Teacher, Student, Verify)
│   ├── components/         # Reusable UI components & dialogs
│   ├── context/            # AuthContext & global state
│   └── lib/                # API fetcher & Supabase cloud resilience fallback
├── chaincode-go/           # Smart contract Hyperledger Fabric (Golang)
├── petunjuk.txt            # Dokumentasi teknis & cheat sheet operasional Fabric
└── reset-project-smart.sh  # Script maintenance reset ledger dengan proteksi data user
```

---

## 🛠️ Script Pemeliharaan (Maintenance)

| Script | Lokasi | Kegunaan |
|---|---|---|
| `npm run clean-uploads` | `backend/` | Memeriksa file `uploads/` fisik dan membandingkannya dengan DB (dry-run). |
| `npm run clean-uploads -- --force` | `backend/` | Menghapus permanen file upload lokal yang tidak lagi memiliki relasi di database. |
| `npm run reset:certs` | `backend/` | Mereset seluruh transaksi sertifikat (DB & Pinata IPFS) untuk pengujian baru. |
| `npm run sync:fabric` | `backend/` | Menyinkronkan ulang data sertifikat yang berstatus pending ke ledger Fabric. |
| `./reset-project-smart.sh` | Root | Mereset channel Hyperledger Fabric dan transaksi tanpa menghapus akun user. |

---

## 📄 Lisensi & Hak Cipta
Dikembangkan untuk ekosistem pendidikan kejuruan dan validasi kredensial berbasis teknologi blockchain terdesentralisasi.
