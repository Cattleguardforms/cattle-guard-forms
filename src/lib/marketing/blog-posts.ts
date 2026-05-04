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
    body: [
      "A cattle guard is usually one of the first pieces of infrastructure people notice at a ranch entrance, farm lane, or pasture access point. It has to be strong enough for vehicle traffic, practical for livestock control, and durable enough to live outside for years. Traditionally, that meant sourcing a heavy welded steel cattle guard, paying freight on a large steel assembly, and then coordinating unloading, placement, and installation around that shipment.",
      "Reusable concrete cattle guard forms change the planning equation. Instead of shipping the entire finished guard as a large steel unit, CowStop lets a contractor, rancher, or distributor pour concrete cattle guard sections closer to the jobsite. Concrete, rebar, and local labor can often be sourced regionally, while the reusable form provides the repeatable shape needed for consistent sections.",
      "The freight advantage is straightforward: moving a reusable form is different from repeatedly moving completed steel cattle guards. A finished steel guard can be wide, heavy, awkward to unload, and expensive to ship over long distances. A form system is purchased once and reused across projects, which can reduce the burden of freight on every future installation.",
      "Reusable forms can also help with scheduling. When the form is already available, you are not waiting on a fabricated steel unit to be built, coated, shipped, and delivered before every job. You can plan the pour, stage materials, and produce sections when the site is ready. That is especially useful for distributors, contractors, and ranch operations that expect multiple installations over time.",
      "Concrete cattle guard sections are not a shortcut around good installation practices. The site still needs a proper base, drainage planning, adequate support, and careful placement. But for many rural entrances, the ability to pour durable sections with a reusable mold can make the project easier to budget and easier to repeat.",
      "CowStop is designed for customers who want a practical cattle guard form system rather than a one-off steel shipment. If you are comparing total project cost, look beyond the price of the guard itself. Include freight, lead time, unloading equipment, future reuse, and whether the same form can support more than one entrance or more than one customer project.",
      "Before ordering, confirm your opening width, expected traffic, site drainage, and whether you plan to pour one entrance or multiple entrances. Cattle Guard Forms can help review the basic quantity and planning questions before you commit to a form package."
    ].join("\n\n"),
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
    body: [
      "Good cattle guard planning starts with the opening. Before ordering forms or scheduling a pour, measure the clear driveway, lane, or pasture entrance width you need to cover. Most ranch and farm entrances are planned around common widths such as 12 feet, 16 feet, or 18 feet, but the best layout depends on the vehicles using the entrance and the site conditions around it.",
      "CowStop sections are commonly planned as repeatable concrete pours. For a 12 foot opening, many customers plan around six CowStop pours. For an 18 foot opening, many customers plan around nine CowStop pours. Those examples assume a layout where each poured section contributes to the final cattle guard width in a consistent repeatable pattern.",
      "A 16 foot opening can require more planning because it may not divide as cleanly depending on the exact form layout, edge treatment, and how much finished coverage you need. In that case, it is worth confirming whether you want a slightly wider finished guard, a custom divider strategy, or a different form configuration.",
      "When planning quantity, do not only think about the driveway width. Also consider the approach, the base, drainage, expected traffic, and how the sections will be handled after curing. Heavy vehicles, trailers, feed trucks, and equipment access may change the practical layout. A ranch entrance that only sees pickup traffic may not have the same requirements as a commercial farm lane or equipment route.",
      "Drainage is another major part of the plan. A cattle guard should not become a water trap. Before pouring, evaluate where water moves during heavy rain and how the base will stay stable. Proper drainage and support help protect the finished installation and reduce long-term maintenance problems.",
      "If you are a distributor or contractor, planning multiple openings at once can make reusable forms more valuable. The same form can support repeat pours, which helps standardize the process and gives your team a repeatable method for future customers.",
      "Before you pour, confirm the form count, section layout, reinforcing plan, base preparation, and unloading or placement equipment. If you are unsure how many sections you need for a 12, 16, or 18 foot opening, contact Cattle Guard Forms before ordering so the project can be reviewed before materials are staged."
    ].join("\n\n"),
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
  const baseQuery = supabase.from("marketing_blog_posts").select("*");
  const filteredQuery = publishedOnly ? baseQuery.eq("status", "published") : baseQuery;
  const { data, error } = await filteredQuery
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as RawRecord[]).map(normalizeRecord);
}

export async function getMarketingBlogPostBySlug(slug: string, { publishedOnly = true } = {}) {
  const supabase = createSupabaseAdminClient();
  const baseQuery = supabase.from("marketing_blog_posts").select("*").eq("slug", slug);
  const filteredQuery = publishedOnly ? baseQuery.eq("status", "published") : baseQuery;
  const { data, error } = await filteredQuery.limit(1).maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeRecord(data as RawRecord) : null;
}

export function getStarterBlogPostBySlug(slug: string) {
  return starterBlogPosts.find((post) => post.slug === slug) ?? null;
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
