export type EducationTopic = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  bullets: string[];
};

export const educationTopics: EducationTopic[] = [
  {
    slug: "customer-education",
    title: "Customer Guide to Concrete Cattle Guard Forms",
    eyebrow: "Customer education",
    summary: "A plain-English overview for customers comparing cattle guard options, planning a pour, and deciding whether reusable concrete forms fit their ranch, farm, driveway, or rural access project.",
    sections: [
      {
        heading: "What a reusable concrete cattle guard form does",
        body: "A reusable form gives you a repeatable mold for pouring concrete cattle guard sections on site. Instead of ordering a finished steel cattle guard for every entrance, you use local concrete and reinforcing, pour the sections, then reuse the form on future projects.",
      },
      {
        heading: "When it makes sense",
        body: "Reusable forms are most attractive when you need more than one installation, expect future pours, work as a contractor or distributor, or want to reduce the cost and lead time tied to heavy steel fabrication and long-distance freight.",
      },
      {
        heading: "What customers should confirm first",
        body: "Before ordering, confirm your opening width, expected vehicle traffic, drainage conditions, unloading plan, delivery location, and whether a liftgate or equipment will be needed at delivery.",
      },
    ],
    bullets: ["Measure the finished opening width before ordering.", "Plan the base and drainage before pouring.", "Use proper concrete strength and curing time.", "Ask support to review quantity if the layout is unclear."],
  },
  {
    slug: "steel-vs-concrete-cattle-guards",
    title: "Steel vs. Concrete Cattle Guards",
    eyebrow: "Buying guide",
    summary: "Compare fabricated steel cattle guards with concrete cattle guards poured from reusable forms so customers can understand cost, freight, lead time, durability, and repeat-use tradeoffs.",
    sections: [
      {
        heading: "Steel cattle guards",
        body: "Steel cattle guards are commonly purchased as finished fabricated units. They can be strong and familiar, but they may involve steel price swings, fabrication lead time, coating or finish questions, expensive freight, and equipment needs for unloading and placement.",
      },
      {
        heading: "Concrete cattle guards",
        body: "Concrete cattle guards poured with reusable forms shift more of the project to local materials and jobsite planning. The form creates a repeatable shape, while local concrete, reinforcement, and curing practices create the finished sections.",
      },
      {
        heading: "The practical difference",
        body: "For a single one-off crossing, customers may compare the finished cost of steel against the form package and local pour costs. For repeat projects, distributors, contractors, or multi-entrance ranches, reusable concrete forms can become more valuable because the form can be used again.",
      },
    ],
    bullets: ["Steel can be simple for one-off purchases but expensive to ship.", "Concrete forms reduce repeated finished-guard freight.", "Reusable forms support repeat pours.", "Both options still require proper site preparation and drainage."],
  },
  {
    slug: "installation-planning",
    title: "Concrete Cattle Guard Installation Planning",
    eyebrow: "Installation planning",
    summary: "Plan the opening, base, drainage, layout, concrete, curing, and equipment before starting a cattle guard pour.",
    sections: [
      {
        heading: "Start with the opening",
        body: "Measure the driveway, lane, or access point where the cattle guard will sit. Common openings include 12, 16, 18, and 24 feet, but the right layout depends on vehicle traffic and how the site is used.",
      },
      {
        heading: "Prepare the base",
        body: "A stable base and drainage plan help protect the finished cattle guard. Avoid placing sections where water will undermine the support or collect around the installation.",
      },
      {
        heading: "Respect curing time",
        body: "Concrete needs time to gain strength. Customers should avoid heavy vehicle traffic until the pour has cured properly for the expected load and conditions.",
      },
    ],
    bullets: ["Confirm opening width.", "Plan section layout before pouring.", "Prepare base and drainage.", "Use the recommended concrete mix and cure time."],
  },
  {
    slug: "ranch-driveway-access",
    title: "Ranch Driveway and Farm Entrance Access",
    eyebrow: "Ranch access",
    summary: "Understand how cattle guard planning changes for ranch driveways, farm roads, equipment lanes, and livestock-control access points.",
    sections: [
      {
        heading: "Think about traffic",
        body: "A cattle guard at a light-use driveway is different from one used by feed trucks, hay trailers, tractors, or contractor equipment. Vehicle type and frequency should guide layout and preparation.",
      },
      {
        heading: "Control livestock movement",
        body: "The goal is to allow vehicles through while discouraging livestock from crossing. Placement, fencing tie-ins, and approach layout all matter.",
      },
      {
        heading: "Plan delivery and unloading",
        body: "Customers should confirm whether their delivery location is residential, farm, commercial, limited access, or a jobsite and whether liftgate service or unloading equipment is available.",
      },
    ],
    bullets: ["Match layout to traffic needs.", "Tie the cattle guard into fencing correctly.", "Account for trucks and trailers.", "Confirm delivery access before checkout."],
  },
  {
    slug: "distributor-education",
    title: "Distributor Education for Cattle Guard Forms",
    eyebrow: "Distributor education",
    summary: "Help distributors explain reusable concrete cattle guard forms, quote common quantities, and answer customer planning questions.",
    sections: [
      {
        heading: "Lead with repeat use",
        body: "The key distributor message is that the form can support repeat pours. That makes it useful for contractors, concrete producers, ranch suppliers, and customers with multiple entrances.",
      },
      {
        heading: "Ask the right customer questions",
        body: "Distributors should ask about opening width, expected vehicle traffic, site conditions, delivery address type, liftgate needs, and whether the customer plans one pour or repeat projects.",
      },
      {
        heading: "Use the paperwork links",
        body: "Warranty paperwork, installation guides, engineering documents, and BOL paperwork should be kept with the order so customers have the right documentation after purchase.",
      },
    ],
    bullets: ["Ask opening width first.", "Confirm freight access and liftgate needs.", "Explain concrete versus steel tradeoffs.", "Point customers to warranty and installation paperwork."],
  },
  {
    slug: "livestock-control-drainage",
    title: "Livestock Control and Drainage Planning",
    eyebrow: "Site planning",
    summary: "Plan cattle guard placement so it supports livestock control without creating drainage or maintenance problems.",
    sections: [
      {
        heading: "Placement matters",
        body: "A cattle guard works best when fencing, gates, and approaches guide livestock behavior. Poor placement can leave gaps, bypasses, or awkward traffic flow.",
      },
      {
        heading: "Drainage matters too",
        body: "The installation should not trap water or allow runoff to undermine the base. Consider the slope, soil, gravel layer, and where heavy rain will move across the entrance.",
      },
      {
        heading: "Maintenance starts before the pour",
        body: "Good base prep and drainage can reduce settling, erosion, and long-term maintenance. Customers should address those questions before forms are placed and concrete is poured.",
      },
    ],
    bullets: ["Tie into fences and gates.", "Avoid water traps.", "Use stable base preparation.", "Think about future maintenance access."],
  },
];

export function getEducationTopic(slug: string) {
  return educationTopics.find((topic) => topic.slug === slug) ?? null;
}
