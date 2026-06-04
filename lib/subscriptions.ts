import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function fromUnix(timestamp: number | null | undefined) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

export async function upsertStripeSubscription(subscription: Stripe.Subscription) {
  const supabase = createSupabaseAdminClient();
  const stripeCustomerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (customerError) {
    throw customerError;
  }

  if (!customer) {
    return;
  }

  const firstItem = subscription.items.data[0];
  const sub = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  const { error } = await supabase.from("subscriptions").upsert(
    {
      customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: firstItem?.price.id ?? null,
      status: subscription.status,
      trial_start: fromUnix(subscription.trial_start),
      trial_end: fromUnix(subscription.trial_end),
      current_period_start: fromUnix(sub.current_period_start),
      current_period_end: fromUnix(sub.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    },
    { onConflict: "stripe_subscription_id" }
  );

  if (error) {
    throw error;
  }
}

export async function attachCheckoutCustomer(session: Stripe.Checkout.Session) {
  if (!session.customer || !session.metadata?.customer_id) {
    return;
  }

  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer.id;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("customers")
    .update({ stripe_customer_id: stripeCustomerId })
    .eq("id", session.metadata.customer_id);

  if (error) {
    throw error;
  }
}
