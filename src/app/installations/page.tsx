const steps = [
  {
    title: "Step 1: Prep the Form",
    body:
      "Spray the inside of the form with silicone spray or another approved concrete form release agent. Lay the rebar grid according to the reinforcement plan, keeping at least 2 inches of clearance from all edges. Install lift hooks or eyebolts securely before the pour.",
    imageLabel: "Step 1 image: prepared form with rebar and lift points",
  },
  {
    title: "Step 2: Begin Pour — Use 4000 PSI Concrete, Fill Halfway",
    body:
      "Mix and pour 4000 PSI concrete into the form until it is about half full. Spread the mix evenly across the form to prevent shifting, imbalance, or voids around the reinforcement.",
    imageLabel: "Step 2 image: concrete pour in progress",
  },
  {
    title: "Step 3: Settle and Level",
    body:
      "Use a rod, shovel, or concrete vibrator to work the mix around the rebar and into the corners. Make sure there are no air pockets or voids under the reinforcement. Tap the ends and sides of the form with a hammer or rubber mallet to release trapped air, then continue pouring until the form is full. Strike off and smooth the top surface.",
    imageLabel: "Step 3 image: concrete settled and leveled in the form",
  },
  {
    title: "Step 4: Install J-Bolts and Cure",
    body:
      "While the concrete is still plastic, insert the J-bolts at the designated anchor points. Check alignment and depth before the concrete sets. Allow the concrete to cure undisturbed for 48–72 hours, keeping it covered or damp as needed.",
    imageLabel: "Step 4 image: J-bolt placement and curing guide",
  },
  {
    title: "Step 5: Attach Chain to J-Hooks",
    body:
      "Once the concrete is fully cured, attach lifting chains or slings securely to the J-hooks. Confirm that the load is balanced evenly before lifting.",
    imageLabel: "Step 5 image: chain attached to lifting hardware",
  },
  {
    title: "Step 6: Lift Cattle Guard From the Form",
    body:
      "Using a loader, forklift, or crane, carefully lift the cured cattle guard out of the form. Avoid sudden jerks, twisting, or uneven lifting that could crack the concrete or damage the embedded hardware.",
    imageLabel: "Step 6 image: lifting the cured section from the reusable form",
  },
  {
    title: "Step 7: Transport and Position",
    body:
      "Move the cattle guard to its designated location. Set it square and level on the prepared gravel pad, keeping the top elevated above grade as intended.",
    imageLabel: "Step 7 image: transporting and positioning the cattle guard",
  },
  {
    title: "Step 8: Final Alignment and Backfill",
    body:
      "Confirm final alignment, elevation, and stability. Backfill around the edges with compacted gravel or soil to lock the cattle guard in place and maintain proper drainage.",
    imageLabel: "Step 8 image: final alignment and backfill",
  },
];

const materials = [
  "Use a tube of grease or any concrete release agent. Apply it to the inside of the form before pouring.",
  "Buy two 20-foot bars of 1/2-inch rebar and cut three pieces to 70 1/4 inches and three pieces to 68 1/2 inches.",
  "Buy two tomato stakes, each 17 inches long, to use as cross members for the horizontal slots. These help hold the rebar in position while concrete is poured around it.",
  "Use two 10-inch J-bolts. These will be set in the concrete and used later to attach chains so a tractor, loader, or similar equipment can lift the cured section while removing the form.",
  "Use two 8-inch J-bolts. These are used to lift the finished section from the top and set it into the opening. If you have a forklift, these 8-inch J-bolts may not be needed.",
  "Use 12 bags of 80 lb, 4000 PSI concrete mix for each pour.",
  "Use tie wire or plastic zip ties to fasten the rebar to the J-bolts and tomato stakes.",
];

export default function InstallationsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-12">
          <a href="/" className="inline-flex items-center text-sm font-semibold uppercase tracking-wide text-green-800">
            Cattle Guard Forms
          </a>
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-green-800">
            CowStop Installation Instructions
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            Follow these instructions to prepare the CowStop form, pour the concrete section, remove it from the form, and position it at the installation site.
          </p>
        </header>

        <section className="grid items-start gap-12 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <h2 className="text-3xl font-bold text-green-800">Material list: “COW STOP”</h2>
            <p className="mt-8 text-lg italic text-slate-800">For each pour</p>
            <ol className="mt-4 list-decimal space-y-3 pl-8 text-lg leading-8 text-slate-900">
              {materials.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex min-h-96 items-center justify-center rounded-xl border border-dashed border-green-300 bg-white p-8 text-center text-green-800">
              CowStop material layout image
            </div>
          </div>
        </section>

        <section className="mt-20 space-y-20">
          {steps.map((step, index) => {
            const image = (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-green-300 bg-white p-6 text-center text-sm font-medium text-green-800">
                  {step.imageLabel}
                </div>
              </div>
            );

            const copy = (
              <div>
                <h2 className="text-3xl font-bold leading-tight text-green-800">{step.title}</h2>
                <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-800">{step.body}</p>
              </div>
            );

            return (
              <section key={step.title} className="grid items-center gap-12 lg:grid-cols-2">
                {index % 2 === 0 ? (
                  <>
                    {image}
                    {copy}
                  </>
                ) : (
                  <>
                    {copy}
                    {image}
                  </>
                )}
              </section>
            );
          })}
        </section>

        <section className="mt-20 rounded-2xl bg-slate-50 p-8">
          <h2 className="text-3xl font-bold text-green-800">Prepare Site</h2>
          <p className="mt-6 text-lg leading-8 text-slate-800">
            Before setting the form, select and prepare the installation area:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-8 text-lg leading-8 text-slate-800">
            <li>Choose a level, well-drained location aligned with the roadway or gate.</li>
            <li>Excavate approximately 8 inches deep so the cattle guard can sit elevated above grade for better drainage and visibility.</li>
            <li>Add a 4–6 inch layer of compacted gravel to stabilize the base and promote water runoff.</li>
            <li>Verify level and alignment before positioning the form.</li>
          </ul>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-bold text-green-800">Installation Video</h2>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            Watch the installation walkthrough below. If the embedded video does not load in your browser, use the button underneath to open it directly on YouTube.
          </p>
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <iframe
              className="h-full w-full"
              src="https://www.youtube-nocookie.com/embed/ineaalZN26o"
              title="CowStop installation video"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <a
            href="https://www.youtube.com/watch?v=ineaalZN26o"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900"
          >
            Watch installation video on YouTube
          </a>
        </section>
      </section>
    </main>
  );
}
