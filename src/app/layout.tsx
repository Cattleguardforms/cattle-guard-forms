import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cattle Guard Forms",
  description: "Foundation app for form onboarding and payments"
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
        <Link
          href="/contact"
          className="fixed bottom-5 right-5 z-40 rounded-full bg-green-800 px-5 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-green-700 hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-950 focus:ring-offset-2"
          aria-label="Contact Cattle Guard Forms support"
        >
          Contact Us
        </Link>
        <footer className="border-t border-neutral-200 bg-white px-6 py-8 text-sm text-neutral-600">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>© Cattle Guard Forms. Support: support@cattleguardforms.com</p>
            <nav className="flex flex-wrap gap-4" aria-label="Footer navigation">
              <Link href="/contact" className="hover:text-green-800">Contact</Link>
              <Link href="/terms" className="hover:text-green-800">Terms & Conditions</Link>
              <Link href="/accessibility" className="hover:text-green-800">Accessibility</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
