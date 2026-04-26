import Link from "next/link";

const openingRows = [
  { opening: "12 ft opening", cowstop: "6 CowStop pours", layout: "2 wide x 3 deep", notes: "Standard recommended layout for a 12 ft opening." },
  { opening: "16 ft opening", cowstop: "Custom 4 ft section or 2 Texan forms", layout: "CowStop custom divider or 2 Texans", notes: "Use a divider inside the CowStop form for a 4 ft section, or use two 8 ft Texan forms." },
  { opening: "18 ft opening", cowstop: "9 CowStop pours", layout: "3 wide x 3 deep", notes: "Paint yellow drive lines for heavy trucks and equipment." },
  { opening: "24 ft opening", cowstop: "3 Texan forms", layout: "3 Texans across", notes: "Requires about 4 cubic yards of concrete total." },
];

const productRows = [
  { product: "CowStop", size: "6 ft long x 21.5 in wide x 16 in high", formWeight: "80 lb", concrete: "12 80 lb bags, about 1/2 cubic yard", notes: "Reusable polyethylene mold with 9 in deep grooves." },
  { product: "Texan", size: "8 ft long x 6 ft wide x 12 in high", formWeight: "150 lb", concrete: "1 1/3 cubic yards per form", notes: "Two Texans fit a 16 ft opening; three Texans fit a 24 ft opening." },
];

const quickFacts = [
  ["Estimated concrete CowStop section weight", "Approximately 960 lb"],
  ["Recommended concrete strength", "4000 PSI for HS-20 rating"],
  ["Higher-strength option", "5000 PSI concrete with 5/8 in rebar may approach HS-25, subject to engineer certification"],
  ["Drive-on wait time for heavy equipment", "28 days"],
  ["Typical cure time before removing from form", "Usually around 3 days, depending on temperature and humidity"],
  ["CowStop install depth", "About 3 inches so grooves remain above grade for drainage"],
  ["Release agent", "Vegetable oil, Pam, car wax, or another non-petroleum release agent"],
  ["Material", "Polyethylene plastic"],
  ["Estimated concrete and rebar cost per cattle guard", "About $57 concrete and $8 rebar, based on the supplied FAQ copy"],
];

const faqs = [
  {
    question: "For 18 ft openings and 12 ft openings, how many pours of the CowStop form do you suggest?",
    answer: "For an 18 ft opening, we suggest 9 pours: 3 wide and 3 deep. For a 12 ft opening, we suggest 6 pours: 2 wide and 3 deep.",
  },
  {
    question: "Can you make a smaller 4 ft section within the 6 ft CowStop mold?",
    answer: "Yes. Cut the rebar into 4 ft segments and install and space the rebar according to the instructions. Then cut a plywood or foam divider, place it at the end of the rebar, leave 2 ft without rebar, and fill the remaining part of the form with sand or dirt to stop concrete from seeping around the divider. Proceed as normal.",
  },
  {
    question: "Can gate wings be used to fill extra opening space?",
    answer: "Yes. You can buy or make wooden gate wings to fill extra space, such as using 6 CowStop forms for a 12 ft opening and wings to fill a 16 ft opening. The Texan forms are also 8 ft across, so 2 Texans are a good fit for a 16 ft opening.",
  },
  {
    question: "What is the estimated weight of one concrete CowStop section?",
    answer: "Approximately 960 lb.",
  },
  {
    question: "What is the best way to lift and install the concrete cattle guard?",
    answer: "Place two 8 in J-bolts in addition to the two 10 in J-bolts. The 10 in J-bolts are used when removing the form from the mold. The 8 in J-bolts are used to transport the section top-side up to the installation location. Drill a small hole in the plastic at the small impression and place the 8 in J-bolts before pouring. The 8 in J-bolts sit in the gaps away from car traffic.",
  },
  {
    question: "Will cows try to cross concrete cattle guards?",
    answer: "All cows may eventually try to cross any cattle guard if it fills with dirt. The key is to elevate the cattle guard like a speed bump and leave the sides of the gaps open so debris can wash through. Fencing wings at the sides also help prevent cows from crossing.",
  },
  {
    question: "Will dogs or deer respect these barriers?",
    answer: "Deer usually stay away from cattle guards, but they are strong jumpers, so extending the cattle guard at least 12 ft deep is recommended. Dogs may be slowed down, but if they are chasing something, they may find a way across.",
  },
  {
    question: "What about sheep and goats?",
    answer: "Goats are strong jumpers, so this product is not suggested for goats. It may work on sheep.",
  },
  {
    question: "Will cows get hurt if they try to cross?",
    answer: "The product is pit-less, so if a cow attempts to cross, it should not break its leg in a pit like with some traditional cattle guard designs.",
  },
  {
    question: "What is the stability of the concrete cattle guards? Can they handle a dozer?",
    answer: "With 4000 PSI concrete, the cattle guards have an HS-20 rating. The middle is the strongest area, so heavy machinery tires should be run through the middle. For sharp steel tracks, cushion the top with plywood or boards to reduce grinding or chipping.",
  },
  {
    question: "What is the support weight at the edge of the forms?",
    answer: "The HS-20, 16 ton per axle rating applies at the edge when the product is properly installed with soil around the full perimeter where wheels may contact. A slight rise to the road leading to the cattle guard can maintain the mounded soil system. Elevated installation is preferred for drainage and livestock deterrence.",
  },
  {
    question: "What is the maximum grade the concrete cattle guards can be set at?",
    answer: "A 10% grade should not affect the product much. Pour from the bottom and raise the concrete a few inches at a time so the concrete rises evenly across the whole product. Tap the form with a hammer to reduce air bubbles and avoid mixing the concrete too soupy.",
  },
  {
    question: "How many yards of concrete are needed per CowStop form?",
    answer: "The CowStop uses 12 80 lb bags of 4000 PSI concrete, which is about 1/2 cubic yard.",
  },
  {
    question: "How many yards of concrete are needed per Texan form?",
    answer: "Each Texan is 8 ft by 6 ft and uses 1 1/3 cubic yards of concrete. A 16 ft opening uses 2 Texans and needs about 2 2/3 cubic yards. A 24 ft opening uses 3 Texans and needs about 4 cubic yards.",
  },
  {
    question: "What are the CowStop and Texan specs?",
    answer: "The CowStop reusable mold is 6 ft long, 21.5 in wide, 16 in high, has 9 in deep grooves, and weighs about 80 lb. The Texan is 8 ft long, 6 ft wide, 12 in high, and weighs about 150 lb.",
  },
  {
    question: "How long does concrete need to cure?",
    answer: "Temperature and humidity affect curing time, but usually 3 days is good before removing from the form. Keep the CowStop form in the shade as much as possible, including during curing, to protect the form from sun damage or deformation.",
  },
  {
    question: "What are the concrete and rebar costs?",
    answer: "The supplied FAQ estimate says the concrete for each cattle guard costs about $57 and rebar costs about $8.",
  },
  {
    question: "What is the purpose of tomato stakes?",
    answer: "Tomato stakes hold the top rebar pieces in place while pouring. Any stick that fits the grooves can work, including wood, plastic, or metal stakes. Tomato stakes are suggested because they are inexpensive and easy to find at garden centers, Lowe's, or Home Depot.",
  },
  {
    question: "How do the cattle guards do with snow and freezing?",
    answer: "Both products drain well if properly elevated and kept open at the sides. As long as water drains out, freezing should not be a problem. Snow can collect in the grooves and allow cows to cross, so snow should be plowed.",
  },
  {
    question: "What is the best release agent for the CowStop form?",
    answer: "Any non-petroleum product is recommended. Vegetable oil, Pam, and car wax can be used.",
  },
  {
    question: "If 5000 PSI concrete is used, what rebar is needed to approach HS-25?",
    answer: "Using 5000 PSI concrete and 5/8 in rebar should make the CowStop equal to or close to an HS-25 rating, but it would need to be certified by an engineer.",
  },
  {
    question: "What are the forms made of?",
    answer: "Plastic, specifically polyethylene.",
  },
  {
    question: "Can 5/8 in rebar be used in the cattle guard forms?",
    answer: "Yes.",
  },
  {
    question: "Can a concrete truck pour the CowStop in one go?",
    answer: "Yes. Pour slowly and make sure to remove air bubbles.",
  },
  {
    question: "Do you recommend a compacted base underneath the cattle guard?",
    answer: "Yes. Compact or tamp the ground where the cattle guard will sit. A gravel layer can be used, or the base can remain soil, as long as it is compacted or tamped down.",
  },
  {
    question: "What is the install depth of the CowStop?",
    answer: "The installation depth should be about 3 inches so the grooves remain above ground and water and sediment can drain out.",
  },
  {
    question: "How long before heavy semi trailers or farm equipment can drive over new pours?",
    answer: "Wait 28 days before driving heavy semi trailers or farm equipment over the new pours.",
  },
  {
    question: "How much can individual cattle guards sell for if a customer wants to sell them?",
    answer: "The supplied FAQ copy lists $200 to $300 each.",
  },
  {
    question: "What is the return policy?",
    answer: "A full refund of the product price, not shipping, is available if returned within 30 days of purchase. The customer pays return shipping.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex items-center">
            <img src="/brand/cgf-logo.png" alt="Cattle Guard Forms" className="h-16 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
            <Link href="/" className="hover:text-green-800">Home</Link>
            <Link href="/quote" className="hover:text-green-800">Shop</Link>
            <Link href="/installations" className="hover:text-green-800">Installations</Link>
            <Link href="/faq" className="text-green-800">FAQ</Link>
          </nav>
        </div>
      </header>

      <section className="bg-neutral-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Frequently Asked Questions</p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-neutral-950">CowStop & Texan Concrete Cattle Guard FAQ</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-700">
              Answers to common questions about CowStop pours, cattle guard sizing, concrete requirements, lifting, installation, drainage, livestock behavior, and return policy.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/quote" className="inline-flex justify-center rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">Request Pricing</Link>
              <Link href="/installations" className="inline-flex justify-center rounded border border-neutral-300 px-5 py-3 font-semibold hover:bg-white">Installation Instructions</Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
            <img src="/products/cattle-guard-hero.png" alt="Concrete cattle guard installed at a ranch entrance" className="h-full min-h-[320px] w-full rounded-xl object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          {quickFacts.slice(0, 6).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-green-800">{label}</p>
              <p className="mt-2 text-lg font-semibold text-neutral-950">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Sizing table</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Opening Size & Pour Planning</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
            <table className="min-w-full divide-y divide-neutral-200 bg-white text-left text-sm">
              <thead className="bg-green-900 text-white">
                <tr>
                  <th className="px-5 py-4 font-semibold">Opening</th>
                  <th className="px-5 py-4 font-semibold">Recommended forms / pours</th>
                  <th className="px-5 py-4 font-semibold">Layout</th>
                  <th className="px-5 py-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {openingRows.map((row) => (
                  <tr key={row.opening} className="align-top">
                    <td className="px-5 py-4 font-semibold text-neutral-950">{row.opening}</td>
                    <td className="px-5 py-4 text-neutral-700">{row.cowstop}</td>
                    <td className="px-5 py-4 text-neutral-700">{row.layout}</td>
                    <td className="px-5 py-4 text-neutral-700">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Product table</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">CowStop vs Texan Quick Specs</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
            <table className="min-w-full divide-y divide-neutral-200 bg-white text-left text-sm">
              <thead className="bg-neutral-950 text-white">
                <tr>
                  <th className="px-5 py-4 font-semibold">Product</th>
                  <th className="px-5 py-4 font-semibold">Size</th>
                  <th className="px-5 py-4 font-semibold">Form weight</th>
                  <th className="px-5 py-4 font-semibold">Concrete needed</th>
                  <th className="px-5 py-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {productRows.map((row) => (
                  <tr key={row.product} className="align-top">
                    <td className="px-5 py-4 font-semibold text-neutral-950">{row.product}</td>
                    <td className="px-5 py-4 text-neutral-700">{row.size}</td>
                    <td className="px-5 py-4 text-neutral-700">{row.formWeight}</td>
                    <td className="px-5 py-4 text-neutral-700">{row.concrete}</td>
                    <td className="px-5 py-4 text-neutral-700">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Videos & pictures</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Watch the CowStop Videos</h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                className="h-full w-full"
                src="https://www.youtube-nocookie.com/embed/eX8Fn9XYUQw"
                title="CowStop reusable cattle guard form overview video"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <h3 className="mt-5 text-xl font-semibold">CowStop Overview Video</h3>
            <a href="https://www.youtube.com/watch?v=eX8Fn9XYUQw" target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Open on YouTube</a>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                className="h-full w-full"
                src="https://www.youtube-nocookie.com/embed/ineaalZN26o"
                title="CowStop installation video"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <h3 className="mt-5 text-xl font-semibold">CowStop Installation Video</h3>
            <a href="https://www.youtube.com/watch?v=ineaalZN26o" target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900">Open on YouTube</a>
          </article>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <img src="/installations/material.png" alt="CowStop installation materials" className="h-64 w-full rounded-2xl border border-neutral-200 object-contain p-3 shadow-sm" />
          <img src="/installations/step%20-%202.jpg" alt="Concrete being poured into the CowStop form" className="h-64 w-full rounded-2xl border border-neutral-200 object-contain p-3 shadow-sm" />
          <img src="/installations/step%20-%207.png" alt="Finished CowStop concrete section ready for positioning" className="h-64 w-full rounded-2xl border border-neutral-200 object-contain p-3 shadow-sm" />
        </div>
      </section>

      <section className="bg-neutral-50 py-14">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Common Questions</h2>
          <div className="mt-8 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {faqs.map((faq) => (
              <details key={faq.question} className="group p-5 open:bg-green-50/40">
                <summary className="cursor-pointer list-none text-lg font-semibold text-neutral-950 marker:hidden">
                  <span>{faq.question}</span>
                  <span className="float-right ml-4 text-green-800 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 leading-8 text-neutral-700">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl bg-green-900 px-6 py-10 text-white md:px-10">
          <h2 className="text-3xl font-bold tracking-tight">Still have questions?</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-green-50">
            Contact us for help choosing the right layout, number of pours, installation approach, or distributor order.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote" className="inline-flex justify-center rounded bg-white px-6 py-3 font-semibold text-green-900 hover:bg-green-50">Request a Quote</Link>
            <Link href="/contact" className="inline-flex justify-center rounded border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10">Contact Us</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
