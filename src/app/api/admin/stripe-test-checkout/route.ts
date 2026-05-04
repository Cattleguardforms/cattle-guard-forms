import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Sandbox checkout is disabled in live mode. Use normal customer or distributor checkout." },
    { status: 410 },
  );
}
