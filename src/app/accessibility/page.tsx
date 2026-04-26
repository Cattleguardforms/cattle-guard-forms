import Link from "next/link";

const accessibilityCommitments = [
  "Keyboard-accessible navigation and form controls where practical.",
  "Clear page headings, labels, and form instructions.",
  "Alternative text for meaningful images and graphics.",
  "Readable color contrast, font sizes, and spacing.",
  "Support for screen readers and assistive technologies where practical.",
  "Plain-language content and clear calls to action.",
  "Accessible contact options for customers who need help using the site.",
];

const assistanceOptions = [
  {
    title: "Blind or low-vision users",
    body:
      "If you have trouble reading content, using forms, understanding product images, or accessing order information with a screen reader, contact us and we will provide reasonable assistance or an alternative way to receive the information.",
  },
  {
    title: "Deaf or hard-of-hearing users",
    body:
      "If video or audio content is not accessible to you, contact us and we will make reasonable efforts to provide written instructions, installation summaries, or other text-based support.",
  },
  {
    title: "Mobility or wheelchair users",
    body:
      "If you have difficulty using a mouse, navigating forms, or completing an order due to mobility limitations, contact us and we will provide reasonable assistance through email or another practical method.",
  },
  {
    title: "Cognitive, language, or learning accessibility",
    body:
      "If any instructions, forms, pricing, or installation information are unclear, contact us and we will try to explain the information in a simpler or more direct way.",
  },
];

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/" className="hover:text-green-800">Home</Link>
            <Link href="/quote" className="hover:text-green-800">Shop</Link>
            <Link href="/installations" className="hover:text-green-800">Installations</Link>
            <Link href="/contact" className="hover:text-green-800">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Accessibility</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Accessibility Statement</h1>
        <p className="mt-4 text-sm text-neutral-500">Last updated: April 26, 2026</p>

        <p className="mt-8 text-lg leading-8 text-neutral-700">
          Cattle Guard Forms is committed to making our website, product information, contact forms, ordering tools, distributor resources, and installation content reasonably accessible to all users, including people who are blind or low vision, deaf or hard of hearing, wheelchair users, people with mobility limitations, and people using assistive technology.
        </p>

        <section className="mt-10 rounded-2xl bg-neutral-50 p-6 ring-1 ring-neutral-200">
          <h2 className="text-2xl font-semibold">Our Accessibility Goals</h2>
          <ul className="mt-5 space-y-3">
            {accessibilityCommitments.map((item) => (
              <li key={item} className="flex gap-3 leading-7 text-neutral-700">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-green-800" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          {assistanceOptions.map((option) => (
            <article key={option.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-xl font-semibold">{option.title}</h2>
              <p className="mt-3 leading-7 text-neutral-700">{option.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl bg-green-50 p-6 ring-1 ring-green-200">
          <h2 className="text-2xl font-semibold text-green-950">Need Accessibility Help?</h2>
          <p className="mt-3 leading-7 text-green-950">
            If you cannot access any part of this website or need help completing a form, understanding product information, reviewing installation instructions, or placing an order, please contact us. We will make reasonable efforts to provide the information or service in an accessible alternative format.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="inline-flex justify-center rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">
              Contact Us
            </Link>
            <a href="mailto:support@cattleguardforms.com" className="inline-flex justify-center rounded border border-green-800 px-5 py-3 font-semibold text-green-900 hover:bg-white">
              support@cattleguardforms.com
            </a>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Ongoing Improvements</h2>
          <p className="mt-3 leading-8 text-neutral-700">
            We are continuing to improve the accessibility of this site as the product, distributor portal, marketing portal, CRM, checkout, and fulfillment tools are developed. If you find an issue, please let us know what page you were using, what assistive technology or browser you were using if applicable, and what problem occurred.
          </p>
        </section>
      </section>
    </main>
  );
}
