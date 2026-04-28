import { NextResponse } from "next/server";
import { callEcho, readEchoBody } from "@/lib/echo/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const response = await callEcho("/ping", { method: "GET" });
    const body = await readEchoBody(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          echoReachable: false,
          status: response.status,
          statusText: response.statusText,
          echoResponse: body,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      echoReachable: true,
      status: response.status,
      echoResponse: body,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        echoReachable: false,
        error: error instanceof Error ? error.message : "Echo ping failed.",
      },
      { status: 500 },
    );
  }
}
