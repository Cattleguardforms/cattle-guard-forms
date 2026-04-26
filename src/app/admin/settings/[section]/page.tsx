import Link from "next/link";
import { notFound } from "next/navigation";
import SettingsSectionClient from "./SettingsSectionClient";

type SettingPage = {
  title: string;
  eyebrow: string;
  description: string;
  note: string;
};

const settingPages: Record<string, SettingPage> = {
  "admin-users": {
    title: "Admin Users",
    eyebrow: "Admin / Settings / Admin Users",
    description: "Create and manage admin users, roles, and account status.",
    note: "This creates an admin-side record now. Supabase Auth invitations should be connected next for production user provisioning.",
  },
  "distributor-roles": {
    title: "Distributor Roles",
    eyebrow: "Admin / Settings / Distributor Roles",
    description: "Create distributor profiles, set access state, and manage distributor pricing rules.",
    note: "Distributor records are editable here now. Server-side writes to distributor_profiles should be wired next.",
  },
  email: {
    title: "Email Settings",
    eyebrow: "Admin / Settings / Email",
    description: "Create email templates and routing rules for customers, distributors, manufacturers, and admins.",
    note: "Templates can be created and edited now. Resend sending and database storage should be connected next.",
  },
  stripe: {
    title: "Stripe Settings",
    eyebrow: "Admin / Settings / Stripe",
    description: "Configure Stripe event rules for checkout, payments, and abandoned checkout tracking.",
    note: "Rules are editable now. Stripe webhook execution still needs secure API wiring.",
  },
  supabase: {
    title: "Supabase Settings",
    eyebrow: "Admin / Settings / Supabase",
    description: "Track Supabase environment, tables, storage buckets, auth roles, and policy setup.",
    note: "Checklist items are editable now. Live health checks should be connected to server routes next.",
  },
  "echo-shipping": {
    title: "Echo Shipping",
    eyebrow: "Admin / Settings / Echo Shipping",
    description: "Configure Echo freight lookup behavior, freight selection rules, and fallback BOL handling.",
    note: "Rules are editable now. Echo API rate lookup still needs credential-backed server integration.",
  },
  analytics: {
    title: "Analytics",
    eyebrow: "Admin / Settings / Analytics",
    description: "Create analytics events and conversion tracking rules for the admin dashboard.",
    note: "Tracking definitions are editable now. site_events ingestion should be wired next.",
  },
  crm: {
    title: "CRM Configuration",
    eyebrow: "Admin / Settings / CRM",
    description: "Configure CRM pipelines, statuses, custom fields, saved views, and activity rules.",
    note: "CRM settings are editable now. The CRM config can be promoted to Supabase-backed records next.",
  },
};

export function generateStaticParams() {
  return Object.keys(settingPages).map((section) => ({ section }));
}

export default async function AdminSettingDetailPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const page = settingPages[section];

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin/settings" className="hover:text-green-800">Settings</Link>
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/marketing" className="hover:text-green-800">Marketing Portal</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">{page.eyebrow}</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
            <p className="mt-4 max-w-3xl leading-8 text-neutral-700">{page.description}</p>
            <p className="mt-3 max-w-3xl rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">{page.note}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/settings" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Back to Settings</Link>
            <Link href="/admin" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Admin Portal</Link>
          </div>
        </div>

        <SettingsSectionClient section={section} />
      </section>
    </main>
  );
}
