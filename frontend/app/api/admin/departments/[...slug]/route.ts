import { NextRequest, NextResponse } from "next/server";

const SUPABASE_API_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_API_URL ||
  "https://pitbddduxxntkhawzxrr.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdGJkZGR1eHhudGtoYXd6eHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzMTgyMywiZXhwIjoyMDk3NjA3ODIzfQ.3GVskVCDS5fBR2L0rr8RPwB_kzpl7YY37SC3sop1sdA";

const getHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
});

const getTable = (level: string) => {
  if (level === "bidang") return "bidang_keahlian";
  if (level === "program") return "program_keahlian";
  if (level === "konsentrasi") return "konsentrasi_keahlian";
  return "bidang_keahlian";
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const level = slug[0] || "bidang";
  const table = getTable(level);

  try {
    const res = await fetch(`${SUPABASE_API_URL}/rest/v1/${table}?select=*&order=name.asc`, {
      headers: getHeaders(),
      cache: "no-store",
    });
    const data = res.ok ? await res.json() : [];
    return NextResponse.json({ ok: true, data: Array.isArray(data) ? data : [] });
  } catch (error: any) {
    return NextResponse.json({ ok: true, data: [] });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const level = slug[0] || "bidang";
  const table = getTable(level);

  try {
    const body = await request.json();
    const res = await fetch(`${SUPABASE_API_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...getHeaders(), Prefer: "return=representation" },
      body: JSON.stringify({ id: crypto.randomUUID(), ...body }),
    });
    const data = await res.json();
    return NextResponse.json({ ok: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const level = slug[0] || "bidang";
  const id = slug[1];
  const table = getTable(level);

  if (!id) return NextResponse.json({ ok: false, error: "Missing ID" }, { status: 400 });

  try {
    const body = await request.json();
    const res = await fetch(`${SUPABASE_API_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...getHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json({ ok: true, data: Array.isArray(data) ? data[0] : data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const level = slug[0] || "bidang";
  const id = slug[1];
  const table = getTable(level);

  if (!id) return NextResponse.json({ ok: false, error: "Missing ID" }, { status: 400 });

  try {
    await fetch(`${SUPABASE_API_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return NextResponse.json({ ok: true, message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
