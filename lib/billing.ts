import type { User } from "@supabase/supabase-js";
import { getSiteUrl, requireEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import type { CustomerRecord } from "@/lib/auth";

const TRIAL_DAYS = 21;

export async function createCheckoutSessionForUser(user: User) {
  const supabase = createSupabaseAdminClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!customer) {
    throw new Error("Customer profile not found. Please complete signup first.");
  }

  const stripe = getStripe();
  let stripeCustomerId = (customer as CustomerRecord).stripe_customer_id;

  if (!stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      email: user.email ?? (customer as CustomerRecord).email,
      name: [(customer as CustomerRecord).first_name, (customer as CustomerRecord).last_name]
        .filter(Boolean)
        .join(" "),
      phone: (customer as CustomerRecord).mobile ?? undefined,
      metadata: {
        user_id: user.id,
        customer_id: (customer as CustomerRecord).id,
        business_name: (customer as CustomerRecord).business_name ?? ""
      }
    });

    stripeCustomerId = stripeCustomer.id;
    await supabase
      .from("customers")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", (customer as CustomerRecord).id);
  }

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price: requireEnv("STRIPE_PRICE_ID"),
        quantity: 1
      }
    ],
    payment_method_collection: "always",
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: {
        user_id: user.id,
        customer_id: (customer as CustomerRecord).id
      }
    },
    success_url: `${getSiteUrl()}/dashboard?checkout=success`,
    cancel_url: `${getSiteUrl()}/dashboard?checkout=cancelled`,
    metadata: {
      user_id: user.id,
      customer_id: (customer as CustomerRecord).id
    }
  });
}

export async function createBillingPortalSessionForUser(user: User) {
  const supabase = createSupabaseAdminClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!customer?.stripe_customer_id) {
    throw new Error("Stripe customer not found.");
  }

  return getStripe().billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${getSiteUrl()}/dashboard`
  });
}
