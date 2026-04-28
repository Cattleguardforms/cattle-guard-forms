import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cattleguardforms.com";

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
        <div id="main-content">{children}</div>
        <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:flex-row">
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
