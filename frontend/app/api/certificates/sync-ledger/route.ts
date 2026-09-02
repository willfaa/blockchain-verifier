import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Node Hyperledger Fabric (Docker WSL) saat ini tidak terhubung ke Cloud. Untuk menyinkronkan antrean, jalankan 'npm run sync:fabric' di terminal backend lokal atau sambungkan tunnel Ngrok.",
    },
    { status: 503 }
  );
}
