import Link from "next/link";

type ChannelAction = { label: string; href: string; primary?: boolean };

type ChannelPageProps = {
  label: string;
  eyebrow: string;
  description: string;
  status: string;
  connectLabel: string;
  setupItems: string[];
  workflowItems: string[];
  metricItems: string[];
  actions?: ChannelAction[];
};

export default function CampaignChannelPage({ label, eyebrow, description, status, connectLabel, setupItems, workflowItems, metricItems, actions = [] }: ChannelPageProps) {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/marketing/campaigns" className="text-sm font-semibold text-green-800 hover:text-green-950">Back to Campaigns</Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-neutral-700">
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
            <Link href="/marketing/sales-analytics" className="hover:text-green-800">Sales Analytics</Link>
            <Link href="/marketing/contacts" className="hover:text-green-800">CRM Contacts</Link>
            <Link href="/marketing/seo" className="hover:text-green-800">SEO Tester</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">{eyebrow}</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_0.35fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{label}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">{description}</p>
            </div>
            <div className="rounded-xl bg-green-50 px-5 py-4 text-green-950 ring-1 ring-green-200">
              <p className="text-sm font-medium">Status</p>
              <p className="mt-1 text-2xl font-bold">{status}</p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-bold">Connect</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{connectLabel}</p>
            <div className="mt-5 grid gap-3">
              {actions.map((action) => (
                <Link key={action.label} href={action.href} className={action.primary ? "rounded bg-green-800 px-4 py-3 text-center text-sm font-bold text-white hover:bg-green-900" : "rounded border border-neutral-300 px-4 py-3 text-center text-sm font-bold hover:bg-neutral-50"}>{action.label}</Link>
              ))}
              {actions.length === 0 ? <button className="rounded bg-green-800 px-4 py-3 text-sm font-bold text-white">Connect Account</button> : null}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-bold">Setup Checklist</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
              {setupItems.map((item) => <li key={item} className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">{item}</li>)}
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-bold">Tracked Metrics</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
              {metricItems.map((item) => <li key={item} className="rounded-lg bg-neutral-50 p-3 ring-1 ring-neutral-200">{item}</li>)}
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-2xl font-bold">Workflow</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflowItems.map((item, index) => (
              <div key={item} className="rounded-xl border border-neutral-200 p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-800 text-sm font-bold text-white">{index + 1}</span>
                <p className="mt-4 text-sm leading-6 text-neutral-700">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
