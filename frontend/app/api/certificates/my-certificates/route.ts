import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { findUserById, fetchStudentCertificatesFromSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "unesa_blockchain_secret_jwt_key_2026"
      );
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await findUserById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const certs = await fetchStudentCertificatesFromSupabase(
      user.studentId || user.id
    );

    return NextResponse.json({
      ok: true,
      data: certs,
    });
  } catch (error: any) {
    console.error("[Serverless My Certificates Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch certificates" },
      { status: 500 }
    );
  }
}
