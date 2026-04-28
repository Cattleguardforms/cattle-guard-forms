import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cattle Guard Forms",
  description: "Reusable concrete cattle guard forms for ranches, farms, and rural entrances"
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
