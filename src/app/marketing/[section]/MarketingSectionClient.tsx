"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "textarea" | "select" | "file";
  options?: string[];
  placeholder?: string;
};

type RecordItem = {
  id: string;
  createdAt: string;
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
  helperText: string;
  quickLinks?: { label: string; href: string }[];
};

const socialChannels = ["Facebook", "Instagram", "LinkedIn", "YouTube", "TikTok", "X / Twitter", "Email", "Website"];
const socialStatus = ["idea", "draft", "ready", "scheduled", "posted", "blocked"];
const campaignStatus = ["idea", "planning", "active", "paused", "completed", "archived"];

function sectionConfig(config: SectionConfig): SectionConfig {
  return config;
}

function socialPlatformConfig(platform: string, key: string): SectionConfig {
  return sectionConfig({
    title: `${platform} Workspace`,
    description: `Create and manage ${platform} posts, captions, scripts, ads, media notes, schedule status, and publishing records.`,
    storageKey: `cgf-marketing-${key}`,
    formTitle: `Create ${platform} content`,
    submitLabel: `Save ${platform} Content`,
    primaryField: "title",
    secondaryFields: ["contentType", "status", "scheduledDate", "campaign"],
    helperText: `This is the live ${platform} workspace. Save post ideas, drafts, assets, schedules, and publishing status here.`,
    quickLinks: [
      { label: "Social Media Hub", href: "/marketing/social-media-hub" },
      { label: "Campaigns", href: "/marketing/campaigns" },
      { label: "AI Content Studio", href: "/marketing/ai" },
    ],
    fields: [
      { name: "title", label: "Content title", placeholder: `${platform} post, video, or campaign idea` },
      { name: "contentType", label: "Content type", type: "select", options: ["post", "caption", "script", "ad", "story", "short video", "campaign", "image"] },
      { name: "campaign", label: "Campaign", placeholder: "Campaign or promotion name" },
      { name: "status", label: "Status", type: "select", options: socialStatus },
      { name: "scheduledDate", label: "Scheduled date", type: "date" },
      { name: "copy", label: "Copy / script / caption", type: "textarea", placeholder: `Write or paste ${platform} content here` },
      { name: "mediaAssets", label: "Media assets / file references", placeholder: "Image, video, generated asset, or file reference" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Publishing notes, hashtags, targeting, or follow-up" },
    ],
  });
}

export const marketingSections: Record<string, SectionConfig> = {
  "lead-inbox": sectionConfig({
    title: "Lead Inbox",
    description: "Capture incoming shop requests, quote leads, distributor inquiries, phone calls, and follow-up opportunities.",
    storageKey: "cgf-marketing-lead-inbox",
    formTitle: "Create lead",
    submitLabel: "Save Lead",
    primaryField: "leadName",
    secondaryFields: ["companyName", "email", "phone", "status"],
    helperText: "This is the live lead inbox. Add customer, quote, phone, website, and distributor inquiries here.",
    quickLinks: [
      { label: "Contacts", href: "/marketing/contacts" },
      { label: "Companies", href: "/marketing/companies" },
      { label: "Opportunities", href: "/marketing/opportunities" },
    ],
    fields: [
      { name: "leadName", label: "Lead name", placeholder: "Customer or contact name" },
      { name: "companyName", label: "Company name", placeholder: "Optional company" },
      { name: "email", label: "Email", type: "email", placeholder: "Optional email" },
      { name: "phone", label: "Phone", placeholder: "Optional phone" },
      { name: "source", label: "Lead source", type: "select", options: ["website", "phone", "email", "distributor", "manual", "social media"] },
      { name: "status", label: "Status", type: "select", options: ["new", "contacted", "quoted", "follow-up", "won", "lost"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "What does this lead need?" },
    ],
  }),
  contacts: sectionConfig({
    title: "CRM Contacts",
    description: "Create and manage people tied to customers, distributors, manufacturers, vendors, partners, and prospects.",
    storageKey: "cgf-crm-contacts",
    formTitle: "Create contact",
    submitLabel: "Save Contact",
    primaryField: "firstName",
    secondaryFields: ["lastName", "email", "phone", "company"],
    helperText: "This is the live CRM contact workspace. Add individual contacts here and connect them to companies, leads, and orders by name.",
    quickLinks: [
      { label: "Companies", href: "/marketing/companies" },
      { label: "Lead Inbox", href: "/marketing/lead-inbox" },
      { label: "Opportunities", href: "/marketing/opportunities" },
    ],
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
    title: "CRM Companies",
    description: "Create and manage ranches, farms, distributors, contractors, manufacturers, vendors, and partners.",
    storageKey: "cgf-crm-companies",
    formTitle: "Create company",
    submitLabel: "Save Company",
    primaryField: "companyName",
    secondaryFields: ["companyType", "primaryEmail", "primaryPhone", "territory"],
    helperText: "This is the live CRM company workspace. Use it for distributor accounts, vendors, manufacturers, customer companies, and ranch/farm businesses.",
    quickLinks: [
      { label: "Contacts", href: "/marketing/contacts" },
      { label: "Distributor Accounts", href: "/marketing/distributor-accounts" },
      { label: "Orders", href: "/marketing/orders" },
    ],
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
  "custom-crm": sectionConfig({
    title: "Custom CRM",
    description: "Create flexible CRM records for anything that does not fit contacts, companies, opportunities, or orders yet.",
    storageKey: "cgf-marketing-custom-crm",
    formTitle: "Create CRM record",
    submitLabel: "Save CRM Record",
    primaryField: "recordName",
    secondaryFields: ["recordType", "status", "owner", "relatedCompany"],
    helperText: "This is the live flexible CRM workspace. Use it when you need to capture data before a dedicated CRM table exists.",
    quickLinks: [
      { label: "Contacts", href: "/marketing/contacts" },
      { label: "Companies", href: "/marketing/companies" },
      { label: "Orders", href: "/marketing/orders" },
    ],
    fields: [
      { name: "recordName", label: "Record name", placeholder: "CRM record title" },
      { name: "recordType", label: "Record type", type: "select", options: ["general", "customer", "vendor", "distributor", "manufacturer", "support", "note"] },
      { name: "relatedCompany", label: "Related company", placeholder: "Company name" },
      { name: "owner", label: "Owner", placeholder: "Assigned person" },
      { name: "status", label: "Status", type: "select", options: ["new", "active", "waiting", "completed", "archived"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "CRM details" },
    ],
  }),
  opportunities: sectionConfig({
    title: "Opportunities",
    description: "Track quotes, distributor deals, bulk purchases, and follow-up revenue opportunities.",
    storageKey: "cgf-crm-opportunities",
    formTitle: "Create opportunity",
    submitLabel: "Save Opportunity",
    primaryField: "opportunityTitle",
    secondaryFields: ["company", "estimatedValue", "quantity", "status"],
    helperText: "This is the live opportunity pipeline. Use it before a deal becomes an order.",
    quickLinks: [
      { label: "Lead Inbox", href: "/marketing/lead-inbox" },
      { label: "Orders", href: "/marketing/orders" },
      { label: "Order Pipeline", href: "/marketing/order-pipeline" },
    ],
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
    secondaryFields: ["company", "quantity", "status", "orderType"],
    helperText: "This is the live orders workspace. Use it for customer orders, distributor orders, and historical manual orders.",
    quickLinks: [
      { label: "Order Pipeline", href: "/marketing/order-pipeline" },
      { label: "Companies", href: "/marketing/companies" },
      { label: "Distributor Accounts", href: "/marketing/distributor-accounts" },
    ],
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
  "order-pipeline": sectionConfig({
    title: "Order Pipeline",
    description: "Track order stages from draft through payment, shipping, manufacturer handoff, ship date, and completion.",
    storageKey: "cgf-marketing-order-pipeline",
    formTitle: "Create order pipeline item",
    submitLabel: "Save Pipeline Item",
    primaryField: "orderName",
    secondaryFields: ["companyName", "stage", "quantity", "shipDate"],
    helperText: "This is the live order pipeline. It is separate from AI/ad generation and is where you track actual order progress.",
    quickLinks: [
      { label: "Orders", href: "/marketing/orders" },
      { label: "Distributor Accounts", href: "/marketing/distributor-accounts" },
      { label: "Companies", href: "/marketing/companies" },
    ],
    fields: [
      { name: "orderName", label: "Order name / number", placeholder: "Order or customer reference" },
      { name: "companyName", label: "Company", placeholder: "Company" },
      { name: "contactName", label: "Contact", placeholder: "Customer/contact" },
      { name: "stage", label: "Stage", type: "select", options: ["draft", "paid", "shipping ready", "sent to manufacturer", "ship date received", "shipped", "completed"] },
      { name: "quantity", label: "Quantity", type: "number", placeholder: "0" },
      { name: "shipDate", label: "Ship date", type: "date" },
      { name: "manufacturer", label: "Manufacturer / supplier", placeholder: "Supplier" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Order pipeline details" },
    ],
  }),
  "distributor-accounts": sectionConfig({
    title: "Distributor Accounts",
    description: "Manage distributor account records, pricing, contact status, territory, activity, and notes.",
    storageKey: "cgf-marketing-distributor-accounts",
    formTitle: "Create distributor account",
    submitLabel: "Save Distributor Account",
    primaryField: "companyName",
    secondaryFields: ["contactName", "status", "territory", "pricePerUnit"],
    helperText: "This is the live distributor account workspace. It is for distributor CRM data, not ad generation.",
    quickLinks: [
      { label: "Companies", href: "/marketing/companies" },
      { label: "Order Pipeline", href: "/marketing/order-pipeline" },
      { label: "Email Activity", href: "/marketing/email-activity" },
    ],
    fields: [
      { name: "companyName", label: "Distributor company", placeholder: "Barn World" },
      { name: "contactName", label: "Primary contact", placeholder: "Contact name" },
      { name: "email", label: "Email", type: "email", placeholder: "Optional email" },
      { name: "phone", label: "Phone", placeholder: "Optional phone" },
      { name: "territory", label: "Territory", placeholder: "State, region, or channel" },
      { name: "pricePerUnit", label: "Distributor price", type: "number", placeholder: "750" },
      { name: "status", label: "Status", type: "select", options: ["active", "pending", "needs follow-up", "disabled", "legacy"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Distributor notes, pricing, agreement, contacts, requirements" },
    ],
  }),
  "uploaded-files": sectionConfig({
    title: "Uploaded Files",
    description: "Register uploaded CRM files, customer files, sales imports, product photos, generated media, and marketing assets.",
    storageKey: "cgf-marketing-uploaded-files",
    formTitle: "Register uploaded file",
    submitLabel: "Save File Record",
    primaryField: "fileName",
    secondaryFields: ["fileType", "year", "status", "attachedFiles"],
    helperText: "This is the live file registry. Select files to capture their names for tracking. Full Supabase storage upload can be added next.",
    quickLinks: [
      { label: "CRM Import", href: "/admin/crm-import" },
      { label: "Marketing Content", href: "/marketing/marketing-content" },
      { label: "AI Content Studio", href: "/marketing/ai" },
    ],
    fields: [
      { name: "fileName", label: "File name / title", placeholder: "2019-customers-sales.csv" },
      { name: "attachedFiles", label: "Choose file(s)", type: "file" },
      { name: "fileType", label: "File type", type: "select", options: ["crm import", "customer list", "sales file", "media asset", "document", "generated image", "generated video plan"] },
      { name: "year", label: "Year", type: "select", options: ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"] },
      { name: "status", label: "Status", type: "select", options: ["received", "reviewed", "imported", "archived"] },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "What is in this file?" },
    ],
  }),
  "marketing-posts": sectionConfig({
    title: "Marketing Posts",
    description: "Create social posts, email content, campaign drafts, and scheduled marketing content.",
    storageKey: "cgf-crm-marketing-posts",
    formTitle: "Create marketing post",
    submitLabel: "Save Post",
    primaryField: "title",
    secondaryFields: ["channel", "status", "scheduledAt", "campaign"],
    helperText: "This is the live marketing posts workspace. Use AI Content Studio only when you want to generate a draft first.",
    quickLinks: [
      { label: "Social Media Hub", href: "/marketing/social-media-hub" },
      { label: "Campaigns", href: "/marketing/campaigns" },
      { label: "AI Content Studio", href: "/marketing/ai" },
    ],
    fields: [
      { name: "title", label: "Title", placeholder: "Post title" },
      { name: "channel", label: "Channel", type: "select", options: socialChannels },
      { name: "campaign", label: "Campaign", placeholder: "Campaign name" },
      { name: "caption", label: "Caption / copy", type: "textarea", placeholder: "Post copy" },
      { name: "status", label: "Status", type: "select", options: ["idea", "draft", "scheduled", "published"] },
      { name: "scheduledAt", label: "Scheduled date", type: "date" },
      { name: "mediaAssets", label: "Media assets", placeholder: "Image/video reference" },
    ],
  }),
  campaigns: sectionConfig({
    title: "Campaigns",
    description: "Manage reusable campaign containers for education, distributor recruiting, promotions, blog pushes, and social content.",
    storageKey: "cgf-crm-campaigns",
    formTitle: "Create campaign",
    submitLabel: "Save Campaign",
    primaryField: "campaignName",
    secondaryFields: ["goal", "startDate", "status", "budget"],
    helperText: "This is the live campaign workspace. Use it to organize posts, emails, blog content, distributor campaigns, and sales pushes.",
    quickLinks: [
      { label: "Marketing Posts", href: "/marketing/marketing-posts" },
      { label: "Blog Manager", href: "/marketing/blog" },
      { label: "Email Activity", href: "/marketing/email-activity" },
    ],
    fields: [
      { name: "campaignName", label: "Campaign name", placeholder: "Campaign" },
      { name: "goal", label: "Goal", placeholder: "Campaign goal" },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "budget", label: "Budget", type: "number", placeholder: "0" },
      { name: "status", label: "Status", type: "select", options: campaignStatus },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Campaign details" },
    ],
  }),
  "campaign-calendar": sectionConfig({
    title: "Campaign Calendar",
    description: "Schedule campaigns by date, channel, status, and objective.",
    storageKey: "cgf-marketing-campaign-calendar",
    formTitle: "Create calendar item",
    submitLabel: "Save Calendar Item",
    primaryField: "campaignName",
    secondaryFields: ["channel", "startDate", "status", "owner"],
    helperText: "This is the live campaign calendar workspace. It tracks planned dates and channel activity.",
    quickLinks: [
      { label: "Campaigns", href: "/marketing/campaigns" },
      { label: "Marketing Posts", href: "/marketing/marketing-posts" },
      { label: "Blog Manager", href: "/marketing/blog" },
    ],
    fields: [
      { name: "campaignName", label: "Campaign / calendar item", placeholder: "Spring distributor push" },
      { name: "channel", label: "Channel", type: "select", options: socialChannels },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "owner", label: "Owner", placeholder: "Assigned person" },
      { name: "status", label: "Status", type: "select", options: campaignStatus },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Calendar details" },
    ],
  }),
  "social-media-hub": sectionConfig({
    title: "Social Media Hub",
    description: "Plan and track social accounts, draft posts, media ideas, publishing status, and platform-specific content.",
    storageKey: "cgf-marketing-social-media-hub",
    formTitle: "Create social item",
    submitLabel: "Save Social Item",
    primaryField: "title",
    secondaryFields: ["channel", "status", "scheduledDate", "campaign"],
    helperText: "This is the live social media hub. Use platform pages for specific channels or track all channels here.",
    quickLinks: [
      { label: "Facebook", href: "/marketing/facebook" },
      { label: "Instagram", href: "/marketing/instagram" },
      { label: "LinkedIn", href: "/marketing/linkedin" },
      { label: "YouTube", href: "/marketing/youtube" },
      { label: "TikTok", href: "/marketing/tiktok" },
    ],
    fields: [
      { name: "title", label: "Title", placeholder: "Post idea or account task" },
      { name: "channel", label: "Channel", type: "select", options: socialChannels },
      { name: "campaign", label: "Campaign", placeholder: "Campaign name" },
      { name: "status", label: "Status", type: "select", options: socialStatus },
      { name: "scheduledDate", label: "Scheduled date", type: "date" },
      { name: "copy", label: "Caption / copy", type: "textarea", placeholder: "Write post copy or notes" },
      { name: "mediaAssets", label: "Media assets", placeholder: "Image/video reference" },
    ],
  }),
  facebook: socialPlatformConfig("Facebook", "facebook"),
  instagram: socialPlatformConfig("Instagram", "instagram"),
  linkedin: socialPlatformConfig("LinkedIn", "linkedin"),
  youtube: socialPlatformConfig("YouTube", "youtube"),
  tiktok: socialPlatformConfig("TikTok", "tiktok"),
  "email-activity": sectionConfig({
    title: "Email Activity",
    description: "Track email templates, outbound follow-ups, distributor messages, customer communications, and send status.",
    storageKey: "cgf-marketing-email-activity",
    formTitle: "Create email activity",
    submitLabel: "Save Email Activity",
    primaryField: "subject",
    secondaryFields: ["recipientType", "status", "sendDate", "campaign"],
    helperText: "This is the live email activity workspace. Track manual emails, templates, follow-ups, and campaign emails here.",
    quickLinks: [
      { label: "Distributor Accounts", href: "/marketing/distributor-accounts" },
      { label: "Campaigns", href: "/marketing/campaigns" },
      { label: "AI Content Studio", href: "/marketing/ai" },
    ],
    fields: [
      { name: "subject", label: "Subject", placeholder: "Follow-up on CowStop order" },
      { name: "recipientType", label: "Recipient type", type: "select", options: ["customer", "distributor", "manufacturer", "admin", "lead"] },
      { name: "campaign", label: "Campaign", placeholder: "Campaign name" },
      { name: "status", label: "Status", type: "select", options: ["draft", "scheduled", "sent", "needs review"] },
      { name: "sendDate", label: "Send date", type: "date" },
      { name: "body", label: "Email body / notes", type: "textarea", placeholder: "Message content or notes" },
    ],
  }),
  "marketing-content": sectionConfig({
    title: "Marketing Content",
    description: "Create marketing ideas, page copy, blog drafts, ad concepts, sales materials, and educational content.",
    storageKey: "cgf-marketing-content",
    formTitle: "Create content item",
    submitLabel: "Save Content",
    primaryField: "title",
    secondaryFields: ["contentType", "status", "channel", "campaign"],
    helperText: "This is the live marketing content bucket. Use it for reusable copy, blog ideas, ad concepts, and content drafts.",
    quickLinks: [
      { label: "Blog Manager", href: "/marketing/blog" },
      { label: "Marketing Posts", href: "/marketing/marketing-posts" },
      { label: "AI Content Studio", href: "/marketing/ai" },
    ],
    fields: [
      { name: "title", label: "Title", placeholder: "Why reusable forms save money" },
      { name: "contentType", label: "Content type", type: "select", options: ["blog", "ad", "email", "social", "sales sheet", "landing page", "image prompt", "video plan"] },
      { name: "channel", label: "Channel", placeholder: "Website, Facebook, email, etc." },
      { name: "campaign", label: "Campaign", placeholder: "Campaign name" },
      { name: "status", label: "Status", type: "select", options: ["idea", "draft", "review", "approved", "published"] },
      { name: "copy", label: "Copy / notes", type: "textarea", placeholder: "Content draft" },
    ],
  }),
  "automation-rules": sectionConfig({
    title: "Automation Rules",
    description: "Define manual and future automated rules for lead routing, follow-ups, imports, campaigns, and order actions.",
    storageKey: "cgf-marketing-automation-rules",
    formTitle: "Create automation rule",
    submitLabel: "Save Rule",
    primaryField: "ruleName",
    secondaryFields: ["trigger", "status", "action", "owner"],
    helperText: "This is the live automation planning workspace. It stores rules now; actual backend automation can be wired next.",
    quickLinks: [
      { label: "Lead Inbox", href: "/marketing/lead-inbox" },
      { label: "Email Activity", href: "/marketing/email-activity" },
      { label: "Order Pipeline", href: "/marketing/order-pipeline" },
    ],
    fields: [
      { name: "ruleName", label: "Rule name", placeholder: "New lead follow-up" },
      { name: "trigger", label: "Trigger", placeholder: "New lead created" },
      { name: "action", label: "Action", placeholder: "Create task or send email" },
      { name: "owner", label: "Owner", placeholder: "Assigned person" },
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
    helperText: "This module is live and stores records in this browser until Supabase persistence is added.",
    fields: [
      { name: "title", label: "Title", placeholder: `${title} record` },
      { name: "status", label: "Status", type: "select", options: ["new", "active", "draft", "scheduled", "completed", "archived"] },
      { name: "owner", label: "Owner", placeholder: "Assigned person" },
      { name: "dueDate", label: "Due date", type: "date" },
      { name: "notes", label: "Notes", type: "textarea", placeholder: "Details" },
    ],
  });
}

function emptyForm(fields: Field[]) {
  return fields.reduce<Record<string, string>>((values, field) => {
    values[field.name] = field.type === "select" ? field.options?.[0] ?? "" : "";
    return values;
  }, {});
}

function labelFor(fieldName: string) {
  return fieldName.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

export default function MarketingSectionClient({ section }: { section: string }) {
  const config = useMemo(() => marketingSections[section] ?? genericConfig(section), [section]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [form, setForm] = useState<Record<string, string>>(() => emptyForm(config.fields));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(config.storageKey);
    if (saved) {
      try {
        setRecords(JSON.parse(saved) as RecordItem[]);
      } catch {
        setRecords([]);
      }
    } else {
      setRecords([]);
    }
    setForm(emptyForm(config.fields));
    setEditingId(null);
    setMessage(null);
  }, [config]);

  useEffect(() => {
    window.localStorage.setItem(config.storageKey, JSON.stringify(records));
  }, [config.storageKey, records]);

  function updateField(fieldName: string, value: string) {
    setForm((current) => ({ ...current, [fieldName]: value }));
  }

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
      setRecords((current) => [{ id: `${Date.now()}`, createdAt: new Date().toLocaleString(), ...form }, ...current]);
      setMessage("Created successfully.");
    }

    setEditingId(null);
    setForm(emptyForm(config.fields));
  }

  function edit(record: RecordItem) {
    setEditingId(record.id);
    setMessage(null);
    setForm(config.fields.reduce<Record<string, string>>((values, field) => {
      values[field.name] = record[field.name] ?? (field.type === "select" ? field.options?.[0] ?? "" : "");
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

  function clearRecords() {
    setRecords([]);
    setEditingId(null);
    setForm(emptyForm(config.fields));
    setMessage("Records cleared for this module.");
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold">{config.title} Workspace</h2>
            <p className="mt-2 leading-7 text-neutral-700">{config.helperText}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {(config.quickLinks ?? []).map((link) => (
              <Link key={link.href} href={link.href} className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{editingId ? "Edit record" : config.formTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Fill this form to save a real record inside this module. Current storage is local browser storage; Supabase-backed persistence is the next backend hardening step.</p>
            </div>
            <button type="button" onClick={clearRecords} className="rounded border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Clear</button>
          </div>

          {message ? <div className="mt-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{message}</div> : null}

          <form onSubmit={submit} className="mt-6 grid gap-4">
            {config.fields.map((field) => (
              <label key={field.name} className="grid gap-2 text-sm font-medium text-neutral-700">
                {field.label}
                {field.type === "textarea" ? (
                  <textarea value={form[field.name] ?? ""} onChange={(event) => updateField(field.name, event.target.value)} placeholder={field.placeholder} className="min-h-28 rounded border border-neutral-300 px-3 py-2 font-normal" />
                ) : field.type === "select" ? (
                  <select value={form[field.name] ?? field.options?.[0] ?? ""} onChange={(event) => updateField(field.name, event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                    {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : field.type === "file" ? (
                  <input type="file" multiple onChange={(event) => updateField(field.name, Array.from(event.target.files ?? []).map((file) => file.name).join(", "))} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
                ) : (
                  <input type={field.type ?? "text"} value={form[field.name] ?? ""} onChange={(event) => updateField(field.name, event.target.value)} placeholder={field.placeholder} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
                )}
                {field.type === "file" && form[field.name] ? <span className="text-xs font-normal text-neutral-500">Selected: {form[field.name]}</span> : null}
              </label>
            ))}

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900">{editingId ? "Save Changes" : config.submitLabel}</button>
              {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm(config.fields)); }} className="rounded border border-neutral-300 px-5 py-3 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Cancel Edit</button> : null}
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Saved {config.title} Records</h2>
              <p className="mt-2 text-sm text-neutral-600">{records.length} saved record{records.length === 1 ? "" : "s"}</p>
            </div>
            <Link href="/marketing" className="rounded border border-neutral-300 px-4 py-2 text-sm font-semibold hover:border-green-800 hover:bg-green-50">Marketing Home</Link>
          </div>

          <div className="mt-5 space-y-3">
            {records.length === 0 ? <div className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600 ring-1 ring-neutral-200">No records yet. Create the first one on the left.</div> : null}
            {records.map((record) => (
              <article key={record.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Created {record.createdAt}</p>
                    <h3 className="mt-1 font-semibold text-neutral-950">{record[config.primaryField]}</h3>
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
    </div>
  );
}
