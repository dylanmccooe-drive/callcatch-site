import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
      appInfo: {
        name: "CallCatch",
        version: "1.0.0"
      }
    });
  }

  return stripeClient;
}
