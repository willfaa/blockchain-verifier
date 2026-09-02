import { NextRequest, NextResponse } from "next/server";
import { updateUserStatusInSupabase } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; action: string }> }
) {
  const { id, action } = await context.params;

  let updatePayload: Record<string, any> = {};

  switch (action) {
    case "approve":
      updatePayload = { isApproved: true, isActive: true };
      break;
    case "verify":
      updatePayload = { isVerified: true, isApproved: true };
      break;
    case "unverify":
      updatePayload = { isVerified: false };
      break;
    case "ban":
      updatePayload = { isActive: false };
      break;
    case "unban":
      updatePayload = { isActive: true };
      break;
    default:
      return NextResponse.json(
        { ok: false, error: `Unknown user action: ${action}` },
        { status: 400 }
      );
  }

  try {
    const success = await updateUserStatusInSupabase(id, updatePayload);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Failed to update user status" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ok: true,
      message: `User ${action} action applied successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
