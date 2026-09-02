import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByIdentifier, updateUserSession } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password, role } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { ok: false, error: "Identifier and password are required" },
        { status: 400 }
      );
    }

    const user = await findUserByIdentifier(identifier);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 401 }
      );
    }

    // Password Check
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    // Role Check
    if (role && user.role !== role) {
      return NextResponse.json(
        {
          ok: false,
          error: `Access Denied: You are not a ${role}. Please switch to the ${user.role} login.`,
        },
        { status: 403 }
      );
    }

    // Status Active Check
    if (user.isActive === false) {
      return NextResponse.json(
        { ok: false, error: "Your account has been deactivated. Contact Admin." },
        { status: 403 }
      );
    }

    // Approval Check
    if (user.isApproved === false) {
      return NextResponse.json(
        {
          ok: false,
          error: "Account pending approval. Please wait for Admin confirmation.",
        },
        { status: 403 }
      );
    }

    const currentSessionId = crypto.randomUUID();
    await updateUserSession(user.id, currentSessionId);

    const uniqueId = user.email || user.studentId || user.nip;
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        identifier: uniqueId,
        sessionId: currentSessionId,
      },
      process.env.JWT_SECRET || "unesa_blockchain_secret_jwt_key_2026",
      { expiresIn: "24h" }
    );

    const { password: _, ...userSafe } = user;

    return NextResponse.json({
      ok: true,
      user: {
        ...userSafe,
        currentSessionId,
        token,
      },
    });
  } catch (error: any) {
    console.error("[Serverless Login Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
