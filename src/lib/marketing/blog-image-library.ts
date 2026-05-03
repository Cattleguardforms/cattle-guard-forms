export type BlogImageLibraryItem = {
  id: string;
  title: string;
  category: string;
  src: string;
  alt: string;
  caption: string;
};

export type BlogImageSelection = BlogImageLibraryItem & {
  role: "featured" | "body";
  placement: "hero" | "intro" | "middle" | "bottom" | "cta";
};

export const blogImageLibrary: BlogImageLibraryItem[] = [
  {
    id: "product-hero",
    title: "Installed product hero",
    category: "Product",
    src: "/products/cattle-guard-hero.png",
    alt: "Installed product at a rural entrance",
    caption: "Installed product view for education and planning articles.",
  },
  {
    id: "planning-hero",
    title: "Planning image",
    category: "Planning",
    src: "/products/cattle-guard-hero.png",
    alt: "Rural entrance planning image",
    caption: "Use for opening width, layout, and planning articles.",
  },
  {
    id: "education-hero",
    title: "Education image",
    category: "Education",
    src: "/products/cattle-guard-hero.png",
    alt: "Product education image",
    caption: "Use for product education and cost comparison articles.",
  },
  {
    id: "distributor-hero",
    title: "Distributor education image",
    category: "Distributor",
    src: "/products/cattle-guard-hero.png",
    alt: "Distributor education image",
    caption: "Use for distributor and customer support articles.",
  },
];

export function parseBlogImageSelections(value?: string | null): BlogImageSelection[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as BlogImageSelection[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.src === "string" && typeof item.alt === "string");
  } catch {
    return [];
  }
}

export function serializeBlogImageSelections(images: BlogImageSelection[]) {
  return JSON.stringify(images, null, 2);
}

export function defaultBlogImages(): BlogImageSelection[] {
  return blogImageLibrary.slice(0, 4).map((image, index) => ({
    ...image,
    role: index === 0 ? "featured" : "body",
    placement: index === 0 ? "hero" : index === 1 ? "intro" : index === 2 ? "middle" : "bottom",
  }));
}
