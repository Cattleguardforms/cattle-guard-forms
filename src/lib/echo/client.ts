type EchoConfig = {
  baseUrl: string;
  username: string;
  apiKey: string;
};

export function getEchoConfig(): EchoConfig {
  const baseUrl = process.env.ECHO_API_BASE_URL || "https://restapi.echo.com/v2";
  const username = process.env.ECHO_ACCOUNT_NUMBER;
  const apiKey = process.env.ECHO_API_KEY;

  if (!username || !apiKey) {
    throw new Error("Missing Echo environment variables. Set ECHO_ACCOUNT_NUMBER and ECHO_API_KEY.");
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    username,
    apiKey,
  };
}

export function getEchoAuthorizationHeader(config: EchoConfig) {
  const credentials = [config.username, config.apiKey].join(":");
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

export async function callEcho(path: string, init: RequestInit = {}) {
  const config = getEchoConfig();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(init.headers);

  headers.set("Authorization", getEchoAuthorizationHeader(config));
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${config.baseUrl}${normalizedPath}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function readEchoBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}
