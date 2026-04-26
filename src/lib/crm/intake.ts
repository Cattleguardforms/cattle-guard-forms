import { createClient } from "@supabase/supabase-js";

export type CrmIntakeSource = "contact_form" | "shop_quote" | "distributor_order" | "marketing_email";

export type CrmContactInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
  source: CrmIntakeSource;
};

export type CrmOrderInput = {
  customerId: string;
  productName?: string;
  productType?: string;
  quantity?: number;
  status?: string;
  orderType?: string;
  unitPrice?: number;
  notes?: string;
  projectAddressLine1?: string;
  projectAddressLine2?: string;
  projectCity?: string;
  projectState?: string;
  projectPostalCode?: string;
};

export function getSupabaseAdminClient() {
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

function cleanString(value?: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export async function upsertCrmContact(input: CrmContactInput) {
  const { client: supabase, error } = getSupabaseAdminClient();

  if (!supabase || error) {
    return { customerId: null, error: error || "Supabase client unavailable." };
  }

  const email = cleanString(input.email)?.toLowerCase();
  if (!email) return { customerId: null, error: "Email is required for CRM contact intake." };

  const customerData: Record<string, string> = { email };
  if (cleanString(input.firstName)) customerData.first_name = cleanString(input.firstName)!;
  if (cleanString(input.lastName)) customerData.last_name = cleanString(input.lastName)!;
  if (cleanString(input.phone)) customerData.phone = cleanString(input.phone)!;
  if (cleanString(input.company)) customerData.company = cleanString(input.company)!;
  if (cleanString(input.addressLine1)) customerData.address_line1 = cleanString(input.addressLine1)!;
  if (cleanString(input.addressLine2)) customerData.address_line2 = cleanString(input.addressLine2)!;
  if (cleanString(input.city)) customerData.city = cleanString(input.city)!;
  if (cleanString(input.state)) customerData.state = cleanString(input.state)!;
  if (cleanString(input.postalCode)) customerData.postal_code = cleanString(input.postalCode)!;

  const { data: existingCustomer, error: lookupError } = await supabase
    .from("customers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) return { customerId: null, error: `Customer lookup failed: ${lookupError.message}` };

  if (existingCustomer?.id) {
    const { error: updateError } = await supabase
      .from("customers")
      .update(customerData)
      .eq("id", existingCustomer.id);

    if (updateError) return { customerId: null, error: `Customer update failed: ${updateError.message}` };

    return { customerId: existingCustomer.id as string, error: null };
  }

  const { data: createdCustomer, error: createError } = await supabase
    .from("customers")
    .insert(customerData)
    .select("id")
    .single();

  if (createError || !createdCustomer?.id) {
    return { customerId: null, error: `Customer create failed: ${createError?.message || "missing customer id"}` };
  }

  return { customerId: createdCustomer.id as string, error: null };
}

export async function createCrmOrder(input: CrmOrderInput) {
  const { client: supabase, error } = getSupabaseAdminClient();

  if (!supabase || error) {
    return { orderId: null, status: null, error: error || "Supabase client unavailable." };
  }

  const orderData: Record<string, unknown> = {
    customer_id: input.customerId,
    status: input.status || "pending",
  };

  if (cleanString(input.productName)) orderData.product_name = cleanString(input.productName);
  if (cleanString(input.productType)) orderData.product_type = cleanString(input.productType);
  if (Number.isInteger(input.quantity) && Number(input.quantity) > 0) orderData.quantity = input.quantity;
  if (cleanString(input.notes)) orderData.notes = cleanString(input.notes);
  if (cleanString(input.projectAddressLine1)) orderData.project_address_line1 = cleanString(input.projectAddressLine1);
  if (cleanString(input.projectAddressLine2)) orderData.project_address_line2 = cleanString(input.projectAddressLine2);
  if (cleanString(input.projectCity)) orderData.project_city = cleanString(input.projectCity);
  if (cleanString(input.projectState)) orderData.project_state = cleanString(input.projectState);
  if (cleanString(input.projectPostalCode)) orderData.project_postal_code = cleanString(input.projectPostalCode);

  const { data: createdOrder, error: createOrderError } = await supabase
    .from("orders")
    .insert(orderData)
    .select("id,status")
    .single();

  if (createOrderError || !createdOrder?.id) {
    return { orderId: null, status: null, error: `Order create failed: ${createOrderError?.message || "missing order id"}` };
  }

  return {
    orderId: createdOrder.id as string,
    status: String(createdOrder.status || "pending"),
    error: null,
  };
}
