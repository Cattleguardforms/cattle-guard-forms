export type PortalKey = "admin" | "fleet" | "assets" | "sanitation" | "rv" | "custody" | "livestock";

export type TenantStatus = "active" | "trial" | "inactive" | "suspended";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  enabledPortals: PortalKey[];
};

export type UserRole = "platform_admin" | "tenant_admin" | "manager" | "viewer" | "technician";

export type DeviceStatus = "unassigned" | "assigned" | "installed" | "active" | "offline" | "retired" | "suspended";

export type DeviceModel =
  | "ST4505T"
  | "ST4505TE"
  | "ST4505DO"
  | "ST6560/E"
  | "ST4955LCBW"
  | "ST4915LCBF"
  | "ST4345LB"
  | "ST4345R"
  | "ST4335"
  | "ST4335 Plus"
  | "ST4335E"
  | "ST4215/U"
  | "ST4315/U/W"
  | "ST4230"
  | "ST4280"
  | "ST4290/L"
  | "ST4410G"
  | "ST4932"
  | "ST9730"
  | "QTS 110"
  | "QTS 112"
  | "Unknown SunTech Device";

export type AssetType = "vehicle" | "rv" | "trailer" | "container" | "porta_potty" | "equipment" | "generator" | "livestock" | "tank" | "site" | "generic_asset";

export type AssetStatus = "active" | "idle" | "alert" | "offline" | "service_due";

export type Device = {
  id: string;
  tenantId: string;
  deviceIdentifier: string;
  imei: string;
  serialNumber?: string;
  manufacturer: "SunTech" | "Qualcomm" | "Unknown";
  model: DeviceModel;
  simIccid?: string;
  phoneNumber?: string;
  firmwareVersion?: string;
  status: DeviceStatus;
  lastSeenAt?: string;
  lastPayloadAt?: string;
};

export type Asset = {
  id: string;
  tenantId: string;
  assetType: AssetType;
  name: string;
  displayIdentifier: string;
  status: AssetStatus;
  assignedDeviceId?: string;
  currentLat?: number;
  currentLng?: number;
  speedMph?: number;
  heading?: number;
  ignitionStatus?: boolean;
  batteryVoltage?: number;
  internalBatteryLevel?: number;
  externalPowerStatus?: boolean;
  lastSeenAt?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type EventType =
  | "location.updated"
  | "device.online"
  | "device.low_battery"
  | "device.power_connected"
  | "device.power_disconnected"
  | "ignition.on"
  | "ignition.off"
  | "asset.moved"
  | "sensor.reading_updated";

export type VaycoraEvent = {
  id: string;
  tenantId: string;
  assetId?: string;
  deviceId?: string;
  eventType: EventType;
  eventTime: string;
  locationLat?: number;
  locationLng?: number;
  value?: Record<string, unknown>;
  source: "suntech" | "system" | "manual";
  rawPayloadId?: string;
};

export type RawPayloadStatus = "received" | "parsed" | "failed" | "ignored" | "duplicate";

export type RawPayload = {
  id: string;
  provider: "suntech";
  deviceIdentifier?: string;
  deviceId?: string;
  tenantId?: string;
  rawPayload: string;
  payloadFormat: "json" | "text" | "hex" | "unknown";
  sourceIp?: string;
  receivedAt: string;
  parsedAt?: string;
  parseStatus: RawPayloadStatus;
  parseError?: string;
  ackSent: boolean;
};

export type NormalizedSunTechPayload = {
  deviceIdentifier: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  speedMph?: number;
  heading?: number;
  ignitionStatus?: boolean;
  batteryVoltage?: number;
  internalBatteryLevel?: number;
  externalPowerStatus?: boolean;
  eventCode?: string;
  rawEventName?: string;
};
