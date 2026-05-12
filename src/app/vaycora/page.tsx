import Link from "next/link";
import { assets, devices, events, getDeviceForAsset, rawPayloads, tenants } from "@/lib/vaycora/mock-data";

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

const portalCards = [
  ["Fleet", "OBD vehicles, ignition, trips, speed, VIN intelligence, and vehicle health.", "fleet", "bg-blue-50 text-blue-950 border-blue-100"],
  ["Assets", "Trailers, containers, equipment, generators, solar trackers, and battery assets.", "assets", "bg-emerald-50 text-emerald-950 border-emerald-100"],
  ["Sanitation", "Porta-potty fill, tip, movement, site assignment, and service-needed workflows.", "sanitation", "bg-amber-50 text-amber-950 border-amber-100"],
  ["Admin", "Device provisioning, payload debugging, tenants, and integration operations.", "admin", "bg-neutral-100 text-neutral-950 border-neutral-200"],
];

export default function VaycoraDashboardPage() {
  const activeDevices = devices.filter((device) => device.status === "active").length;
  const offlineAssets = assets.filter((asset) => asset.status === "offline").length;
  const serviceDueAssets = assets.filter((asset) => asset.status === "service_due" || asset.status === "alert").length;
  const tenant = tenants[0];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.2),transparent_30%),linear-gradient(135deg,#020617,#0f172a_55%,#022c22)]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">Vaycora Core v0.1</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Tracking core command center</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
                One SunTech ingestion core for vehicles, assets, sensors, porta-potties, RVs, containers, and future livestock workflows.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Tenant</p>
              <p className="mt-2 text-2xl font-black">{tenant.name}</p>
              <p className="mt-1 text-sm text-slate-300">{tenant.enabledPortals.length} portals enabled</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-300">Assets</p>
              <p className="mt-2 text-4xl font-black">{assets.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-300">Active Devices</p>
              <p className="mt-2 text-4xl font-black">{activeDevices}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-300">Needs Attention</p>
              <p className="mt-2 text-4xl font-black">{serviceDueAssets}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-300">Offline Assets</p>
              <p className="mt-2 text-4xl font-black">{offlineAssets}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Live Map Placeholder</p>
              <h2 className="mt-1 text-3xl font-black">Current asset positions</h2>
            </div>
            <Link href="/api/vaycora/ingest/suntech" className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
              Ingestion Health
            </Link>
          </div>

          <div className="relative mt-6 h-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
            <div className="absolute left-[40%] top-[38%] h-28 w-44 rounded-full border-4 border-emerald-600/30" />
            <div className="absolute left-[50%] top-[20%] h-64 w-2 rotate-45 rounded-full bg-slate-300" />
            <div className="absolute left-[20%] top-[55%] h-2 w-[70%] -rotate-12 rounded-full bg-slate-300" />
            {assets.map((asset, index) => {
              const positions = [
                "left-[38%] top-[45%]",
                "left-[54%] top-[36%]",
                "left-[66%] top-[56%]",
              ];
              return (
                <Link
                  key={asset.id}
                  href={`/vaycora/assets/${asset.id}`}
                  className={`absolute ${positions[index] ?? "left-1/2 top-1/2"} group -translate-x-1/2 -translate-y-1/2`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-lg font-black text-white shadow-xl transition group-hover:scale-110">
                    {asset.assetType === "vehicle" ? "V" : asset.assetType === "porta_potty" ? "P" : "A"}
                  </span>
                  <span className="absolute left-1/2 top-14 hidden w-48 -translate-x-1/2 rounded-xl bg-slate-950 p-3 text-xs font-semibold text-white shadow-xl group-hover:block">
                    {asset.name}<br />{formatAssetType(asset.assetType)} · {formatTime(asset.lastSeenAt)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Portals</p>
            <div className="mt-4 grid gap-3">
              {portalCards.map(([title, body, key, classes]) => (
                <div key={key} className={`rounded-2xl border p-4 ${classes}`}>
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-black">{title}</h3>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">Enabled</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 opacity-80">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Latest Events</p>
            <div className="mt-4 space-y-3">
              {events.map((event) => {
                const asset = assets.find((item) => item.id === event.assetId);
                return (
                  <div key={event.id} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-black">{event.eventType}</p>
                    <p className="mt-1 text-sm text-slate-600">{asset?.name ?? "Unknown asset"}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{formatTime(event.eventTime)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Assets</p>
              <h2 className="mt-1 text-3xl font-black">Registry</h2>
            </div>
            <p className="text-sm font-semibold text-slate-500">{rawPayloads.length} raw payloads captured in demo data</p>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Seen</th>
                  <th className="px-4 py-3">Battery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {assets.map((asset) => {
                  const device = getDeviceForAsset(asset);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <Link href={`/vaycora/assets/${asset.id}`} className="font-black text-slate-950 hover:text-emerald-700">
                          {asset.name}
                        </Link>
                        <p className="text-xs text-slate-500">{asset.displayIdentifier}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold">{formatAssetType(asset.assetType)}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{device?.model ?? "Unassigned"}</p>
                        <p className="text-xs text-slate-500">{device?.imei}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{asset.status}</span>
                      </td>
                      <td className="px-4 py-4 font-semibold">{formatTime(asset.lastSeenAt)}</td>
                      <td className="px-4 py-4 font-semibold">{asset.internalBatteryLevel ? `${asset.internalBatteryLevel}%` : asset.batteryVoltage ? `${asset.batteryVoltage}V` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
