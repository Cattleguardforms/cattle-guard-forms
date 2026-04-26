"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
};

type RecordItem = {
  id: string;
  [key: string]: string;
};

type SectionConfig = {
  title: string;
  description: string;
  storageKey: string;
  formTitle: string;
  submitLabel: string;
  primaryField: string;
  secondaryFields: string[];
  fields: Field[];
  initialRecords: RecordItem[];
};

const statusOptions = ["new", "active", "draft", "scheduled", "completed", "archived"];
const socialChannels = ["Facebook", "Instagram", "LinkedIn", "YouTube", "TikTok", "X / Twitter", "Email", "Website"];

function sectionConfig(overrides: Partial<SectionConfig> & Pick<SectionConfig, "title" | "description" | "storageKey" | "formTitle" | "submitLabel" | "primaryField" | "secondaryFields" | "fields">): SectionConfig {
  return { initialRecords: [], ...overrides };
}

function socialPlatformConfig(platform: string, key: string): SectionConfig {
  return sectionConfig({
    title: platform,
    description: `Create and track ${platform} posts, captions, scripts, media ideas, schedules, and publishing status.`,
    storageKey: `cgf-marketing-${key}`,
    formTitle: `Create ${platform} item`,
    submitLabel: `Save ${platform} Item`,
    primaryField: "title",
    secondaryFields: ["contentType", "status", "scheduledDate"],
    fields: [
      { name: "title", label: "Title", placeholder: `${platform} post, video, or campaign idea` },
      { name: "contentType", label: "Content type", type: "select", options: ["post", "caption", "script", "ad", "story", "short video", "campaign"] },
      { name: "status", label: "Status", type: "select", options: ["idea", "draft", "ready", "scheduled", "posted", "blocked"] },
      { name: "scheduledDate", label: "Scheduled date", type: "date" },
      { name: "copy", label: "Copy / script / notes", type: "textarea", placeholder: `Write or paste ${platform} content here` },
      { name: "mediaAssets", label: "Media assets", placeholder: "Image, video, file, or asset reference" },
    ],
  });
}

export const marketingSections: Record<string, SectionConfig> = {
  "lead-inbox": sectionConfig({
    title: "Lead Inbox",
    description: "Capture incoming shop requests, quote leads, distributor inquiries, and follow-up opportunities.",
    storageKey: "cgf-marketing-lead-inbox",
    formTitle: "Create lead",
    submitLabel: "Save Lead",
    primaryField: "leadName",
    secondaryFields: ["email", "phone", "source", "status"],
    fields: [
      { name: "leadName", label: "Lead name", placeholder: "Customer or contact name" },
      { name: "companyName", label: "Company name", placeholder: "Optional company" },
      { name: "email", label: "Email", type: "email", placeholder: "Optional email" },
      { name: "phone", label: "Phone", placeholder: "Optional phone" },
      { name: "source", label: "Lead source", type: "select", options: ["website", "phone", "email", "distributor", "manual"] },
      { name: "status", label: "Status", type: "select", options: ["new", "contacted", "quoted", "won", "lost"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "What does this lead need?" },
    ],
  }),
  contacts: sectionConfig({
    title: "Contacts",
    description: "Manage people tied to customers, distributors, manufacturers, vendors, partners, and prospects.",
    storageKey: "cgf-crm-contacts",
    formTitle: "Create contact",
    submitLabel: "Save Contact",
    primaryField: "firstName",
    secondaryFields: ["lastName", "email", "phone", "company"],
    fields: [
      { name: "firstName", label: "First name", placeholder: "First" },
      { name: "lastName", label: "Last name", placeholder: "Last" },
      { name: "email", label: "Email", type: "email", placeholder: "Optional email" },
      { name: "phone", label: "Phone", placeholder: "Optional phone" },
      { name: "company", label: "Company", placeholder: "Optional company" },
      { name: "role", label: "Role", placeholder: "Owner, buyer, installer, distributor, etc." },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Contact details" },
    ],
  }),
  companies: sectionConfig({
    title: "Companies",
    description: "Manage ranches, farms, distributors, contractors, manufacturers, and vendors.",
    storageKey: "cgf-crm-companies",
    formTitle: "Create company",
    submitLabel: "Save Company",
    primaryField: "companyName",
    secondaryFields: ["companyType", "primaryEmail", "primaryPhone"],
    fields: [
      { name: "companyName", label: "Company name", placeholder: "Company" },
      { name: "companyType", label: "Company type", type: "select", options: ["customer", "distributor", "vendor", "manufacturer", "contractor", "partner"] },
      { name: "website", label: "Website", placeholder: "https://" },
      { name: "primaryEmail", label: "Primary email", type: "email", placeholder: "Optional email" },
      { name: "primaryPhone", label: "Primary phone", placeholder: "Optional phone" },
      { name: "territory", label: "Territory", placeholder: "Region or state" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Company details" },
    ],
  }),
  opportunities: sectionConfig({
    title: "Opportunities",
    description: "Track quotes, distributor deals, bulk purchases, and follow-up revenue opportunities.",
    storageKey: "cgf-crm-opportunities",
    formTitle: "Create opportunity",
    submitLabel: "Save Opportunity",
    primaryField: "opportunityTitle",
    secondaryFields: ["company", "estimatedValue", "status"],
    fields: [
      { name: "opportunityTitle", label: "Opportunity title", placeholder: "Bulk CowStop order" },
      { name: "company", label: "Company", placeholder: "Optional company" },
      { name: "primaryContact", label: "Primary contact", placeholder: "Contact" },
      { name: "estimatedValue", label: "Estimated value", type: "number", placeholder: "0" },
      { name: "quantity", label: "Quantity", type: "number", placeholder: "0" },
      { name: "leadSource", label: "Lead source", placeholder: "Website, distributor, phone" },
      { name: "status", label: "Status", type: "select", options: ["new", "quoted", "negotiating", "won", "lost"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Opportunity details" },
    ],
  }),
  orders: sectionConfig({
    title: "Orders",
    description: "Track retail and distributor orders from request through payment, fulfillment, shipping, and completion.",
    storageKey: "cgf-crm-orders",
    formTitle: "Create order",
    submitLabel: "Save Order",
    primaryField: "orderNumber",
    secondaryFields: ["company", "quantity", "status"],
    fields: [
      { name: "orderNumber", label: "Order number", placeholder: "Order reference" },
      { name: "company", label: "Company", placeholder: "Optional company" },
      { name: "contact", label: "Contact", placeholder: "Customer/contact" },
      { name: "orderType", label: "Order type", type: "select", options: ["retail", "distributor", "historical", "manual"] },
      { name: "quantity", label: "Quantity", type: "number", placeholder: "0" },
      { name: "unitPrice", label: "Unit price", type: "number", placeholder: "0" },
      { name: "status", label: "Status", type: "select", options: ["draft", "paid", "shipping ready", "shipped", "completed"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Order details" },
    ],
  }),
  "marketing-posts": sectionConfig({
    title: "Marketing Posts",
    description: "Create social posts, email content, campaign drafts, and scheduled marketing content.",
    storageKey: "cgf-crm-marketing-posts",
    formTitle: "Create marketing post",
    submitLabel: "Save Post",
    primaryField: "title",
    secondaryFields: ["channel", "status", "scheduledAt"],
    fields: [
      { name: "title", label: "Title", placeholder: "Post title" },
      { name: "channel", label: "Channel", type: "select", options: socialChannels },
      { name: "caption", label: "Caption / copy", type: "textarea", placeholder: "Post copy" },
      { name: "status", label: "Status", type: "select", options: ["idea", "draft", "scheduled", "published"] },
      { name: "scheduledAt", label: "Scheduled date", type: "date" },
      { name: "mediaAssets", label: "Media assets", placeholder: "Image/video reference" },
    ],
  }),
  campaigns: sectionConfig({
    title: "Campaigns",
    description: "Manage reusable campaign containers for education, distributor recruiting, promotions, and content pushes.",
    storageKey: "cgf-crm-campaigns",
    formTitle: "Create campaign",
    submitLabel: "Save Campaign",
    primaryField: "campaignName",
    secondaryFields: ["goal", "startDate", "status"],
    fields: [
      { name: "campaignName", label: "Campaign name", placeholder: "Campaign" },
      { name: "goal", label: "Goal", placeholder: "Campaign goal" },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "budget", label: "Budget", type: "number", placeholder: "0" },
      { name: "status", label: "Status", type: "select", options: ["planning", "active", "paused", "completed"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Campaign details" },
    ],
  }),
  "social-media-hub": sectionConfig({
    title: "Social Media Hub",
    description: "Plan and track social accounts, draft posts, media ideas, and manual publishing status.",
    storageKey: "cgf-marketing-social-media-hub",
    formTitle: "Create social item",
    submitLabel: "Save Social Item",
    primaryField: "title",
    secondaryFields: ["channel", "status", "scheduledDate"],
    fields: [
      { name: "title", label: "Title", placeholder: "Post idea or account task" },
      { name: "channel", label: "Channel", type: "select", options: socialChannels },
      { name: "status", label: "Status", type: "select", options: ["idea", "draft", "ready", "posted", "blocked"] },
      { name: "scheduledDate", label: "Scheduled date", type: "date" },
      { name: "copy", label: "Caption / copy", type: "textarea", placeholder: "Write post copy or notes" },
    ],
  }),
  facebook: socialPlatformConfig("Facebook", "facebook"),
  instagram: socialPlatformConfig("Instagram", "instagram"),
  linkedin: socialPlatformConfig("LinkedIn", "linkedin"),
  youtube: socialPlatformConfig("YouTube", "youtube"),
  tiktok: socialPlatformConfig("TikTok", "tiktok"),
  "campaign-calendar": sectionConfig({
    title: "Campaign Calendar",
    description: "Create and schedule campaigns for product education, distributor recruiting, seasonal pushes, and promotions.",
    storageKey: "cgf-marketing-campaign-calendar",
    formTitle: "Create campaign",
    submitLabel: "Save Campaign",
    primaryField: "campaignName",
    secondaryFields: ["goal", "startDate", "status"],
    fields: [
      { name: "campaignName", label: "Campaign name", placeholder: "Spring distributor push" },
      { name: "goal", label: "Goal", placeholder: "Distributor recruiting, sales, education" },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "budget", label: "Budget", type: "number", placeholder: "0" },
      { name: "status", label: "Status", type: "select", options: ["planning", "active", "paused", "completed"] },
    ],
  }),
  "distributor-accounts": sectionConfig({
    title: "Distributor Accounts",
    description: "Manage distributor account records, pricing, status, territory, and notes.",
    storageKey: "cgf-marketing-distributor-accounts",
    formTitle: "Create distributor account",
    submitLabel: "Save Distributor",
    primaryField: "companyName",
    secondaryFields: ["contactName", "status", "pricePerUnit"],
    fields: [
      { name: "companyName", label: "Company name", placeholder: "Barn World" },
      { name: "contactName", label: "Contact name", placeholder: "Primary contact" },
      { name: "email", label: "Email", type: "email", placeholder: "Optional email" },
      { name: "phone", label: "Phone", placeholder: "Optional phone" },
      { name: "pricePerUnit", label: "Distributor price", type: "number", placeholder: "750" },
      { name: "status", label: "Status", type: "select", options: ["active", "pending", "disabled", "legacy"] },
    ],
    initialRecords: [
      { id: "barn-world", companyName: "Barn World", contactName: "", email: "", phone: "", pricePerUnit: "750", status: "active" },
      { id: "farm-ranch", companyName: "Farm and Ranch Experts", contactName: "", email: "", phone: "", pricePerUnit: "750", status: "active" },
      { id: "tractor-supply", companyName: "Tractor Supply Company", contactName: "", email: "", phone: "", pricePerUnit: "750", status: "legacy" },
    ],
  }),
  "order-pipeline": sectionConfig({
    title: "Order Pipeline",
    description: "Track order stages from draft through payment, shipping, manufacturer handoff, and completion.",
    storageKey: "cgf-marketing-order-pipeline",
    formTitle: "Create order pipeline item",
    submitLabel: "Save Order Item",
    primaryField: "orderName",
    secondaryFields: ["companyName", "stage", "quantity"],
    fields: [
      { name: "orderName", label: "Order name / number", placeholder: "Order or customer reference" },
      { name: "companyName", label: "Company", placeholder: "Optional company" },
      { name: "contactName", label: "Contact", placeholder: "Customer/contact" },
      { name: "stage", label: "Stage", type: "select", options: ["draft", "paid", "shipping ready", "sent to manufacturer", "ship date received", "shipped", "completed"] },
      { name: "quantity", label: "Quantity", type: "number", placeholder: "0" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Order details" },
    ],
  }),
  "uploaded-files": sectionConfig({
    title: "Uploaded Files",
    description: "Catalog uploaded files, historical CSVs, customer files, media assets, and import documents.",
    storageKey: "cgf-marketing-uploaded-files",
    formTitle: "Register uploaded file",
    submitLabel: "Save File Record",
    primaryField: "fileName",
    secondaryFields: ["fileType", "year", "status"],
    fields: [
      { name: "fileName", label: "File name", placeholder: "2019-customers-sales.csv" },
      { name: "fileType", label: "File type", type: "select", options: ["crm import", "customer list", "sales file", "media asset", "document"] },
      { name: "year", label: "Year", type: "select", options: ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"] },
      { name: "status", label: "Status", type: "select", options: ["received", "reviewed", "imported", "archived"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "What is in this file?" },
    ],
  }),
  "email-activity": sectionConfig({
    title: "Email Activity",
    description: "Track email templates, outbound follow-ups, distributor messages, and customer communications.",
    storageKey: "cgf-marketing-email-activity",
    formTitle: "Create email activity",
    submitLabel: "Save Email Activity",
    primaryField: "subject",
    secondaryFields: ["recipientType", "status", "sendDate"],
    fields: [
      { name: "subject", label: "Subject", placeholder: "Follow-up on CowStop order" },
      { name: "recipientType", label: "Recipient type", type: "select", options: ["customer", "distributor", "manufacturer", "admin", "lead"] },
      { name: "status", label: "Status", type: "select", options: ["draft", "scheduled", "sent", "needs review"] },
      { name: "sendDate", label: "Send date", type: "date" },
      { name: "body", label: "Email body / notes", type: "textarea", placeholder: "Message content or notes" },
    ],
  }),
  "marketing-content": sectionConfig({
    title: "Marketing Content",
    description: "Create marketing ideas, page copy, ad concepts, sales materials, and educational content.",
    storageKey: "cgf-marketing-content",
    formTitle: "Create content item",
    submitLabel: "Save Content",
    primaryField: "title",
    secondaryFields: ["contentType", "status", "channel"],
    fields: [
      { name: "title", label: "Title", placeholder: "Why reusable forms save money" },
      { name: "contentType", label: "Content type", type: "select", options: ["blog", "ad", "email", "social", "sales sheet", "landing page"] },
      { name: "channel", label: "Channel", placeholder: "Website, Facebook, email, etc." },
      { name: "status", label: "Status", type: "select", options: ["idea", "draft", "review", "approved", "published"] },
      { name: "copy", label: "Copy / notes", type: "textarea", placeholder: "Content draft" },
    ],
  }),
  "automation-rules": sectionConfig({
    title: "Automation Rules",
    description: "Define manual and future automated rules for lead routing, follow-ups, imports, and campaign actions.",
    storageKey: "cgf-marketing-automation-rules",
    formTitle: "Create automation rule",
    submitLabel: "Save Rule",
    primaryField: "ruleName",
    secondaryFields: ["trigger", "status", "action"],
    fields: [
      { name: "ruleName", label: "Rule name", placeholder: "New lead follow-up" },
      { name: "trigger", label: "Trigger", placeholder: "New lead created" },
      { name: "action", label: "Action", placeholder: "Create task or send email" },
      { name: "status", label: "Status", type: "select", options: ["draft", "enabled", "disabled"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Rule details" },
    ],
  }),
};

function genericConfig(section: string): SectionConfig {
  const title = section
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Marketing Module";

  return sectionConfig({
    title,
    description: "Create and manage records for this marketing module.",
    storageKey: `cgf-marketing-${section}`,
    formTitle: `Create ${title} record`,
    submitLabel: "Save Record",
    primaryField: "title",
    secondaryFields: ["status", "owner", "dueDate"],
    fields: [
      { name: "title", label: "Title", placeholder: `${title} record` },
      { name: "status", label: "Status", type: "select", options: statusOptions },
      { name: "owner", label: "Owner", placeholder: "Assigned person" },
      { name: "dueDate", label: "Due date", type: "date" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Details" },
    ],
  });
}

function emptyForm(fields: Field[]) {
  return fields.reduce<Record<string, string>>((values, field) => {
    values[field.name] = field.options?.[0] ?? "";
    return values;
  }, {});
}

function labelFor(fieldName: string) {
  return fieldName.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

export default function MarketingSectionClient({ section }: { section: string }) {
  const config = useMemo(() => marketingSections[section] ?? genericConfig(section), [section]);
  const [records, setRecords] = useState<RecordItem[]>(config.initialRecords);
  const [form, setForm] = useState<Record<string, string>>(() => emptyForm(config.fields));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(config.storageKey);
    if (saved) {
      try {
        setRecords(JSON.parse(saved) as RecordItem[]);
      } catch {
        setRecords(config.initialRecords);
      }
    } else {
      setRecords(config.initialRecords);
    }
    setForm(emptyForm(config.fields));
    setEditingId(null);
    setMessage(null);
  }, [config]);

  useEffect(() => {
    window.localStorage.setItem(config.storageKey, JSON.stringify(records));
  }, [config.storageKey, records]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const primaryValue = form[config.primaryField]?.trim();
    if (!primaryValue) {
      setMessage(`${labelFor(config.primaryField)} is required.`);
      return;
    }

    if (editingId) {
      setRecords((current) => current.map((record) => (record.id === editingId ? { ...record, ...form } : record)));
      setMessage("Updated successfully.");
    } else {
      setRecords((current) => [{ id: `${Date.now()}`, ...form }, ...current]);
      setMessage("Created successfully.");
    }

    setEditingId(null);
    setForm(emptyForm(config.fields));
  }

  function edit(record: RecordItem) {
    setEditingId(record.id);
    setMessage(null);
    setForm(config.fields.reduce<Record<string, string>>((values, field) => {
      values[field.name] = record[field.name] ?? field.options?.[0] ?? "";
      return values;
    }, {}));
  }

  function remove(recordId: string) {
    setRecords((current) => current.filter((record) => record.id !== recordId));
    if (editingId === recordId) {
      setEditingId(null);
      setForm(emptyForm(config.fields));
    }
    setMessage("Deleted successfully.");
  }

  function resetDefaults() {
    setRecords(config.initialRecords);
    setEditingId(null);
    setForm(emptyForm(config.fields));
    setMessage("Defaults restored.");
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{editingId ? "Edit record" : config.formTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">This module is live in this browser now and saves records locally. Supabase-backed persistence is the next backend hardening step.</p>
          </div>
          <button type="button" onClick={resetDefaults} className="rounded border border-neutral-300 px-3 py-2 text-xs font-semibold hover:border-green-800 hover:bg-green-50">Reset defaults</button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/marketing/ai" className="rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Generate with AI</Link>
          <Link href="/marketing/marketing-posts" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Marketing Posts</Link>
          <Link href="/marketing/campaigns" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Campaigns</Link>
        </div>

        {message ? <div className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{message}</div> : null}

        <form onSubmit={submit} className="mt-6 grid gap-4">
          {config.fields.map((field) => (
            <label key={field.name} className="grid gap-2 text-sm font-medium text-neutral-700">
              {field.label}
              {field.type === "textarea" ? (
                <textarea value={form[field.name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} placeholder={field.placeholder} className="min-h-28 rounded border border-neutral-300 px-3 py-2 font-normal" />
              ) : field.type === "select" ? (
                <select value={form[field.name] ?? field.options?.[0] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                  {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input type={field.type ?? "text"} value={form[field.name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} placeholder={field.placeholder} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              )}
            </label>
          ))}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900">{editingId ? "Save Changes" : config.submitLabel}</button>
            {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm(config.fields)); }} className="rounded border border-neutral-300 px-5 py-3 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Cancel Edit</button> : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-xl font-semibold">Saved records</h2>
        <p className="mt-2 text-sm text-neutral-600">{records.length} saved record{records.length === 1 ? "" : "s"}</p>
        <div className="mt-5 space-y-3">
          {records.length === 0 ? <div className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600 ring-1 ring-neutral-200">No records yet. Create the first one on the left.</div> : null}
          {records.map((record) => (
            <article key={record.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold">{record[config.primaryField]}</h3>
                  <dl className="mt-2 grid gap-1 text-sm text-neutral-600">
                    {config.secondaryFields.map((fieldName) => (
                      <div key={fieldName} className="flex gap-2">
                        <dt className="font-medium text-neutral-800">{labelFor(fieldName)}:</dt>
                        <dd>{record[fieldName] || "Not set"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => edit(record)} className="rounded border border-neutral-300 px-3 py-2 text-xs font-semibold hover:border-green-800 hover:bg-white">Edit</button>
                  <button type="button" onClick={() => remove(record.id)} className="rounded border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
