import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cattleguardforms.com";

const mobileNavItems = [
  ["Home", "/"],
  ["Shop", "/quote"],
  ["Install", "/installations"],
  ["FAQ", "/faq"],
  ["Blog", "/blog"],
  ["Contact", "/contact"],
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CowStop Reusable Concrete Cattle Guard Forms | Cattle Guard Forms",
    template: "%s | Cattle Guard Forms",
  },
  description:
    "Cattle Guard Forms sells CowStop reusable concrete cattle guard forms for ranches, farms, rural driveways, contractors, concrete companies, distributors, and landowners.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Cattle Guard Forms",
    title: "CowStop Reusable Concrete Cattle Guard Forms",
    description:
      "Reusable concrete cattle guard forms for ranch entrances, farm roads, contractors, concrete producers, and distributors.",
    url: siteUrl,
    images: ["/products/cattle-guard-hero.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CowStop Reusable Concrete Cattle Guard Forms",
    description:
      "Reusable concrete cattle guard forms for ranch, farm, contractor, and distributor projects.",
    images: ["/products/cattle-guard-hero.png"],
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-neutral-950 focus:ring-2 focus:ring-green-800"
        >
          Skip to main content
        </a>
        <div id="main-content" className="pb-20 md:pb-0">{children}</div>
        <nav
          aria-label="Mobile public navigation"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
        >
          <div className="grid grid-cols-6 gap-1 text-center text-[11px] font-bold text-neutral-700">
            {mobileNavItems.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-lg px-1 py-2 hover:bg-green-50 hover:text-green-900 focus:bg-green-50 focus:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-800">
                {label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="fixed bottom-5 right-5 z-40 hidden flex-col items-end gap-3 sm:flex-row md:flex">
          <Link
            href="/contact"
            className="rounded-full bg-green-800 px-5 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-green-700 hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-950 focus:ring-offset-2"
            aria-label="Contact Cattle Guard Forms support"
          >
            Contact Us
          </Link>
        </div>
      </body>
    </html>
  );
}
