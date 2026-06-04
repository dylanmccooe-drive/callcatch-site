import Link from "next/link";
import { redirect } from "next/navigation";
import { createCheckoutSessionForUser, createBillingPortalSessionForUser } from "@/lib/billing";
import {
  getCustomerByUserId,
  getFullName,
  getSubscriptionByCustomerId,
  requireUser
} from "@/lib/auth";
import { logout } from "@/app/login/page";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

async function startCheckout() {
  "use server";

  const user = await requireUser("/dashboard");
  const session = await createCheckoutSessionForUser(user);

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  redirect(session.url);
}

async function openBillingPortal() {
  "use server";

  const user = await requireUser("/dashboard");
  const session = await createBillingPortalSessionForUser(user);

  redirect(session.url);
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const user = await requireUser("/dashboard");
  const customer = await getCustomerByUserId(user.id);

  if (!customer) {
    redirect("/signup?error=Please complete your customer profile.");
  }

  const subscription = await getSubscriptionByCustomerId(customer.id);
  const subscriptionStatus = subscription?.status ?? "not_started";
  const checkout = param(params.checkout);
  const welcome = param(params.welcome);

  return (
    <div className="app-wrap">
      <nav className="app-nav">
        <Link href="/" className="logo">
          Call<span>Catch</span>.
        </Link>
        <div className="nav-actions">
          <Link href="/admin" className="nav-link">
            Admin
          </Link>
          <form action={logout}>
            <button className="nav-link" type="submit">
              Log out
            </button>
          </form>
        </div>
      </nav>

      <main className="page-shell">
        <section className="page-heading">
          <div className="eyebrow">Customer dashboard</div>
          <h1>
            Welcome, <em>{customer.first_name ?? getFullName(customer)}</em>.
          </h1>
          <p>
            Manage your CallCatch setup, subscription, and billing. Your 21-day trial is
            activated through Stripe and renews at £45/month after the trial.
          </p>
        </section>

        {welcome ? <div className="notice">Account created. Activate Stripe to start the trial.</div> : null}
        {checkout === "success" ? (
          <div className="notice">Stripe checkout complete. Subscription status may take a moment to sync.</div>
        ) : null}
        {checkout === "cancelled" ? (
          <div className="notice error">Checkout cancelled. You can start the trial whenever you are ready.</div>
        ) : null}

        <section className="dashboard-grid">
          <div className="card">
            <span className={`status-pill ${subscriptionStatus}`}>{subscriptionStatus}</span>
            <h3>Subscription</h3>
            <p className="muted">
              {subscription
                ? `Current period ends ${formatDate(subscription.current_period_end)}.`
                : "No active Stripe subscription yet."}
            </p>
            {subscription ? (
              <form action={openBillingPortal}>
                <button className="btn btn-secondary" type="submit">
                  Manage billing
                </button>
              </form>
            ) : (
              <form action={startCheckout}>
                <button className="btn btn-primary" type="submit">
                  Activate 21-day trial
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <span className="stat">
              Trial ends
              <strong className="stat-value">{formatDate(subscription?.trial_end)}</strong>
            </span>
            <p className="muted">The plan bills at £45/month after the free trial.</p>
          </div>

          <div className="card">
            <span className="stat">
              CallCatch number
              <strong className="stat-value">{customer.callcatch_number ?? "Pending"}</strong>
            </span>
            <p className="muted">Your dedicated number appears here once setup is complete.</p>
          </div>

          <div className="card wide">
            <h3>Business profile</h3>
            <ul className="plain-list">
              <li>
                <strong>Business:</strong> {customer.business_name}
              </li>
              <li>
                <strong>Trade:</strong> {customer.trade}
              </li>
              <li>
                <strong>Mobile:</strong> {customer.mobile}
              </li>
              <li>
                <strong>Email:</strong> {customer.email}
              </li>
            </ul>
          </div>

          <div className="card">
            <h3>Setup status</h3>
            <span className="status-pill">{customer.onboarding_status ?? "signup"}</span>
            <p className="muted">
              After trial activation, the founder can assign your number and mark onboarding
              progress from the admin dashboard.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
