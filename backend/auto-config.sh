#!/bin/bash

# --- DETECT FABRIC PATH ---
# Cek lokasi fabric-samples di HOME user saat ini
if [ -d "$HOME/fabric-samples/test-network" ]; then
    FABRIC_DIR="$HOME/fabric-samples/test-network"
elif [ -d "~/fabric-samples/test-network" ]; then
    FABRIC_DIR="~/fabric-samples/test-network"
else
    echo "❌ ERROR: Folder fabric-samples tidak ditemukan di $HOME atau ~/"
    echo "Mohon edit file ini dan set FABRIC_DIR ke lokasi yang benar."
    exit 1
fi

# Path Project (Otomatis deteksi folder saat ini)
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Memulai Otomasi Konfigurasi Backend..."

# 1. AMBIL SERTIFIKAT TERBARU (ORG1 & ORG2)
echo "🔑 Membaca Sertifikat dari: $FABRIC_DIR"

# Cek dulu apakah file ada (Debugging)
if [ ! -f "$FABRIC_DIR/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" ]; then
    echo "❌ ERROR: Sertifikat Org1 tidak ditemukan di path tersebut!"
    exit 1
fi

ORG1_PEM=$(cat "$FABRIC_DIR/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" | awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}')
ORG2_PEM=$(cat "$FABRIC_DIR/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" | awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}')

# 2. GENERATE CONNECTION PROFILE JSON
echo "📝 Menulis connection-org1.json ke: $BACKEND_DIR/fabric-network/"

cat <<EOF > "$BACKEND_DIR/fabric-network/connection-org1.json"
{
    "name": "test-network-org1",
    "version": "1.0.0",
    "client": {
        "organization": "Org1MSP",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                }
            }
        }
    },
    "organizations": {
        "Org1MSP": {
            "mspid": "Org1MSP",
            "peers": [
                "peer0.org1.example.com",
                "peer0.org2.example.com"
            ],
            "certificateAuthorities": [
                "ca.org1.example.com"
            ]
        }
    },
    "peers": {
        "peer0.org1.example.com": {
            "url": "grpcs://localhost:7051",
            "tlsCACerts": {
                "pem": "${ORG1_PEM}"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.org1.example.com",
                "hostnameOverride": "peer0.org1.example.com"
            }
        },
        "peer0.org2.example.com": {
            "url": "grpcs://localhost:9051",
            "tlsCACerts": {
                "pem": "${ORG2_PEM}"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.org2.example.com",
                "hostnameOverride": "peer0.org2.example.com"
            }
        }
    },
    "certificateAuthorities": {
        "ca.org1.example.com": {
            "url": "https://localhost:7054",
            "caName": "ca-org1",
            "tlsCACerts": {
                "pem": ["${ORG1_PEM}"]
            },
            "httpOptions": {
                "verify": false
            }
        }
    }
}
EOF

# 3. RESET WALLET
echo "🧹 Membersihkan Wallet Lama..."
rm -rf "$BACKEND_DIR/fabric-network/wallet"

echo "👤 Melakukan Enroll Admin & User Baru..."
cd "$BACKEND_DIR"
npx ts-node src/fabric/scripts/syncWallet.ts

echo "✅ SELESAI! Konfigurasi Org1 & Org2 berhasil update."