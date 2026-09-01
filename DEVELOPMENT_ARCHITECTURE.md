# 🏛️ Arsitektur Sistem & Panduan Development (Cloud & Lokal)

Dokumen ini menjelaskan pembagian arsitektur antara **Cloud Services** (data persisten) dan **Lokal Environment** (development, testing, dan Hyperledger Fabric).

---

## 1. Diagram Arsitektur Hybrid

```
┌────────────────────────────────────────────────────────────────────────┐
│                          ☁️ CLOUD SERVICES                             │
│                                                                        │
│  1. Supabase Cloud (PostgreSQL & Storage)                              │
│     • URL: aws-1-ap-southeast-2.pooler.supabase.com                    │
│     • Fungsi: Menyimpan user, materi kursus, transkrip SKKNI, snapshot │
│                                                                        │
│  2. Pinata Cloud (IPFS Decentralized Gateway)                          │
│     • URL: https://gateway.pinata.cloud / api.pinata.cloud             │
│     • Fungsi: Menyimpan file gambar sertifikat (CID terdesentralisasi) │
│                                                                        │
│  3. Vercel Cloud (Frontend Next.js Production)                         │
│     • URL: https://blockchain-verifier-*.vercel.app                    │
│     • NEXT_PUBLIC_API_BASE: Menembak URL Ngrok / VPS                   │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ (Internet HTTPS / REST API)
┌───────────────────────────────────┴────────────────────────────────────┐
│                    💻 LOKAL LAPTOP (Dev & Test)                        │
│                                                                        │
│  1. Backend API (Node.js Express - Port 4000)                          │
│     • Terkoneksi ke Supabase Cloud (Database & Storage)                │
│     • Terkoneksi ke Pinata Cloud (IPFS Pinning)                        │
│     • Terkoneksi ke Hyperledger Fabric (Docker gRPC TLS)               │
│                                                                        │
│  2. Hyperledger Fabric Blockchain Network (Docker Containers)          │
│     • peer0.org1.example.com:7051 (Anchor Peer Org1)                  │
│     • ca_org1:7054 (Certificate Authority & MSP X.509)                 │
│     • orderer.example.com:7050 (Raft Consensus Ordering)               │
│     • Smart Contract: chaincode-go (Channel: mychannel)                │
│                                                                        │
│  3. Ngrok Tunnel (Port Forwarding Port 4000 -> Internet)               │
│     • ngrok http 4000                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Ringkasan Variabel Lingkungan (.env)

### A. Backend (`backend/.env`)
| Variabel | Nilai / Sumber | Keterangan |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase Cloud Connection String | Terhubung langsung ke database cloud |
| `SUPABASE_API_URL` | `https://pitbddduxxntkhawzxrr.supabase.co` | REST API Supabase |
| `PINATA_JWT` | JWT Pinata Cloud | Autentikasi IPFS Pinning |
| `FABRIC_ENABLED` | `true` | Mengaktifkan modul Hyperledger Fabric |
| `ISSUE_STRICT` | `false` | **Hybrid Mode**: Jika Fabric offline, tetap simpan ke Supabase (status `PENDING_SYNC`) |
| `PORT` | `4000` | Port lokal backend |

### B. Frontend (`frontend/.env.local` / Vercel Environment)
| Variabel | Lokal (`.env.local`) | Production (Vercel Dashboard) |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE` | `http://localhost:4000` | `https://<subdomain>.ngrok-free.app` |
| `NEXT_PUBLIC_IPFS_GATEWAY` | `https://ipfs.io` | `https://gateway.pinata.cloud` |

---

## 3. Alur Kerja Harian (Development, Testing & Commit)

### Langkah 1: Nyalakan Docker Blockchain di Laptop
Buka Docker Desktop, lalu pastikan container Fabric berjalan:
```powershell
docker ps
# Pastikan container peer0.org1, ca_org1, orderer aktif
```

### Langkah 2: Jalankan Backend
Di terminal VS Code:
```powershell
cd backend
npm run dev
```
*Backend akan mencetak log koneksi sukses ke Supabase, Pinata, dan Fabric.*

### Langkah 3: Jalankan Port Forwarding Ngrok (Untuk Vercel / Remote Testing)
Di terminal terpisah:
```powershell
ngrok http 4000
```
Salin URL forwarding (contoh: `https://abcd-123.ngrok-free.app`) dan masukkan ke pengaturan Environment Variable Vercel: `NEXT_PUBLIC_API_BASE`.

### Langkah 4: Uji Coba Fitur di Frontend
- Jalankan frontend lokal: `npm run dev` (di folder `frontend`) atau buka URL Vercel.
- Lakukan pengujian:
  1. Terbitkan Sertifikat UKK (Mode Standar atau Mode Tempel QR).
  2. Kelola Unit SKKNI di menu Guru (`/teacher/courses/.../competency-units`).
  3. Cek hasil verifikasi di `/verify/[id]`.
  4. Unduh PDF 2 Halaman (Duplex Print Ready).

### Langkah 5: Commit dan Push ke Git
Setelah fitur terbukti stabil di lokal:
```powershell
git add .
git commit -m "feat: ukk duplex certificate and skkni management"
git push origin main
```

---

## 4. Keunggulan Arsitektur Ini
1. **Zero Data Loss**: Mematikan laptop tidak akan menghapus data siswa, kursus, maupun riwayat sertifikat karena database dan gambar tersimpan di Supabase & Pinata Cloud.
2. **Resilience**: Jika Anda sedang ngoding tanpa menyalakan Docker Fabric, sistem tetap berjalan normal berkat mode `ISSUE_STRICT=false` (Mirror Ledger).
3. **Produksi Siap (Production-Ready)**: Saat nanti Anda ingin memindahkan blockchain ke server VPS, Anda hanya perlu memindahkan container Docker ke VPS tanpa mengubah kode aplikasi.
