import { NextRequest, NextResponse } from "next/server";
import { deleteUserInSupabase } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const success = await deleteUserInSupabase(id);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Failed to delete user" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ok: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
