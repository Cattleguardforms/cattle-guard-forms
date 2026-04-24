import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type IntakeBody = Record<string, unknown>;

type ValidationResult = {
  payload: IntakeBody;
  errors: string[];
};

const customerFields = [
  "first_name",
  "last_name",
  "phone",
  "company",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
] as const;

const orderFields = [
  "product_name",
  "product_type",
  "quantity",
  "dimensions",
  "specifications",
  "installation_needed",
  "delivery_needed",
  "project_address_line1",
  "project_address_line2",
  "project_city",
  "project_state",
  "project_postal_code",
  "notes",
] as const;

function isObject(value: unknown): value is IntakeBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(payload: IntakeBody, key: string): string | null {
  const value = payload[key];
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" ? value.trim() : null;
}

function getBoolean(payload: IntakeBody, key: string): boolean | null {
  const value = payload[key];
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "boolean" ? value : null;
}

function getQuantity(payload: IntakeBody): number | null {
  const value = payload.quantity;
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) return NaN;
  return value;
}

function validatePayload(payload: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isObject(payload)) {
    return { payload: {}, errors: ["Request body must be a JSON object."] };
  }

  const email = getString(payload, "email");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("A valid email is required.");
  }

  for (const key of [...customerFields, ...orderFields]) {
    const value = payload[key];
    if (value === undefined || value === null || value === "") continue;

    if (["installation_needed", "delivery_needed"].includes(key)) {
      if (typeof value !== "boolean") errors.push(`${key} must be a boolean.`);
      continue;
    }

    if (key === "quantity") {
      if (Number.isNaN(getQuantity(payload))) errors.push("quantity must be a positive integer.");
      continue;
    }

    if (typeof value !== "string") errors.push(`${key} must be a string.`);
  }

  return { payload, errors };
}

function buildCustomerData(payload: IntakeBody) {
  const data: Record<string, string> = {};
  const email = getString(payload, "email");
  if (email) data.email = email.toLowerCase();

  for (const key of customerFields) {
    const value = getString(payload, key);
    if (value) data[key] = value;
  }

  return data;
}

function buildOrderData(payload: IntakeBody, customerId: string) {
  const data: Record<string, unknown> = {
    customer_id: customerId,
    status: "pending",
  };

  for (const key of orderFields) {
    if (key === "quantity") {
      const quantity = getQuantity(payload);
      if (quantity && !Number.isNaN(quantity)) data.quantity = quantity;
      continue;
    }

    if (key === "installation_needed" || key === "delivery_needed") {
      const value = getBoolean(payload, key);
      if (value !== null) data[key] = value;
      continue;
    }

    const value = getString(payload, key);
    if (value) data[key] = value;
  }

  return data;
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceRoleKey || publishableKey;

  if (!supabaseUrl || !key) {
    return { client: null, error: "Missing Supabase server environment variables." };
  }

  return {
    client: createClient(supabaseUrl, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    error: null,
  };
}

export async function GET() {
  return NextResponse.json(
    { ok: false, errors: ["Method not allowed. Use POST for quote intake submissions."] },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["Invalid JSON body."] }, { status: 400 });
  }

  const { payload, errors } = validatePayload(body);
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const { client: supabase, error: envError } = getSupabaseAdminClient();
  if (!supabase || envError) {
    return NextResponse.json({ ok: false, errors: [envError || "Supabase client unavailable."] }, { status: 500 });
  }

  const customerData = buildCustomerData(payload);
  const email = customerData.email;

  try {
    const { data: existingCustomer, error: lookupError } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ ok: false, errors: [`Customer lookup failed: ${lookupError.message}`] }, { status: 500 });
    }

    let customerId = existingCustomer?.id as string | undefined;

    if (customerId) {
      const { error: updateError } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", customerId);

      if (updateError) {
        return NextResponse.json({ ok: false, errors: [`Customer update failed: ${updateError.message}`] }, { status: 500 });
      }
    } else {
      const { data: createdCustomer, error: createCustomerError } = await supabase
        .from("customers")
        .insert(customerData)
        .select("id")
        .single();

      if (createCustomerError || !createdCustomer?.id) {
        return NextResponse.json(
          { ok: false, errors: [`Customer create failed: ${createCustomerError?.message || "missing customer id"}`] },
          { status: 500 }
        );
      }

      customerId = createdCustomer.id as string;
    }

    const orderData = buildOrderData(payload, customerId);
    const { data: createdOrder, error: createOrderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select("id,status")
      .single();

    if (createOrderError || !createdOrder?.id) {
      return NextResponse.json(
        { ok: false, errors: [`Order create failed: ${createOrderError?.message || "missing order id"}`] },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        customer_id: customerId,
        order_id: createdOrder.id,
        status: createdOrder.status || "pending",
        errors: [],
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, errors: [error instanceof Error ? error.message : String(error)] },
      { status: 500 }
    );
  }
}
