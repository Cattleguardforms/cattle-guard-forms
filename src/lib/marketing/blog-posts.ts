import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type MarketingBlogPost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  publish_date: string | null;
  seo_title: string | null;
  meta_description: string | null;
  excerpt: string | null;
  body: string | null;
  campaign: string | null;
  hero_image_prompt: string | null;
  supporting_image_prompts: string | null;
  video_pack: string | null;
  social_pack: string | null;
  email_pack: string | null;
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
};

export type MarketingBlogInput = {
  title: string;
  slug?: string;
  category?: string;
  status?: string;
  publish_date?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  excerpt?: string | null;
  body?: string | null;
  campaign?: string | null;
  hero_image_prompt?: string | null;
  supporting_image_prompts?: string | null;
  video_pack?: string | null;
  social_pack?: string | null;
  email_pack?: string | null;
};

type RawRecord = Record<string, unknown>;

export const starterBlogPosts: MarketingBlogPost[] = [
  {
    id: "steel-freight-savings",
    title: "How Reusable Concrete Cattle Guard Forms Help Ranchers Save on Steel Freight",
    slug: "reusable-concrete-cattle-guard-forms-save-on-steel-freight",
    category: "Cost savings",
    status: "published",
    publish_date: "2026-04-26",
    seo_title: "Reusable Concrete Cattle Guard Forms vs Steel Freight Costs",
    meta_description: "Learn how reusable concrete cattle guard forms can reduce steel freight challenges and help ranchers plan durable cattle guard installations.",
    excerpt:
      "Traditional steel cattle guards are expensive to fabricate, heavy to ship, and often slow to source. CowStop gives landowners a reusable form system for pouring durable concrete cattle guard sections on-site.",
    body: "Starter article connected to the public blog page. Expand with freight comparison, concrete/rebar sourcing, reusable mold benefits, and CTA to request pricing.",
    campaign: "CowStop education",
    hero_image_prompt: null,
    supporting_image_prompts: null,
    video_pack: null,
    social_pack: null,
    email_pack: null,
    created_at: null,
    updated_at: null,
    published_at: "2026-04-26T00:00:00.000Z",
  },
  {
    id: "pour-planning",
    title: "CowStop Pour Planning: How Many Sections You Need for 12, 16, and 18 Foot Openings",
    slug: "cowstop-pour-planning-12-16-18-foot-openings",
    category: "Installation planning",
    status: "published",
    publish_date: "2026-04-26",
    seo_title: "CowStop Pour Planning for 12, 16, and 18 Foot Openings",
    meta_description: "Plan CowStop cattle guard pours for common ranch entrance opening sizes, including 12, 16, and 18 foot layouts.",
    excerpt:
      "A practical guide to opening size, pour count, layout planning, and when to consider CowStop sections, custom dividers, or Texan forms.",
    body: "Starter article connected to the public blog page. Include 12 ft = 6 CowStop pours, 18 ft = 9 CowStop pours, and 16 ft alternatives.",
    campaign: "Installation education",
    hero_image_prompt: null,
    supporting_image_prompts: null,
    video_pack: null,
    social_pack: null,
    email_pack: null,
    created_at: null,
    updated_at: null,
    published_at: "2026-04-26T00:00:00.000Z",
  },
];

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeRecord(record: RawRecord): MarketingBlogPost {
  return {
    id: asString(record.id) ?? "",
    title: asString(record.title) ?? "Untitled blog post",
    slug: asString(record.slug) ?? "untitled-blog-post",
    category: asString(record.category) ?? "Product education",
    status: asString(record.status) ?? "draft",
    publish_date: asString(record.publish_date),
    seo_title: asString(record.seo_title),
    meta_description: asString(record.meta_description),
    excerpt: asString(record.excerpt),
    body: asString(record.body),
    campaign: asString(record.campaign),
    hero_image_prompt: asString(record.hero_image_prompt),
    supporting_image_prompts: asString(record.supporting_image_prompts),
    video_pack: asString(record.video_pack),
    social_pack: asString(record.social_pack),
    email_pack: asString(record.email_pack),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
    published_at: asString(record.published_at),
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizeInput(input: MarketingBlogInput) {
  const title = input.title.trim();
  const status = input.status || "draft";
  const now = new Date().toISOString();

  return {
    title,
    slug: slugify(input.slug || title),
    category: input.category || "Product education",
    status,
    publish_date: input.publish_date || null,
    seo_title: input.seo_title || title,
    meta_description: input.meta_description || null,
    excerpt: input.excerpt || null,
    body: input.body || null,
    campaign: input.campaign || null,
    hero_image_prompt: input.hero_image_prompt || null,
    supporting_image_prompts: input.supporting_image_prompts || null,
    video_pack: input.video_pack || null,
    social_pack: input.social_pack || null,
    email_pack: input.email_pack || null,
    published_at: status === "published" ? now : null,
    updated_at: now,
  };
}

export async function getMarketingBlogPosts({ publishedOnly = false } = {}) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("marketing_blog_posts")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (publishedOnly) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as RawRecord[]).map(normalizeRecord);
}

export async function createMarketingBlogPost(input: MarketingBlogInput) {
  if (!input.title?.trim()) {
    throw new Error("Blog title is required.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("marketing_blog_posts")
    .insert(normalizeInput(input))
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeRecord((data ?? {}) as RawRecord);
}

export async function updateMarketingBlogPost(id: string, input: Partial<MarketingBlogInput> & { status?: string }) {
  if (!id) throw new Error("Blog post id is required.");
  const supabase = createSupabaseAdminClient();
  const update: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  for (const key of [
    "title",
    "slug",
    "category",
    "status",
    "publish_date",
    "seo_title",
    "meta_description",
    "excerpt",
    "body",
    "campaign",
    "hero_image_prompt",
    "supporting_image_prompts",
    "video_pack",
    "social_pack",
    "email_pack",
  ] as const) {
    const value = input[key];
    if (value !== undefined) update[key] = value;
  }

  if (input.title && !input.slug) update.slug = slugify(input.title);
  if (input.status === "published") update.published_at = new Date().toISOString();
  if (input.status && input.status !== "published") update.published_at = null;

  const { data, error } = await supabase
    .from("marketing_blog_posts")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return normalizeRecord((data ?? {}) as RawRecord);
}

export async function deleteMarketingBlogPost(id: string) {
  if (!id) throw new Error("Blog post id is required.");
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("marketing_blog_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
