import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

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

type RawRecord = Record<string, unknown>;
type SupabaseQueryError = { message?: string; details?: string; hint?: string; code?: string };

function createCrmSupabaseClient() {
  try { return createSupabaseAdminClient(); } catch { return createSupabaseServerClient(); }
}

function getString(record: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

function getNumber(record: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  }
  return null;
}

function normalizeContact(record: RawRecord, index: number): CrmContactRecord {
  return {
    id: getString(record, ["id", "customer_id", "uuid"]) ?? `customer-${index}`,
    first_name: getString(record, ["first_name", "firstName", "firstname", "contact_first_name"]),
    last_name: getString(record, ["last_name", "lastName", "lastname", "contact_last_name"]),
    email: getString(record, ["email", "customer_email", "contact_email", "primary_email"]),
    phone: getString(record, ["phone", "customer_phone", "contact_phone", "primary_phone", "telephone"]),
    company: getString(record, ["company", "company_name", "business_name", "organization", "customer_company", "account_name", "name"]),
    company_email: getString(record, ["company_email", "business_email", "email", "customer_email"]),
    company_phone: getString(record, ["company_phone", "business_phone", "phone", "customer_phone"]),
    city: getString(record, ["city", "shipping_city", "billing_city", "project_city"]),
    state: getString(record, ["state", "shipping_state", "billing_state", "project_state"]),
    status: getString(record, ["status", "customer_status", "lead_status"]),
    source: getString(record, ["source", "lead_source", "origin"]),
    created_at: getString(record, ["created_at", "createdAt", "date_created"]),
    updated_at: getString(record, ["updated_at", "updatedAt", "date_updated"]),
  };
}

function normalizeCampaign(record: RawRecord, index: number): CrmCampaignRecord {
  return {
    id: getString(record, ["id", "campaign_id", "uuid"]) ?? `campaign-${index}`,
    name: getString(record, ["name", "title", "campaign_name"]),
    goal: getString(record, ["goal", "description", "notes"]),
    status: getString(record, ["status", "campaign_status"]),
    start_date: getString(record, ["start_date", "startDate"]),
    end_date: getString(record, ["end_date", "endDate"]),
    budget: getNumber(record, ["budget", "campaign_budget"]),
    created_at: getString(record, ["created_at", "createdAt", "date_created"]),
  };
}

function formatSupabaseError(error: SupabaseQueryError | null) {
  if (!error) return "Unknown Supabase error.";
  return [error.message, error.details, error.hint, error.code ? `Code: ${error.code}` : ""].filter(Boolean).join(" ");
}

export async function getCrmContacts(limit = 1000) {
  const supabase = createCrmSupabaseClient();
  const { data, error, count } = await supabase.from("customers").select("*", { count: "exact" }).limit(limit);
  if (error) throw new Error(formatSupabaseError(error));
  const records = ((data ?? []) as RawRecord[]).map(normalizeContact);
  return { records, count: count ?? records.length };
}

export async function getCrmCompanies(limit = 1000) {
  const { records } = await getCrmContacts(limit);
  const companies = new Map<string, CrmCompanyRecord>();
  for (const record of records) {
    const name = record.company?.trim() || record.company_email?.trim() || record.email?.split("@")[1] || "Unassigned / individual customer";
    const existing = companies.get(name);
    if (existing) {
      existing.count += 1;
      if (!existing.primary_email && (record.company_email || record.email)) existing.primary_email = record.company_email || record.email;
      if (!existing.primary_phone && (record.company_phone || record.phone)) existing.primary_phone = record.company_phone || record.phone;
      continue;
    }
    companies.set(name, { name, primary_email: record.company_email || record.email || null, primary_phone: record.company_phone || record.phone || null, status: record.status || null, source: record.source || null, city: record.city || null, state: record.state || null, count: 1 });
  }
  return Array.from(companies.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCrmCampaigns(limit = 100) {
  const supabase = createCrmSupabaseClient();
  const { data, error, count } = await supabase.from("marketing_campaigns").select("*", { count: "exact" }).limit(limit);
  if (error) {
    const message = formatSupabaseError(error);
    if (message.includes("marketing_campaigns") || error.code === "PGRST205" || error.code === "42P01") return { records: [], count: 0, missingTable: true };
    throw new Error(message);
  }
  const records = ((data ?? []) as RawRecord[]).map(normalizeCampaign);
  return { records, count: count ?? records.length, missingTable: false };
}

export function formatContactName(record: CrmContactRecord) {
  const name = [record.first_name, record.last_name].filter(Boolean).join(" ").trim();
  return name || record.email || record.phone || record.company || "Unnamed contact";
}

export function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
