import { NextRequest, NextResponse } from "next/server";

const SUPABASE_API_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_API_URL ||
  "https://pitbddduxxntkhawzxrr.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdGJkZGR1eHhudGtoYXd6eHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzMTgyMywiZXhwIjoyMDk3NjA3ODIzfQ.3GVskVCDS5fBR2L0rr8RPwB_kzpl7YY37SC3sop1sdA";

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${SUPABASE_API_URL}/rest/v1/certificates?select=id,blockchainSyncStatus`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ ok: true, stats: { total: 0, synced: 0, pending: 0, failed: 0 } });
    }

    const certs = await res.json();
    const total = Array.isArray(certs) ? certs.length : 0;
    const synced = Array.isArray(certs) ? certs.filter((c: any) => c.blockchainSyncStatus === "SYNCED").length : 0;
    const pending = Array.isArray(certs) ? certs.filter((c: any) => c.blockchainSyncStatus === "PENDING_SYNC").length : 0;
    const failed = Array.isArray(certs) ? certs.filter((c: any) => c.blockchainSyncStatus === "FAILED").length : 0;

    return NextResponse.json({
      ok: true,
      stats: { total, synced, pending, failed },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: true, stats: { total: 0, synced: 0, pending: 0, failed: 0 } });
  }
}
