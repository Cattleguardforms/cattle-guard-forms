const endpoint = process.env.QUOTE_INTAKE_URL || "http://127.0.0.1:3000/api/quote-intake";

const payload = {
  email: `test-${Date.now()}@example.com`,
  first_name: "Test",
  last_name: "Customer",
  phone: "555-0100",
  company: "Cattle Guard Forms Test",
  address_line1: "123 Test Lane",
  city: "Testville",
  state: "TX",
  postal_code: "75001",
  product_name: "Cattle Guard Quote Request",
  product_type: "cattle_guard",
  quantity: 1,
  dimensions: "8 ft x 12 ft",
  specifications: "Diagnostic test submission from scripts/test-quote-intake.mjs",
  installation_needed: false,
  delivery_needed: true,
  project_address_line1: "456 Project Road",
  project_city: "Testville",
  project_state: "TX",
  project_postal_code: "75001",
  notes: "Safe local API test payload. Delete from Supabase later if desired.",
};

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  console.log(JSON.stringify({ httpStatus: response.status, response: json }, null, 2));
  process.exit(response.ok ? 0 : 1);
} catch (error) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
}
