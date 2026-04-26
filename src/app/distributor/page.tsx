"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

const DISTRIBUTOR_UNIT_PRICE = 750;

type ShippingMethod = "echo" | "own";

type AuthMode = "signed-out" | "signed-in";

type DistributorAccount = {
  id: string;
  name: string;
  email: string;
  logoUrl?: string;
};

const distributorAccounts: DistributorAccount[] = [
  {
    id: "farm-and-ranch-experts",
    name: "Farm and Ranch Experts",
    email: "orders@farmandranchexperts.com",
  },
  {
    id: "barn-world",
    name: "Barn World",
    email: "orders@barnworld.com",
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseAuth = Boolean(supabaseUrl && supabaseAnonKey);

const workflow = [
  "Distributor places the CowStop order at the approved $750 distributor rate",
  "Distributor chooses Cattle Guard Forms/Echo shipping rates or selects Ship on My Own",
  "If shipping independently, distributor uploads the BOL before fulfillment",
  "After payment and shipping/BOL are complete, the order is sent to the manufacturer and support@cattleguardforms.com",
  "Manufacturer replies with the expected ship date, and the distributor receives email updates",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function PublicNav() {
  return (
    <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
      <Link href="/" className="hover:text-green-800">
        Home
      </Link>
      <Link href="/quote" className="hover:text-green-800">
        Shop
      </Link>
      <Link href="/installations" className="hover:text-green-800">
        Installations
      </Link>
      <Link href="/distributor" className="text-green-800">
        Distributor Portal
      </Link>
    </nav>
  );
}

function DistributorNav() {
  return (
    <nav className="flex items-center gap-6 text-sm font-medium text-neutral-700">
      <Link href="/" className="hover:text-green-800">
        Home
      </Link>
      <a href="#distributor-order" className="hover:text-green-800">
        Distributor Order
      </a>
      <Link href="/installations" className="hover:text-green-800">
        Installations
      </Link>
      <Link href="/distributor" className="text-green-800">
        Distributor Portal
      </Link>
    </nav>
  );
}

function Header({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="inline-flex items-center">
          <img
            src="/brand/cgf-logo.png"
            alt="Cattle Guard Forms"
            className="h-16 w-auto object-contain"
          />
        </Link>
        {signedIn ? <DistributorNav /> : <PublicNav />}
      </div>
    </header>
  );
}

function findDistributorByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();
  return distributorAccounts.find((account) => {
    const domain = account.email.split("@")[1]?.toLowerCase();
    return normalizedEmail === account.email.toLowerCase() || Boolean(domain && normalizedEmail.endsWith(`@${domain}`));
  });
}

export default function DistributorPortalPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("signed-out");
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDistributorId, setSelectedDistributorId] = useState(distributorAccounts[0].id);
  const [distributorAccountName, setDistributorAccountName] = useState("Distributor");
  const [distributorLogoFileName, setDistributorLogoFileName] = useState("");
  const [distributorLogoPreview, setDistributorLogoPreview] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("echo");
  const [shipToName, setShipToName] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [shipToAddress2, setShipToAddress2] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [shipToState, setShipToState] = useState("");
  const [shipToZip, setShipToZip] = useState("");
  const [selectedRate, setSelectedRate] = useState("");
  const [bolFileName, setBolFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const productTotal = useMemo(() => quantity * DISTRIBUTOR_UNIT_PRICE, [quantity]);

  const checkoutReady =
    shippingMethod === "echo"
      ? shipToName.trim() &&
        shipToAddress.trim() &&
        shipToCity.trim() &&
        shipToState.trim() &&
        shipToZip.trim() &&
        selectedRate
      : bolFileName;

  const handleDistributorLogoUpload = (file: File | undefined) => {
    if (!file) {
      setDistributorLogoFileName("");
      setDistributorLogoPreview(null);
      return;
    }

    setDistributorLogoFileName(file.name);
    setDistributorLogoPreview(URL.createObjectURL(file));
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      if (hasSupabaseAuth && supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

        if (signInError) {
          setLoginError(signInError.message);
          return;
        }

        // TODO: Load distributor profile/company/logo data from Supabase and enforce approved distributor role server-side.
        const matchedDistributor = findDistributorByEmail(data.user?.email ?? loginEmail);
        const accountName =
          data.user?.user_metadata?.company_name ??
          data.user?.user_metadata?.company ??
          data.user?.user_metadata?.name ??
          matchedDistributor?.name ??
          "Distributor";
        const logoUrl = data.user?.user_metadata?.logo_url ?? matchedDistributor?.logoUrl ?? null;

        setDistributorAccountName(String(accountName));
        setDistributorLogoPreview(logoUrl ? String(logoUrl) : null);
        setDistributorLogoFileName(logoUrl ? "Saved distributor logo" : "");
        setEmail(data.user?.email ?? matchedDistributor?.email ?? loginEmail);
        setAuthMode("signed-in");
        return;
      }

      // TODO: Remove placeholder login before production and require Supabase distributor-role enforcement.
      const selectedDistributor =
        distributorAccounts.find((account) => account.id === selectedDistributorId) ?? distributorAccounts[0];
      const matchedDistributor = findDistributorByEmail(loginEmail) ?? selectedDistributor;

      setDistributorAccountName(matchedDistributor.name);
      setDistributorLogoPreview(matchedDistributor.logoUrl ?? null);
      setDistributorLogoFileName(matchedDistributor.logoUrl ? "Saved distributor logo" : "");
      setEmail(loginEmail || matchedDistributor.email);
      setAuthMode("signed-in");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!checkoutReady) {
      setError(
        shippingMethod === "echo"
          ? "Enter the ship-to name, address, and select an Echo shipping option before payment."
          : "Upload the BOL before payment when shipping on your own.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/distributor-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
          email,
          distributorAccountName,
          distributorLogoFileName,
          shippingMethod,
          shipToName,
          shipToAddress,
          shipToAddress2,
          shipToCity,
          shipToState,
          shipToZip,
          selectedRate,
          bolFileName,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? "Unable to start distributor checkout right now.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Unable to start distributor checkout right now.");
    } finally {
      setLoading(false);
    }
  };

  if (authMode === "signed-out") {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <Header signedIn={false} />
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-800">
              Distributor access
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-950">
              Distributor Portal
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-700">
              Distributors may log in here.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-700">
              Interested in becoming a distributor? Please email support@cattleguardforms.com.
            </p>
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-xl font-semibold">Approved Distributor Accounts</h2>
              <div className="mt-4 grid gap-3">
                {distributorAccounts.map((account) => (
                  <div key={account.id} className="rounded-lg border border-neutral-200 p-4">
                    <p className="font-semibold text-neutral-950">{account.name}</p>
                    <p className="mt-1 text-sm text-neutral-600">{account.email}</p>
                  </div>
                ))}
              </div>
            </div>
            {!hasSupabaseAuth ? (
              <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
                Supabase authentication is not configured in this environment. This placeholder gate is for setup/testing only and is not production security.
              </div>
            ) : null}
          </div>

          <form className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200" onSubmit={handleLogin}>
            <h2 className="text-2xl font-semibold">Distributor Sign In</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Access is for approved Cattle Guard Forms distributors only.
            </p>

            {loginError ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {loginError}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4">
              {!hasSupabaseAuth ? (
                <label className="grid gap-2 text-sm font-medium text-neutral-700">
                  Placeholder distributor account
                  <select
                    value={selectedDistributorId}
                    onChange={(event) => setSelectedDistributorId(event.target.value)}
                    className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                  >
                    {distributorAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                Email
                <input
                  required
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="distributor@example.com"
                  className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                Password
                <input
                  required={hasSupabaseAuth}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                />
              </label>
              <button
                type="submit"
                disabled={loginLoading}
                className="rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginLoading ? "Signing in..." : "Log In"}
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <Header signedIn />

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">
            Distributor order management
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-neutral-950">
                Hello, {distributorAccountName || "Distributor"}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-700">
                Place CowStop orders online at the $750 distributor rate, choose Cattle Guard Forms shipping through Echo, or upload your own BOL when shipping independently.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAuthMode("signed-out")}
              className="inline-flex justify-center rounded border border-neutral-300 px-5 py-3 font-semibold text-neutral-950 hover:bg-neutral-50"
            >
              Sign Out
            </button>
          </div>
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]" id="distributor-order">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">Distributor Order</h2>
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-800 ring-1 ring-green-200">
                {currencyFormatter.format(DISTRIBUTOR_UNIT_PRICE)} / unit
              </span>
            </div>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <form className="mt-6 grid gap-6" onSubmit={handleSubmit}>
              <section className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-neutral-700">
                  Email for receipt and order updates
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="orders@example.com"
                    className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-neutral-700">
                  Quantity
                  <select
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                  >
                    {Array.from({ length: 50 }, (_, index) => index + 1).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="rounded-xl border border-neutral-200 p-5">
                <h3 className="text-lg font-semibold">Shipping Method</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setShippingMethod("echo")}
                    className={`rounded-lg border p-4 text-left ${
                      shippingMethod === "echo" ? "border-green-800 bg-green-50" : "border-neutral-200 bg-white"
                    }`}
                  >
                    <span className="font-semibold">Use Cattle Guard Forms Shipping</span>
                    <span className="mt-1 block text-sm leading-6 text-neutral-600">
                      Echo rates will appear here after the Echo API is connected.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShippingMethod("own")}
                    className={`rounded-lg border p-4 text-left ${
                      shippingMethod === "own" ? "border-green-800 bg-green-50" : "border-neutral-200 bg-white"
                    }`}
                  >
                    <span className="font-semibold">Ship on My Own</span>
                    <span className="mt-1 block text-sm leading-6 text-neutral-600">
                      Upload your BOL and we will attach it to the manufacturer order.
                    </span>
                  </button>
                </div>

                {shippingMethod === "echo" ? (
                  <div className="mt-5 grid gap-4">
                    <h4 className="font-semibold">Ship To</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        value={shipToName}
                        onChange={(event) => setShipToName(event.target.value)}
                        placeholder="Customer or Company Name"
                        className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2"
                      />
                      <input
                        value={shipToAddress}
                        onChange={(event) => setShipToAddress(event.target.value)}
                        placeholder="Ship-to Address Line 1"
                        className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2"
                      />
                      <input
                        value={shipToAddress2}
                        onChange={(event) => setShipToAddress2(event.target.value)}
                        placeholder="Ship-to Address Line 2"
                        className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2"
                      />
                      <input
                        value={shipToCity}
                        onChange={(event) => setShipToCity(event.target.value)}
                        placeholder="Ship-to City"
                        className="rounded border border-neutral-300 px-3 py-2"
                      />
                      <input
                        value={shipToState}
                        onChange={(event) => setShipToState(event.target.value)}
                        placeholder="Ship-to State"
                        className="rounded border border-neutral-300 px-3 py-2"
                      />
                      <input
                        value={shipToZip}
                        onChange={(event) => setShipToZip(event.target.value)}
                        placeholder="Ship-to ZIP"
                        className="rounded border border-neutral-300 px-3 py-2 sm:col-span-2"
                      />
                    </div>
                    <div className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
                      Echo API rate lookup is the next backend integration. Until credentials and lane rules are connected, this selector is a placeholder for live Echo shipping options.
                    </div>
                    <label className="grid gap-2 text-sm font-medium text-neutral-700">
                      Shipping option
                      <select
                        value={selectedRate}
                        onChange={(event) => setSelectedRate(event.target.value)}
                        className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                      >
                        <option value="">Select Echo rate after API connection</option>
                        <option value="echo-placeholder-standard">Echo freight option pending live rate</option>
                      </select>
                    </label>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4">
                    <label className="grid gap-2 text-sm font-medium text-neutral-700">
                      Upload BOL
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) => setBolFileName(event.target.files?.[0]?.name ?? "")}
                        className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                      />
                    </label>
                    {bolFileName ? (
                      <p className="rounded bg-green-50 px-3 py-2 text-sm font-medium text-green-800 ring-1 ring-green-200">
                        BOL selected: {bolFileName}
                      </p>
                    ) : null}
                  </div>
                )}
              </section>

              <div className="rounded-xl bg-neutral-50 p-5 ring-1 ring-neutral-200">
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>Distributor unit price</span>
                  <span>{currencyFormatter.format(DISTRIBUTOR_UNIT_PRICE)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-neutral-600">
                  <span>Quantity</span>
                  <span>{quantity}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-neutral-600">
                  <span>Shipping</span>
                  <span>{shippingMethod === "echo" ? "Selected Echo rate will be added after live API wiring" : "Own BOL"}</span>
                </div>
                <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-xl font-bold text-neutral-950">
                  <span>Product Total</span>
                  <span>{currencyFormatter.format(productTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Opening checkout..." : "Pay Online"}
              </button>

              <p className="text-sm leading-6 text-neutral-500">
                Once the order is paid and shipping/BOL is complete, the order will be sent to the manufacturer. support@cattleguardforms.com will receive a copy. The distributor receives order confirmation by email, and the manufacturer later replies with the expected ship date.
              </p>
            </form>
          </div>

          <aside className="space-y-8">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-2xl font-semibold">Distributor Branding</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Upload a distributor logo here. This preview is ready for the portal, and permanent storage should be connected to Supabase Storage next.
              </p>
              <div className="mt-5 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-center">
                {distributorLogoPreview ? (
                  <img
                    src={distributorLogoPreview}
                    alt={`${distributorAccountName} logo preview`}
                    className="mx-auto max-h-28 w-auto object-contain"
                  />
                ) : (
                  <p className="text-sm text-neutral-500">No logo uploaded yet.</p>
                )}
              </div>
              <label className="mt-5 grid gap-2 text-sm font-medium text-neutral-700">
                Upload distributor logo
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg"
                  onChange={(event) => handleDistributorLogoUpload(event.target.files?.[0])}
                  className="rounded border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                />
              </label>
              {distributorLogoFileName ? (
                <p className="mt-3 rounded bg-green-50 px-3 py-2 text-sm font-medium text-green-800 ring-1 ring-green-200">
                  Logo selected: {distributorLogoFileName}
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-2xl font-semibold">Portal Workflow</h2>
              <ol className="mt-5 space-y-4">
                {workflow.map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-800 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="leading-7 text-neutral-700">{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
