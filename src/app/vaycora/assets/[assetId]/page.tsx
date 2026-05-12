import Link from "next/link";
import { notFound } from "next/navigation";
import { assets, devices, events, getDeviceForAsset, rawPayloads } from "@/lib/vaycora/mock-data";

function formatAssetType(type: string) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTime(value?: string) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function VaycoraAssetDetailPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const asset = assets.find((item) => item.id === assetId);

  if (!asset) notFound();

  const device = getDeviceForAsset(asset);
  const assetEvents = events.filter((event) => event.assetId === asset.id);
  const devicePayloads = rawPayloads.filter((payload) => payload.deviceId === device?.id);
  const siblingDevices = devices.filter((item) => item.tenantId === asset.tenantId);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_30%),linear-gradient(135deg,#020617,#0f172a_55%,#022c22)]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Link href="/vaycora" className="text-sm font-bold text-emerald-300 hover:text-emerald-200">← Back to Vaycora Core</Link>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">{formatAssetType(asset.assetType)}</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">{asset.name}</h1>
              <p className="mt-3 text-lg text-slate-200">{asset.displayIdentifier} · {asset.status}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs text-slate-300">Last Seen</p>
                <p className="mt-1 font-black">{formatTime(asset.lastSeenAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs text-slate-300">Speed</p>
                <p className="mt-1 font-black">{asset.speedMph ?? 0} mph</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs text-slate-300">Battery</p>
                <p className="mt-1 font-black">{asset.internalBatteryLevel ? `${asset.internalBatteryLevel}%` : asset.batteryVoltage ? `${asset.batteryVoltage}V` : "—"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs text-slate-300">Power</p>
                <p className="mt-1 font-black">{asset.externalPowerStatus === undefined ? "—" : asset.externalPowerStatus ? "On" : "Off"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Current State</p>
              <h2 className="mt-1 text-3xl font-black">Location and status</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">{asset.status}</span>
          </div>

          <div className="relative mt-6 h-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
            <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-emerald-600 text-center text-xl font-black leading-[3rem] text-white shadow-xl">
              {asset.assetType === "vehicle" ? "V" : asset.assetType === "porta_potty" ? "P" : "A"}
            </div>
            <div className="absolute bottom-5 left-5 rounded-2xl bg-white/95 p-4 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Coordinates</p>
              <p className="mt-1 font-mono text-sm font-bold">{asset.currentLat}, {asset.currentLng}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ignition</p>
              <p className="mt-2 text-xl font-black">{asset.ignitionStatus === undefined ? "—" : asset.ignitionStatus ? "On" : "Off"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Heading</p>
              <p className="mt-2 text-xl font-black">{asset.heading ?? 0}°</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Device Count</p>
              <p className="mt-2 text-xl font-black">{siblingDevices.length}</p>
            </div>
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Assigned Device</p>
            {device ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-5">
                <h3 className="text-2xl font-black">{device.model}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-600">IMEI {device.imei}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Status</p>
                    <p className="font-black">{device.status}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Last Payload</p>
                    <p className="font-black">{formatTime(device.lastPayloadAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-slate-50 p-5 font-semibold text-slate-600">No device assigned.</p>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Metadata</p>
            <div className="mt-4 space-y-2">
              {Object.entries(asset.metadata ?? {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <span className="font-bold text-slate-500">{key}</span>
                  <span className="font-black text-slate-950">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-10 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Recent Events</p>
          <div className="mt-4 space-y-3">
            {assetEvents.map((event) => (
              <div key={event.id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-black">{event.eventType}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{formatTime(event.eventTime)}</p>
                {event.value ? <pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-emerald-100">{JSON.stringify(event.value, null, 2)}</pre> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Raw Payloads</p>
          <div className="mt-4 space-y-3">
            {devicePayloads.map((payload) => (
              <div key={payload.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-black">{payload.id}</p>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{payload.parseStatus}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">Received {formatTime(payload.receivedAt)} · ACK {payload.ackSent ? "sent" : "not sent"}</p>
                <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-emerald-100">{payload.rawPayload}</pre>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
