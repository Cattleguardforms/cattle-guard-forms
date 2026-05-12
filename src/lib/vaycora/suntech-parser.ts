import type { NormalizedSunTechPayload, RawPayloadStatus } from "./types";

type ParserResult = {
  status: RawPayloadStatus;
  normalized?: NormalizedSunTechPayload;
  error?: string;
};

function pickString(input: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function pickNumber(input: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function pickBoolean(input: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["1", "true", "on", "yes", "ignition_on"].includes(normalized)) return true;
      if (["0", "false", "off", "no", "ignition_off"].includes(normalized)) return false;
    }
  }
  return undefined;
}

function parseJsonPayload(rawPayload: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(rawPayload) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

function parseKeyValuePayload(rawPayload: string): Record<string, unknown> | undefined {
  const separators = rawPayload.includes(";") ? ";" : rawPayload.includes("|") ? "|" : ",";
  const pairs = rawPayload.split(separators).map((part) => part.trim()).filter(Boolean);
  const output: Record<string, unknown> = {};

  for (const pair of pairs) {
    const [rawKey, ...rawValue] = pair.includes("=") ? pair.split("=") : pair.split(":");
    if (!rawKey || rawValue.length === 0) continue;
    output[rawKey.trim()] = rawValue.join("=").trim();
  }

  return Object.keys(output).length > 0 ? output : undefined;
}

export function parseSunTechPayload(rawPayload: string): ParserResult {
  const source = parseJsonPayload(rawPayload) ?? parseKeyValuePayload(rawPayload);

  if (!source) {
    return {
      status: "failed",
      error: "Payload is not JSON or supported key-value text. Replace this parser once the official SunTech protocol document is received.",
    };
  }

  const deviceIdentifier = pickString(source, ["device_identifier", "deviceId", "device_id", "imei", "IMEI", "serial", "unit", "id"]);

  if (!deviceIdentifier) {
    return {
      status: "failed",
      error: "Could not find a device identifier/IMEI in payload.",
    };
  }

  const timestamp = pickString(source, ["timestamp", "time", "eventTime", "event_time", "recordedAt", "recorded_at"]) ?? new Date().toISOString();
  const latitude = pickNumber(source, ["latitude", "lat", "gps_lat", "y"]);
  const longitude = pickNumber(source, ["longitude", "lng", "lon", "gps_lng", "x"]);

  return {
    status: "parsed",
    normalized: {
      deviceIdentifier,
      timestamp,
      latitude,
      longitude,
      speedMph: pickNumber(source, ["speedMph", "speed_mph", "speed"]),
      heading: pickNumber(source, ["heading", "course", "bearing"]),
      ignitionStatus: pickBoolean(source, ["ignitionStatus", "ignition_status", "ignition", "ign"]),
      batteryVoltage: pickNumber(source, ["batteryVoltage", "battery_voltage", "externalBattery", "battery_v"]),
      internalBatteryLevel: pickNumber(source, ["internalBatteryLevel", "internal_battery_level", "battery", "batteryPercent", "battery_percent"]),
      externalPowerStatus: pickBoolean(source, ["externalPowerStatus", "external_power_status", "externalPower", "power"]),
      eventCode: pickString(source, ["eventCode", "event_code", "event"]),
      rawEventName: pickString(source, ["rawEventName", "raw_event_name", "eventName", "event_name"]),
    },
  };
}

export function normalizePayloadFormat(rawPayload: string) {
  if (parseJsonPayload(rawPayload)) return "json" as const;
  if (parseKeyValuePayload(rawPayload)) return "text" as const;
  return "unknown" as const;
}
