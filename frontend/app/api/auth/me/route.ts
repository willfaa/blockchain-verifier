import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { findUserById } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid authorization header" },
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
        { ok: false, error: "Invalid or expired token" },
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

    const { password: _, ...userSafe } = user;

    return NextResponse.json({
      ok: true,
      user: userSafe,
    });
  } catch (error: any) {
    console.error("[Serverless Me Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Authentication check failed" },
      { status: 500 }
    );
  }
}
