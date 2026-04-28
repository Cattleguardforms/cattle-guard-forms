import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getEchoConfig() {
  const baseUrl = process.env.ECHO_API_BASE_URL || "https://restapi.echo.com/v2";
  const accountNumber = process.env.ECHO_ACCOUNT_NUMBER;
  const apiKey = process.env.ECHO_API_KEY;

  if (!accountNumber || !apiKey) {
    throw new Error("Missing Echo environment variables. Set ECHO_ACCOUNT_NUMBER and ECHO_API_KEY.");
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    accountNumber,
    apiKey,
  };
}

function buildAuthHeader(accountNumber: string, apiKey: string) {
  return `Basic ${Buffer.from(`${accountNumber}:${apiKey}`).toString("base64")}`;
}

export async function GET() {
  try {
    const config = getEchoConfig();
    const response = await fetch(`${config.baseUrl}/ping`, {
      method: "GET",
      headers: {
        Authorization: buildAuthHeader(config.accountNumber, config.apiKey),
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();

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
