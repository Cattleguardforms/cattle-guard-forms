export type CrmFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "datetime"
  | "dropdown"
  | "multi_select"
  | "checkbox"
  | "email"
  | "phone"
  | "url"
  | "file"
  | "relationship";

export type CrmFieldConfig = {
  key: string;
  label: string;
  type: CrmFieldType;
  required?: boolean;
  options?: string[];
  relatesTo?: string;
  system?: boolean;
};

export type CrmEntityConfig = {
  key: string;
  label: string;
  pluralLabel: string;
  description: string;
  fields: CrmFieldConfig[];
};

export type CrmPipelineStage = {
  key: string;
  label: string;
  description: string;
};

export type CrmPipelineConfig = {
  key: string;
  label: string;
  entity: string;
  description: string;
  stages: CrmPipelineStage[];
};

export type SocialChannelConfig = {
  key: string;
  label: string;
  status: "not_connected" | "planned" | "connected_later";
  description: string;
  platformUrl: string;
  workspaceUrl: string;
};

export const crmEntities: CrmEntityConfig[] = [
  {
    key: "contacts",
    label: "Contact",
    pluralLabel: "Contacts",
    description: "People tied to customers, distributors, manufacturers, vendors, partners, and prospects.",
    fields: [
      { key: "first_name", label: "First Name", type: "text" },
      { key: "last_name", label: "Last Name", type: "text" },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "phone", label: "Phone", type: "phone" },
      { key: "company_id", label: "Company", type: "relationship", relatesTo: "companies" },
      { key: "role", label: "Role", type: "dropdown", options: ["Customer", "Distributor", "Manufacturer", "Vendor", "Partner", "Internal"] },
      { key: "status", label: "Status", type: "dropdown", options: ["New", "Active", "Needs Follow-Up", "Inactive"] },
      { key: "owner", label: "Owner", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    key: "companies",
    label: "Company",
    pluralLabel: "Companies",
    description: "Organizations such as ranches, farms, distributors, contractors, manufacturers, and vendors.",
    fields: [
      { key: "name", label: "Company Name", type: "text", required: true },
      { key: "type", label: "Company Type", type: "dropdown", options: ["Customer", "Distributor", "Manufacturer", "Vendor", "Partner", "Internal"] },
      { key: "website", label: "Website", type: "url" },
      { key: "primary_email", label: "Primary Email", type: "email" },
      { key: "primary_phone", label: "Primary Phone", type: "phone" },
      { key: "territory", label: "Territory", type: "text" },
      { key: "logo", label: "Logo", type: "file" },
      { key: "status", label: "Status", type: "dropdown", options: ["Prospect", "Approved", "Active", "Paused", "Disabled"] },
    ],
  },
  {
    key: "opportunities",
    label: "Opportunity",
    pluralLabel: "Opportunities",
    description: "Potential orders, quotes, distributor deals, bulk purchases, and follow-up revenue opportunities.",
    fields: [
      { key: "title", label: "Opportunity Title", type: "text", required: true },
      { key: "company_id", label: "Company", type: "relationship", relatesTo: "companies" },
      { key: "contact_id", label: "Primary Contact", type: "relationship", relatesTo: "contacts" },
      { key: "estimated_value", label: "Estimated Value", type: "currency" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "source", label: "Lead Source", type: "dropdown", options: ["Website", "Phone", "Email", "Distributor", "Referral", "Social", "Trade Show", "Other"] },
      { key: "priority", label: "Priority", type: "dropdown", options: ["Low", "Medium", "High", "Urgent"] },
      { key: "expected_close_date", label: "Expected Close Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    key: "orders",
    label: "Order",
    pluralLabel: "Orders",
    description: "Retail and distributor orders from request through payment, fulfillment, shipping, and completion.",
    fields: [
      { key: "order_number", label: "Order Number", type: "text", system: true },
      { key: "company_id", label: "Company", type: "relationship", relatesTo: "companies" },
      { key: "contact_id", label: "Contact", type: "relationship", relatesTo: "contacts" },
      { key: "order_type", label: "Order Type", type: "dropdown", options: ["Retail", "Distributor", "Internal"] },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "unit_price", label: "Unit Price", type: "currency" },
      { key: "total", label: "Total", type: "currency" },
      { key: "payment_status", label: "Payment Status", type: "dropdown", options: ["Pending", "Paid", "Failed", "Refunded"] },
      { key: "shipping_method", label: "Shipping Method", type: "dropdown", options: ["Cattle Guard Forms Shipping", "Ship on Own", "Pickup", "Other"] },
      { key: "bol_file", label: "BOL File", type: "file" },
      { key: "tracking_number", label: "Tracking Number", type: "text" },
      { key: "expected_ship_date", label: "Expected Ship Date", type: "date" },
    ],
  },
  {
    key: "marketing_posts",
    label: "Marketing Post",
    pluralLabel: "Marketing Posts",
    description: "Social posts, email content, campaign drafts, and scheduled marketing content.",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "channel", label: "Channel", type: "dropdown", options: ["Facebook", "Instagram", "X / Twitter", "LinkedIn", "YouTube", "TikTok", "Email", "Website"] },
      { key: "caption", label: "Caption / Copy", type: "textarea" },
      { key: "status", label: "Status", type: "dropdown", options: ["Idea", "Draft", "Needs Review", "Approved", "Scheduled", "Published", "Archived"] },
      { key: "scheduled_at", label: "Scheduled At", type: "datetime" },
      { key: "media_assets", label: "Media Assets", type: "file" },
      { key: "campaign_id", label: "Campaign", type: "relationship", relatesTo: "campaigns" },
    ],
  },
  {
    key: "campaigns",
    label: "Campaign",
    pluralLabel: "Campaigns",
    description: "Reusable campaign containers for product education, distributor recruiting, seasonal promotions, and content pushes.",
    fields: [
      { key: "name", label: "Campaign Name", type: "text", required: true },
      { key: "goal", label: "Goal", type: "textarea" },
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "end_date", label: "End Date", type: "date" },
      { key: "budget", label: "Budget", type: "currency" },
      { key: "status", label: "Status", type: "dropdown", options: ["Planning", "Active", "Paused", "Completed", "Archived"] },
    ],
  },
];

export const crmPipelines: CrmPipelineConfig[] = [
  {
    key: "retail_leads",
    label: "Retail Lead Pipeline",
    entity: "opportunities",
    description: "Tracks public shop requests and retail customer quote opportunities.",
    stages: [
      { key: "new", label: "New", description: "Lead submitted or manually created." },
      { key: "qualified", label: "Qualified", description: "Need, quantity, and location reviewed." },
      { key: "quoted", label: "Quoted", description: "Pricing or next steps sent." },
      { key: "follow_up", label: "Follow-Up", description: "Waiting on customer response." },
      { key: "won", label: "Won", description: "Converted to order." },
      { key: "lost", label: "Lost", description: "Not moving forward." },
    ],
  },
  {
    key: "distributor_recruiting",
    label: "Distributor Recruiting Pipeline",
    entity: "companies",
    description: "Tracks potential distributors from interest to approval.",
    stages: [
      { key: "interested", label: "Interested", description: "Potential distributor asked for information." },
      { key: "review", label: "Review", description: "Company being reviewed internally." },
      { key: "terms", label: "Terms Sent", description: "Distributor pricing or terms sent." },
      { key: "approved", label: "Approved", description: "Approved for distributor access." },
      { key: "active", label: "Active", description: "Distributor account is live." },
    ],
  },
  {
    key: "distributor_orders",
    label: "Distributor Order Pipeline",
    entity: "orders",
    description: "Tracks distributor order status from placement to completion.",
    stages: [
      { key: "draft", label: "Draft", description: "Order started but not paid." },
      { key: "paid", label: "Paid", description: "Payment confirmed." },
      { key: "shipping_ready", label: "Shipping Ready", description: "Echo shipping selected or BOL uploaded." },
      { key: "manufacturer_sent", label: "Sent to Manufacturer", description: "Fulfillment email sent." },
      { key: "ship_date_received", label: "Ship Date Received", description: "Manufacturer provided expected ship date." },
      { key: "shipped", label: "Shipped", description: "Tracking or pickup details sent." },
      { key: "completed", label: "Completed", description: "Order complete." },
    ],
  },
  {
    key: "marketing_campaigns",
    label: "Marketing Campaign Pipeline",
    entity: "campaigns",
    description: "Tracks campaign planning and production.",
    stages: [
      { key: "idea", label: "Idea", description: "Campaign concept captured." },
      { key: "planning", label: "Planning", description: "Audience, goal, and assets being prepared." },
      { key: "content", label: "Content Creation", description: "Posts, graphics, or copy being created." },
      { key: "review", label: "Review", description: "Needs approval." },
      { key: "active", label: "Active", description: "Campaign is live." },
      { key: "complete", label: "Complete", description: "Campaign finished and reviewed." },
    ],
  },
];

export const socialChannels: SocialChannelConfig[] = [
  { key: "facebook", label: "Facebook", status: "not_connected", platformUrl: "https://www.facebook.com/", workspaceUrl: "/marketing/facebook", description: "Page posts, ranch education, before/after photos, and distributor announcements." },
  { key: "instagram", label: "Instagram", status: "not_connected", platformUrl: "https://www.instagram.com/", workspaceUrl: "/marketing/instagram", description: "Visual project posts, reels, installation steps, and product lifestyle content." },
  { key: "x", label: "X / Twitter", status: "not_connected", platformUrl: "https://x.com/", workspaceUrl: "/marketing/x", description: "Short updates, product announcements, and industry commentary." },
  { key: "linkedin", label: "LinkedIn", status: "not_connected", platformUrl: "https://www.linkedin.com/company/", workspaceUrl: "/marketing/linkedin", description: "B2B distributor updates, wholesale news, and company credibility posts." },
  { key: "youtube", label: "YouTube", status: "not_connected", platformUrl: "https://www.youtube.com/", workspaceUrl: "/marketing/youtube", description: "Installation videos, product walkthroughs, and customer education." },
  { key: "tiktok", label: "TikTok", status: "planned", platformUrl: "https://www.tiktok.com/", workspaceUrl: "/marketing/tiktok", description: "Short-form ranch and installation clips after the core system is stable." },
];

export const crmFieldTypes: { type: CrmFieldType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "textarea", label: "Long Text" },
  { type: "number", label: "Number" },
  { type: "currency", label: "Currency" },
  { type: "date", label: "Date" },
  { type: "datetime", label: "Date & Time" },
  { type: "dropdown", label: "Dropdown" },
  { type: "multi_select", label: "Multi-select" },
  { type: "checkbox", label: "Checkbox" },
  { type: "email", label: "Email" },
  { type: "phone", label: "Phone" },
  { type: "url", label: "URL" },
  { type: "file", label: "File" },
  { type: "relationship", label: "Relationship" },
];

export const crmConfiguration = {
  entities: crmEntities,
  pipelines: crmPipelines,
  socialChannels,
  fieldTypes: crmFieldTypes,
};
