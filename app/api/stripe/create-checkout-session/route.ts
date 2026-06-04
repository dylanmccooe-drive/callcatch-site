import { NextResponse } from "next/server";
import { createCheckoutSessionForUser } from "@/lib/billing";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const session = await createCheckoutSessionForUser(user);
  return NextResponse.json({ url: session.url });
}
