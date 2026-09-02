import { NextRequest, NextResponse } from "next/server";
import { fetchUsersByRoleFromSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "";
    const search = searchParams.get("search") || "";

    const users = await fetchUsersByRoleFromSupabase(role, search);
    return NextResponse.json({
      ok: true,
      data: users,
      total: users.length,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: true, data: [], total: 0 });
  }
}
