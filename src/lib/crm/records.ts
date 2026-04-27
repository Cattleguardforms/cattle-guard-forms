import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CrmContactRecord = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  city?: string | null;
  state?: string | null;
  status?: string | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CrmCompanyRecord = {
  name: string;
  primary_email?: string | null;
  primary_phone?: string | null;
  status?: string | null;
  source?: string | null;
  city?: string | null;
  state?: string | null;
  count: number;
};

export type CrmCampaignRecord = {
  id: string;
  name?: string | null;
  goal?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
  created_at?: string | null;
};

export async function getCrmContacts(limit = 500) {
  const supabase = createSupabaseServerClient();
  const { data, error, count } = await supabase
    .from("customers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return { records: (data ?? []) as CrmContactRecord[], count: count ?? data?.length ?? 0 };
}

export async function getCrmCompanies(limit = 500) {
  const { records } = await getCrmContacts(limit);
  const companies = new Map<string, CrmCompanyRecord>();

  for (const record of records) {
    const name = record.company?.trim() || record.company_email?.trim() || "Unassigned / individual customer";
    const existing = companies.get(name);

    if (existing) {
      existing.count += 1;
      continue;
    }

    companies.set(name, {
      name,
      primary_email: record.company_email || record.email || null,
      primary_phone: record.company_phone || record.phone || null,
      status: record.status || null,
      source: record.source || null,
      city: record.city || null,
      state: record.state || null,
      count: 1,
    });
  }

  return Array.from(companies.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCrmCampaigns(limit = 100) {
  const supabase = createSupabaseServerClient();
  const { data, error, count } = await supabase
    .from("marketing_campaigns")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return { records: (data ?? []) as CrmCampaignRecord[], count: count ?? data?.length ?? 0 };
}

export function formatContactName(record: CrmContactRecord) {
  const name = [record.first_name, record.last_name].filter(Boolean).join(" ").trim();
  return name || record.email || record.phone || "Unnamed contact";
}

export function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
