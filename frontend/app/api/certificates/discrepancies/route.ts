import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // In serverless cloud mode, discrepancies are 0
  return NextResponse.json({
    ok: true,
    data: [],
    discrepancies: [],
  });
}
