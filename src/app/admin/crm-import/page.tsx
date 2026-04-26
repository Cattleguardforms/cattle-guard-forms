"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";

type CsvRow = Record<string, string>;
type MappingKey =
  | "sale_date"
  | "customer_name"
  | "email"
  | "address"
  | "phone"
  | "company_name"
  | "company_email"
  | "company_phone"
  | "raw_vendor_name"
  | "normalized_vendor_name"
  | "product_name"
  | "cowstop_quantity"
  | "quantity"
  | "unit_price"
  | "total"
  | "notes";

type ValidationResult = {
  rowNumber: number;
  status: "valid" | "warning" | "error";
  messages: string[];
  normalizedVendor: string;
  normalizedProduct: string;
};

const mappingFields: { key: MappingKey; label: string; required?: boolean; note?: string }[] = [
  { key: "sale_date", label: "Sale date", required: true },
  { key: "customer_name", label: "Customer name" },
  { key: "email", label: "Customer email" },
  { key: "address", label: "Customer address" },
  { key: "phone", label: "Customer phone" },
  { key: "company_name", label: "Company name", note: "Optional" },
  { key: "company_email", label: "Company email", note: "Optional" },
  { key: "company_phone", label: "Company phone", note: "Optional" },
  { key: "raw_vendor_name", label: "Distributor / vendor sold by", required: true },
  { key: "normalized_vendor_name", label: "Normalized vendor name" },
  { key: "product_name", label: "Product sold", required: true },
  { key: "cowstop_quantity", label: "CowStop quantity sold" },
  { key: "quantity", label: "Generic quantity" },
  { key: "unit_price", label: "Unit price" },
  { key: "total", label: "Total sale amount" },
  { key: "notes", label: "Notes" },
];

const years = ["2019", "2020", "2021"];
const importTypes = ["Customers only", "Sales/orders only", "Customers + sales/orders"];

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [] as string[], rows: [] as CsvRow[] };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });

  return { headers, rows };
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function guessMapping(headers: string[]) {
  const matches: Record<MappingKey, string[]> = {
    sale_date: ["saledate", "date", "orderdate", "purchasedate", "transactiondate"],
    customer_name: ["customername", "name", "buyername", "fullname", "contactname"],
    email: ["email", "customeremail", "buyeremail"],
    address: ["address", "streetaddress", "shippingaddress", "customeraddress"],
    phone: ["phone", "phonenumber", "customerphone", "buyerphone"],
    company_name: ["company", "companyname", "business", "businessname"],
    company_email: ["companyemail", "businessemail"],
    company_phone: ["companyphone", "businessphone"],
    raw_vendor_name: ["vendor", "distributor", "soldby", "seller", "retailer", "channel"],
    normalized_vendor_name: ["normalizedvendor", "normalizedvendorname"],
    product_name: ["product", "productname", "item", "itemname", "sku"],
    cowstop_quantity: ["cowstopquantity", "cowstops", "cowstopssold", "cowstopqty"],
    quantity: ["quantity", "qty", "units", "unitssold"],
    unit_price: ["unitprice", "price", "saleprice"],
    total: ["total", "totalamount", "saletotal", "amount"],
    notes: ["notes", "note", "comments", "comment"],
  };

  return mappingFields.reduce<Record<MappingKey, string>>((mapping, field) => {
    const matchedHeader = headers.find((header) => matches[field.key].includes(normalizeHeader(header)));
    mapping[field.key] = matchedHeader ?? "";
    return mapping;
  }, {} as Record<MappingKey, string>);
}

function getMappedValue(row: CsvRow, mapping: Record<MappingKey, string>, key: MappingKey) {
  const header = mapping[key];
  return header ? (row[header] ?? "").trim() : "";
}

function normalizeVendor(rawVendor: string, mappedVendor: string) {
  const value = (mappedVendor || rawVendor).trim();
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (["tsc", "tractorsupply", "tractorsupplycompany", "tractorsupplyco"].includes(normalized)) {
    return "Tractor Supply Company";
  }

  if (normalized.includes("farm") && normalized.includes("ranch")) {
    return "Farm and Ranch Experts";
  }

  if (normalized.includes("barn") && normalized.includes("world")) {
    return "Barn World";
  }

  return value;
}

function normalizeProduct(productName: string) {
  const normalized = productName.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (normalized.includes("texan")) {
    return "Texan (archived)";
  }

  if (normalized.includes("cowstop") || normalized.includes("cowstopform") || normalized.includes("cattleguard")) {
    return "CowStop Reusable Form";
  }

  return productName;
}

function looksLikeDate(value: string) {
  if (!value) return false;
  return !Number.isNaN(Date.parse(value));
}

function looksNumeric(value: string) {
  if (!value) return false;
  return !Number.isNaN(Number(value.replace(/[$,]/g, "")));
}

function validateRows(rows: CsvRow[], mapping: Record<MappingKey, string>) {
  return rows.map<ValidationResult>((row, index) => {
    const messages: string[] = [];
    const saleDate = getMappedValue(row, mapping, "sale_date");
    const customerName = getMappedValue(row, mapping, "customer_name");
    const email = getMappedValue(row, mapping, "email");
    const phone = getMappedValue(row, mapping, "phone");
    const address = getMappedValue(row, mapping, "address");
    const rawVendor = getMappedValue(row, mapping, "raw_vendor_name");
    const mappedVendor = getMappedValue(row, mapping, "normalized_vendor_name");
    const productName = getMappedValue(row, mapping, "product_name");
    const cowstopQuantity = getMappedValue(row, mapping, "cowstop_quantity");
    const quantity = getMappedValue(row, mapping, "quantity");
    const normalizedVendor = normalizeVendor(rawVendor, mappedVendor);
    const normalizedProduct = normalizeProduct(productName);

    if (!saleDate || !looksLikeDate(saleDate)) {
      messages.push("Missing or invalid sale date.");
    }

    if (!rawVendor && !mappedVendor) {
      messages.push("Missing distributor/vendor sold by.");
    }

    if (!productName) {
      messages.push("Missing product name.");
    }

    if (!customerName && !email && !phone && !address) {
      messages.push("No identifying customer information found.");
    }

    const isCowStop = normalizedProduct === "CowStop Reusable Form";
    if (isCowStop && !looksNumeric(cowstopQuantity || quantity)) {
      messages.push("CowStop row is missing numeric CowStop quantity or quantity.");
    }

    const hasError = !saleDate || (!customerName && !email && !phone && !address);

    return {
      rowNumber: index + 2,
      status: hasError ? "error" : messages.length > 0 ? "warning" : "valid",
      messages,
      normalizedVendor,
      normalizedProduct,
    };
  });
}

export default function CrmHistoricalImportPage() {
  const [selectedYear, setSelectedYear] = useState("2019");
  const [importType, setImportType] = useState("Customers + sales/orders");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<Record<MappingKey, string>>(() => guessMapping([]));
  const [parseError, setParseError] = useState<string | null>(null);

  const validations = useMemo(() => validateRows(rows, mapping), [rows, mapping]);
  const validRows = validations.filter((result) => result.status === "valid").length;
  const warningRows = validations.filter((result) => result.status === "warning").length;
  const errorRows = validations.filter((result) => result.status === "error").length;
  const previewRows = rows.slice(0, 20);
  const previewHeaders = headers.slice(0, 12);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setParseError(null);

    if (!file) return;

    setFileName(file.name);

    if (file.name.toLowerCase().endsWith(".xlsx")) {
      setHeaders([]);
      setRows([]);
      setMapping(guessMapping([]));
      setParseError("Excel .xlsx parsing is not enabled yet. Please export this file as CSV first.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setHeaders([]);
      setRows([]);
      setMapping(guessMapping([]));
      setParseError("Please upload a .csv file for this preview step.");
      return;
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(guessMapping(parsed.headers));
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-semibold text-green-800">Admin Portal</Link>
          <nav className="flex gap-6 text-sm font-medium text-neutral-700">
            <Link href="/admin" className="hover:text-green-800">Dashboard</Link>
            <Link href="/admin/crm-activity" className="hover:text-green-800">CRM Activity</Link>
            <Link href="/admin/settings" className="hover:text-green-800">Settings</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-800">Admin / CRM Historical Import</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">CRM Historical Import</h1>
            <p className="mt-4 max-w-3xl leading-8 text-neutral-700">
              Upload 2019, 2020, or 2021 historical customer and sales CSV files, preview rows, map columns, and validate data before writing anything to Supabase.
            </p>
          </div>
          <Link href="/admin" className="rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900">Back to Admin Portal</Link>
        </div>

        <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-200">
          Company name, company email, company phone, customer email, and customer phone are optional. TSC normalizes to Tractor Supply Company. Texan is treated as an archived product. This page previews and validates only; backend Supabase import will be connected next.
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-semibold">Upload file</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                Import year
                <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                Import type
                <select value={importType} onChange={(event) => setImportType(event.target.value)} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                  {importTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                CSV file
                <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} className="rounded border border-neutral-300 px-3 py-2 font-normal" />
              </label>
              {fileName ? <p className="text-sm text-neutral-600">Selected file: <span className="font-semibold">{fileName}</span></p> : null}
              {parseError ? <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{parseError}</div> : null}
            </div>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-semibold">Validation summary</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-neutral-50 p-4 ring-1 ring-neutral-200">
                <p className="text-xs font-semibold uppercase text-neutral-500">Total rows</p>
                <p className="mt-1 text-2xl font-bold">{rows.length}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 ring-1 ring-green-200">
                <p className="text-xs font-semibold uppercase text-green-800">Valid</p>
                <p className="mt-1 text-2xl font-bold">{validRows}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
                <p className="text-xs font-semibold uppercase text-amber-800">Warnings</p>
                <p className="mt-1 text-2xl font-bold">{warningRows}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
                <p className="text-xs font-semibold uppercase text-red-800">Errors</p>
                <p className="mt-1 text-2xl font-bold">{errorRows}</p>
              </div>
            </div>
            <button type="button" disabled className="mt-5 rounded bg-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700">
              Backend import route required before writing to Supabase
            </button>
          </article>
        </section>

        {headers.length > 0 ? (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-semibold">Detected headers</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {headers.map((header) => <span key={header} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">{header}</span>)}
            </div>
          </section>
        ) : null}

        {headers.length > 0 ? (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-semibold">Column mapping</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Map your file columns to CRM import fields. Optional company/contact fields can stay unmapped.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mappingFields.map((field) => (
                <label key={field.key} className="grid gap-2 text-sm font-medium text-neutral-700">
                  <span>{field.label} {field.required ? <span className="text-red-700">*</span> : null} {field.note ? <span className="text-xs text-neutral-500">({field.note})</span> : null}</span>
                  <select value={mapping[field.key]} onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))} className="rounded border border-neutral-300 px-3 py-2 font-normal">
                    <option value="">Not mapped</option>
                    {headers.map((header) => <option key={header} value={header}>{header}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </section>
        ) : null}

        {previewRows.length > 0 ? (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-semibold">Preview first 20 rows</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    {previewHeaders.map((header) => <th key={header} className="whitespace-nowrap px-3 py-2 font-semibold">{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="border-b border-neutral-100">
                      {previewHeaders.map((header) => <td key={header} className="max-w-xs truncate px-3 py-2 text-neutral-700">{row[header]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {validations.length > 0 ? (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <h2 className="text-xl font-semibold">Row validation</h2>
            <div className="mt-5 space-y-3">
              {validations.slice(0, 30).map((result) => (
                <article key={result.rowNumber} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold">Row {result.rowNumber}: <span className={result.status === "valid" ? "text-green-800" : result.status === "warning" ? "text-amber-800" : "text-red-800"}>{result.status}</span></p>
                    <p className="text-sm text-neutral-600">Vendor: {result.normalizedVendor || "Not set"} | Product: {result.normalizedProduct || "Not set"}</p>
                  </div>
                  {result.messages.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                      {result.messages.map((message) => <li key={message}>{message}</li>)}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
