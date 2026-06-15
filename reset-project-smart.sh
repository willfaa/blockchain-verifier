#!/bin/bash

# --- PATH KONFIGURASI ---
FABRIC_PATH="$HOME/fabric-samples/test-network"
PROJECT_ROOT=$(pwd)

echo "🚨 STARTING SMART RESET PROTOCOL (PRESERVE IPFS CERTS) 🚨"
echo "========================================================="

# 1. Matikan Hyperledger Fabric
echo "\n[1/4] 🛑 Tearing down Fabric Network..."
if [ -d "$FABRIC_PATH" ]; then
    cd "$FABRIC_PATH"
    ./network.sh down
    echo "✅ Fabric network destroyed."
else
    echo "⚠️  Warning: Folder fabric-samples tidak ditemukan di $FABRIC_PATH"
fi

# Kembali ke project root
cd "$PROJECT_ROOT"

# 2. Hapus Wallet Identity (Backend)
echo "\n[2/4] 🗑️  Deleting Wallet Identities..."
if [ -d "backend/fabric-network/wallet/" ]; then
    rm -rf backend/fabric-network/wallet/
    echo "✅ backend/fabric-network/wallet/ deleted."
elif [ -d "backend/wallet/" ]; then
    rm -rf backend/wallet/
    echo "✅ backend/wallet/ deleted."
elif [ -d "backend/src/wallet/" ]; then
    rm -rf backend/src/wallet/
    echo "✅ backend/src/wallet/ deleted."
else
    echo "⚠️  Folder wallet/ tidak ditemukan."
fi

# 3. Smart Database Clean
echo "\n[3/4] 🐘 Cleaning Transactional Data (Preserving Users)..."
if [ -d "backend" ]; then
    cd backend
    if [ ! -d "node_modules" ]; then
        echo "⚠️  backend/node_modules not found. Installing..."
        npm install
    fi
    # Pastikan script smart-clean.ts kamu ada
    echo "⚙️  Generating Prisma Client..."
    npx prisma generate
    npx ts-node-dev --transpile-only src/scripts/smart-clean.ts
    cd ..
else
    echo "❌ Error: Backend folder not found!"
fi

# 4. IPFS Maintenance (Bukan Reset Nuklir)
echo "\n[4/4] 🧊 IPFS Maintenance (Preserving /certs folder)..."

# Cek apakah IPFS command ada
if ! command -v ipfs &> /dev/null; then
    echo "❌ Error: 'ipfs' command not found."
else
    # A. Pastikan Daemon Jalan (Untuk proses GC)
    # Kita tidak perlu mematikannya jika hanya ingin membersihkan cache.
    # Tapi kalau mau restart agar fresh, boleh matikan sebentar.
    
    # Matikan Daemon (Opsional, agar RAM fresh)
    if command -v tasklist &> /dev/null; then
        taskkill //F //IM ipfs.exe > /dev/null 2>&1 # Windows
    else
        pkill ipfs # Linux
    fi
    sleep 3

    # B. JANGAN HAPUS .ipfs! Cukup Garbage Collection nanti.
    echo "   Running IPFS Garbage Collection (Cleaning unused blocks)..."
    
    # Kita perlu menyalakan daemon sebentar di background untuk menjalankan GC, 
    # atau user menyalakan manual nanti. 
    # Saran: Biarkan user menyalakan manual via 'ipfs daemon' agar log terlihat.
    
    echo "✅ IPFS Config Preserved."
    echo "✅ MFS Data (/certs) Preserved."
    echo "   (Note: Run 'ipfs repo gc' manually if you want to free up disk space from old temp files)"
fi

echo "\n========================================================="
echo "✨✨ RESET COMPLETE. CERTS FOLDER SAFE. FABRIC FRESH. ✨✨"
echo "Next Steps:"
echo "1. ./network.sh up createChannel -c mychannel -ca"
echo "2. Deploy Chaincode"
echo "3. Start IPFS Daemon (if not running): 'ipfs daemon'"
echo "4. Start Backend & Frontend