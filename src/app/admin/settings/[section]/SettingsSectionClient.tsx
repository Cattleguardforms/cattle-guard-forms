"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
};

type RecordItem = {
  id: string;
  [key: string]: string;
};

type SectionConfig = {
  storageKey: string;
  formTitle: string;
  submitLabel: string;
  fields: Field[];
  initialRecords: RecordItem[];
  primaryField: string;
  secondaryFields: string[];
};

const configs: Record<string, SectionConfig> = {
  "admin-users": {
    storageKey: "cgf-settings-admin-users",
    formTitle: "Create admin user",
    submitLabel: "Create Admin User",
    primaryField: "email",
    secondaryFields: ["fullName", "role", "status"],
    fields: [
      { name: "fullName", label: "Full name", placeholder: "Jane Smith" },
      { name: "email", label: "Admin email", type: "email", placeholder: "admin@example.com" },
      { name: "role", label: "Role", type: "select", options: ["admin", "manager", "support"] },
      { name: "status", label: "Status", type: "select", options: ["active", "pending", "disabled"] },
    ],
    initialRecords: [
      { id: "support-admin", fullName: "Cattle Guard Forms Support", email: "support@cattleguardforms.com", role: "admin", status: "active" },
    ],
  },
  "distributor-roles": {
    storageKey: "cgf-settings-distributor-roles",
    formTitle: "Create distributor profile",
    submitLabel: "Create Distributor",
    primaryField: "companyName",
    secondaryFields: ["contactName", "contactEmail", "status", "pricePerUnit"],
    fields: [
      { name: "companyName", label: "Company name", placeholder: "Farm and Ranch Experts" },
      { name: "contactName", label: "Contact name", placeholder: "Primary contact" },
      { name: "contactEmail", label: "Contact email", type: "email", placeholder: "orders@example.com" },
      { name: "status", label: "Status", type: "select", options: ["active", "pending", "disabled"] },
      { name: "pricePerUnit", label: "Distributor price", type: "number", placeholder: "750" },
    ],
    initialRecords: [
      { id: "farm-ranch", companyName: "Farm and Ranch Experts", contactName: "Distributor buyer", contactEmail: "orders@farmandranch.example", status: "active", pricePerUnit: "750" },
      { id: "barn-world", companyName: "Barn World", contactName: "Distributor buyer", contactEmail: "orders@barnworld.example", status: "active", pricePerUnit: "750" },
    ],
  },
  email: {
    storageKey: "cgf-settings-email-templates",
    formTitle: "Create email template",
    submitLabel: "Save Email Template",
    primaryField: "templateName",
    secondaryFields: ["audience", "subject", "status"],
    fields: [
      { name: "templateName", label: "Template name", placeholder: "Order confirmation" },
      { name: "audience", label: "Audience", type: "select", options: ["customer", "distributor", "manufacturer", "admin"] },
      { name: "subject", label: "Subject line", placeholder: "Your CowStop order confirmation" },
      { name: "body", label: "Template body", type: "textarea", placeholder: "Write the email body..." },
      { name: "status", label: "Status", type: "select", options: ["draft", "active", "archived"] },
    ],
    initialRecords: [
      { id: "order-confirmation", templateName: "Order confirmation", audience: "customer", subject: "Your CowStop order confirmation", body: "Thank you for your order. We will follow up with freight details.", status: "draft" },
      { id: "manufacturer-notice", templateName: "Manufacturer order notice", audience: "manufacturer", subject: "New CowStop order received", body: "A new order needs manufacturing review.", status: "draft" },
    ],
  },
  stripe: {
    storageKey: "cgf-settings-stripe-rules",
    formTitle: "Create Stripe rule",
    submitLabel: "Save Stripe Rule",
    primaryField: "ruleName",
    secondaryFields: ["eventType", "status"],
    fields: [
      { name: "ruleName", label: "Rule name", placeholder: "Checkout complete creates order" },
      { name: "eventType", label: "Stripe event", type: "select", options: ["checkout.session.completed", "checkout.session.expired", "payment_intent.succeeded", "payment_intent.payment_failed"] },
      { name: "action", label: "Admin action", type: "textarea", placeholder: "Describe what this event should do..." },
      { name: "status", label: "Status", type: "select", options: ["enabled", "disabled", "testing"] },
    ],
    initialRecords: [
      { id: "checkout-complete", ruleName: "Checkout complete creates order", eventType: "checkout.session.completed", action: "Create or update order record and mark payment complete.", status: "testing" },
      { id: "checkout-expired", ruleName: "Expired checkout creates abandoned checkout", eventType: "checkout.session.expired", action: "Create abandoned checkout follow-up record.", status: "testing" },
    ],
  },
  supabase: {
    storageKey: "cgf-settings-supabase-checklist",
    formTitle: "Add Supabase setup item",
    submitLabel: "Save Supabase Item",
    primaryField: "itemName",
    secondaryFields: ["category", "status"],
    fields: [
      { name: "itemName", label: "Item name", placeholder: "app_profiles table" },
      { name: "category", label: "Category", type: "select", options: ["env", "table", "bucket", "policy", "auth"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "What needs to be checked or configured?" },
      { name: "status", label: "Status", type: "select", options: ["live", "needs setup", "blocked", "not needed"] },
    ],
    initialRecords: [
      { id: "app-profiles", itemName: "app_profiles table", category: "table", notes: "Stores admin/distributor/customer roles.", status: "live" },
      { id: "distributor-profiles", itemName: "distributor_profiles table", category: "table", notes: "Stores distributor profile records.", status: "live" },
      { id: "service-role", itemName: "SUPABASE_SERVICE_ROLE_KEY", category: "env", notes: "Required for secure server-side admin writes.", status: "needs setup" },
    ],
  },
  "echo-shipping": {
    storageKey: "cgf-settings-echo-shipping-rules",
    formTitle: "Create Echo shipping rule",
    submitLabel: "Save Shipping Rule",
    primaryField: "ruleName",
    secondaryFields: ["ruleType", "status"],
    fields: [
      { name: "ruleName", label: "Rule name", placeholder: "Default freight fallback" },
      { name: "ruleType", label: "Rule type", type: "select", options: ["rate lookup", "freight selection", "fallback BOL", "manual review"] },
      { name: "details", label: "Rule details", type: "textarea", placeholder: "Describe the shipping rule..." },
      { name: "status", label: "Status", type: "select", options: ["enabled", "disabled", "testing"] },
    ],
    initialRecords: [
      { id: "manual-freight", ruleName: "Manual freight fallback", ruleType: "manual review", details: "If Echo rates are unavailable, flag order for manual freight quote.", status: "enabled" },
    ],
  },
  analytics: {
    storageKey: "cgf-settings-analytics-events",
    formTitle: "Create analytics event",
    submitLabel: "Save Analytics Event",
    primaryField: "eventName",
    secondaryFields: ["path", "status"],
    fields: [
      { name: "eventName", label: "Event name", placeholder: "checkout_started" },
      { name: "path", label: "Tracked path", placeholder: "/checkout" },
      { name: "description", label: "Description", type: "textarea", placeholder: "What should this event measure?" },
      { name: "status", label: "Status", type: "select", options: ["enabled", "disabled", "testing"] },
    ],
    initialRecords: [
      { id: "quote-started", eventName: "quote_started", path: "/contact", description: "Tracks quote/contact form starts.", status: "testing" },
      { id: "checkout-started", eventName: "checkout_started", path: "/checkout", description: "Tracks checkout intent.", status: "testing" },
    ],
  },
  crm: {
    storageKey: "cgf-settings-crm-config",
    formTitle: "Create CRM setting",
    submitLabel: "Save CRM Setting",
    primaryField: "settingName",
    secondaryFields: ["settingType", "status"],
    fields: [
      { name: "settingName", label: "Setting name", placeholder: "New lead pipeline" },
      { name: "settingType", label: "Type", type: "select", options: ["pipeline", "status", "custom field", "saved view", "automation"] },
      { name: "details", label: "Details", type: "textarea", placeholder: "Describe this CRM setting..." },
      { name: "status", label: "Status", type: "select", options: ["enabled", "disabled", "draft"] },
    ],
    initialRecords: [
      { id: "new-leads", settingName: "New leads pipeline", settingType: "pipeline", details: "Default intake lane for contact and quote submissions.", status: "enabled" },
      { id: "follow-up-status", settingName: "Follow-up status", settingType: "status", details: "Used for open CRM activity follow-ups.", status: "enabled" },
    ],
  },
};

function emptyForm(fields: Field[]) {
  return fields.reduce<Record<string, string>>((values, field) => {
    values[field.name] = field.options?.[0] ?? "";
    return values;
  }, {});
}

function labelFor(fieldName: string) {
  return fieldName.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

export default function SettingsSectionClient({ section }: { section: string }) {
  const config = configs[section];
  const [records, setRecords] = useState<RecordItem[]>(config?.initialRecords ?? []);
  const [form, setForm] = useState<Record<string, string>>(() => emptyForm(config?.fields ?? []));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const recordCount = records.length;
  const activeCount = useMemo(() => records.filter((record) => ["active", "enabled", "live"].includes((record.status ?? "").toLowerCase())).length, [records]);

  useEffect(() => {
    if (!config) return;
    const saved = window.localStorage.getItem(config.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as RecordItem[];
        setRecords(parsed);
      } catch {
        setRecords(config.initialRecords);
      }
    }
  }, [config]);

  useEffect(() => {
    if (!config) return;
    window.localStorage.setItem(config.storageKey, JSON.stringify(records));
  }, [config, records]);

  if (!config) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const primaryValue = form[config.primaryField]?.trim();
    if (!primaryValue) {
      setSavedMessage(`${labelFor(config.primaryField)} is required.`);
      return;
    }

    if (editingId) {
      setRecords((currentRecords) => currentRecords.map((record) => (record.id === editingId ? { ...record, ...form } : record)));
      setSavedMessage("Updated successfully.");
    } else {
      setRecords((currentRecords) => [{ id: `${Date.now()}`, ...form }, ...currentRecords]);
      setSavedMessage("Created successfully.");
    }

    setEditingId(null);
    setForm(emptyForm(config.fields));
  }

  function editRecord(record: RecordItem) {
    setEditingId(record.id);
    setForm(config.fields.reduce<Record<string, string>>((values, field) => {
      values[field.name] = record[field.name] ?? field.options?.[0] ?? "";
      return values;
    }, {}));
    setSavedMessage(null);
  }

  function deleteRecord(recordId: string) {
    setRecords((currentRecords) => currentRecords.filter((record) => record.id !== recordId));
    if (editingId === recordId) {
      setEditingId(null);
      setForm(emptyForm(config.fields));
    }
    setSavedMessage("Deleted successfully.");
  }

  function resetDefaults() {
    setRecords(config.initialRecords);
    setEditingId(null);
    setForm(emptyForm(config.fields));
    setSavedMessage("Defaults restored.");
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{editingId ? "Edit record" : config.formTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Create, edit, disable, or remove records for this settings area. Changes persist in this admin browser until backend table wiring is finalized.</p>
          </div>
          <button type="button" onClick={resetDefaults} className="rounded border border-neutral-300 px-3 py-2 text-xs font-semibold hover:border-green-800 hover:bg-green-50">Reset defaults</button>
        </div>

        {savedMessage ? <div className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{savedMessage}</div> : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
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
            {editingId ? (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm(config.fields)); }} className="rounded border border-neutral-300 px-5 py-3 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Cancel Edit</button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Saved records</h2>
            <p className="mt-2 text-sm text-neutral-600">{recordCount} total record{recordCount === 1 ? "" : "s"}. {activeCount} active/live/enabled.</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
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
                  <button type="button" onClick={() => editRecord(record)} className="rounded border border-neutral-300 px-3 py-2 text-xs font-semibold hover:border-green-800 hover:bg-white">Edit</button>
                  <button type="button" onClick={() => deleteRecord(record.id)} className="rounded border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
