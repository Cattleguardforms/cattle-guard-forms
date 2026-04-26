import Link from "next/link";

const settings = [
  ["Admin Users", "Create approved admin users, assign roles, and disable access."],
  ["Distributor Roles", "Approve distributor accounts and control portal permissions."],
  ["Email Settings", "Manage support, order, manufacturer, and Resend sender settings."],
  ["Stripe Settings", "Connect checkout, webhook, abandoned checkout tracking, and payment status."],
  ["Supabase Settings", "Manage database tables, storage buckets, auth roles, and policies."],
  ["Echo Shipping", "Connect Echo freight API credentials and rate display rules."],
  ["Analytics", "Configure site visit tracking, conversion events, and dashboard metrics."],
  ["CRM Configuration", "Manage custom fields, pipelines, statuses, saved views, and automation rules."],
];

export default function AdminSettingsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/admin/distributors" className="hover:text-green-800">Distributors</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / Settings</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Settings</h1>
        <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
          This page will control admin access, distributor roles, email settings, integrations, analytics, CRM configuration, and business rules.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {settings.map(([title, description]) => (
            <article key={title} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{description}</p>
              <button type="button" className="mt-4 rounded border border-neutral-300 px-4 py-2 text-sm font-semibold">Configure later</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
