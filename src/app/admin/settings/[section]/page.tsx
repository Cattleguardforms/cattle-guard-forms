import Link from "next/link";
import { notFound } from "next/navigation";

type SettingPage = {
  title: string;
  eyebrow: string;
  description: string;
  sections: {
    heading: string;
    items: string[];
  }[];
};

const settingPages: Record<string, SettingPage> = {
  "admin-users": {
    title: "Admin Users",
    eyebrow: "Admin / Settings / Admin Users",
    description: "Manage approved admin users, roles, account status, and future invite workflows.",
    sections: [
      {
        heading: "Active admins",
        items: ["support@cattleguardforms.com — Admin — Active", "Role and status controls will connect to app_profiles."],
      },
      {
        heading: "Invite admin",
        items: ["Invite email placeholder", "Role selector placeholder", "Send invite action placeholder"],
      },
    ],
  },
  "distributor-roles": {
    title: "Distributor Roles",
    eyebrow: "Admin / Settings / Distributor Roles",
    description: "Control distributor access rules, portal permissions, and account states.",
    sections: [
      {
        heading: "Access states",
        items: ["Approved distributors can access ordering tools.", "Pending distributors wait for admin review.", "Disabled distributors are blocked from portal access."],
      },
      {
        heading: "Distributor placeholders",
        items: ["Farm and Ranch Experts — Approved placeholder", "Barn World — Approved placeholder", "Future rows will read from distributor profiles."],
      },
    ],
  },
  email: {
    title: "Email Settings",
    eyebrow: "Admin / Settings / Email",
    description: "Configure support, manufacturer, distributor, and order email routing.",
    sections: [
      {
        heading: "Sender configuration",
        items: ["Support email placeholder", "Manufacturer email placeholder", "Resend API status placeholder"],
      },
      {
        heading: "Templates and routing",
        items: ["Order confirmation templates", "Distributor order routing", "Manufacturer notification routing"],
      },
    ],
  },
  stripe: {
    title: "Stripe Settings",
    eyebrow: "Admin / Settings / Stripe",
    description: "Track Stripe checkout setup, webhook health, payment mapping, and abandoned checkout events.",
    sections: [
      {
        heading: "Connection status",
        items: ["Stripe account status placeholder", "Checkout session status placeholder", "Webhook status placeholder"],
      },
      {
        heading: "Payment events",
        items: ["Abandoned checkout tracking", "Payment event mapping", "Order completion mapping"],
      },
    ],
  },
  supabase: {
    title: "Supabase Settings",
    eyebrow: "Admin / Settings / Supabase",
    description: "Monitor Supabase environment, tables, storage buckets, auth roles, and policies.",
    sections: [
      {
        heading: "Environment checklist",
        items: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
      },
      {
        heading: "Database and storage checklist",
        items: ["customers table", "orders table", "app_profiles table", "distributor profiles", "storage buckets"],
      },
    ],
  },
  "echo-shipping": {
    title: "Echo Shipping",
    eyebrow: "Admin / Settings / Echo Shipping",
    description: "Configure Echo freight API settings, rate lookup behavior, and fallback shipping rules.",
    sections: [
      {
        heading: "Echo API status",
        items: ["API credential placeholder", "Rate lookup settings", "Freight selection rules"],
      },
      {
        heading: "Fallback handling",
        items: ["Manual freight quote placeholder", "Fallback BOL upload rules", "Admin review workflow placeholder"],
      },
    ],
  },
  analytics: {
    title: "Analytics",
    eyebrow: "Admin / Settings / Analytics",
    description: "Configure site event tracking, conversion metrics, and dashboard reporting.",
    sections: [
      {
        heading: "Tracked events",
        items: ["site_events tracking", "Quote starts", "Checkout starts", "Completed orders"],
      },
      {
        heading: "Dashboard metrics",
        items: ["Visits today", "Visits this month", "Conversion reporting placeholder"],
      },
    ],
  },
  crm: {
    title: "CRM Configuration",
    eyebrow: "Admin / Settings / CRM",
    description: "Configure CRM entities, custom fields, pipelines, statuses, and activity tracking.",
    sections: [
      {
        heading: "CRM structure",
        items: ["CRM entities", "Custom fields", "Pipelines", "Statuses"],
      },
      {
        heading: "Activity tracking",
        items: ["Contact intake tracking", "Quote follow-up activity", "Saved views and automation rules placeholder"],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(settingPages).map((section) => ({ section }));
}

export default function AdminSettingDetailPage({ params }: { params: { section: string } }) {
  const page = settingPages[params.section];

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
          </div>
          <div className="flex gap-3">
            <Link href="/admin/settings" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Back to Settings</Link>
            <Link href="/admin" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Admin Portal</Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {page.sections.map((section) => (
            <article key={section.heading} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-lg font-semibold">{section.heading}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-600">
                {section.items.map((item) => (
                  <li key={item} className="rounded border border-neutral-200 bg-neutral-50 px-4 py-3">{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
