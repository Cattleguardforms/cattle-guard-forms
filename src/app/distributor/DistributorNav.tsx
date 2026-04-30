import Link from "next/link";

export default function DistributorNav({ active }: { active: "home" | "shop" | "documents" | "support" }) {
  const links = [
    { key: "home", label: "Home", href: "/distributor/home" },
    { key: "shop", label: "Shop", href: "/distributor/shop" },
    { key: "documents", label: "Documents", href: "/distributor/documents" },
    { key: "support", label: "Support", href: "/distributor/support" },
  ] as const;

  return (
    <nav className="mt-6 flex flex-wrap gap-3 rounded-xl bg-green-50 p-3 ring-1 ring-green-100">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={
            active === link.key
              ? "rounded bg-green-800 px-4 py-2 text-sm font-bold text-white"
              : "rounded bg-white px-4 py-2 text-sm font-bold text-green-900 ring-1 ring-green-200 hover:bg-green-50"
          }
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
