import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminUser, requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logout } from "@/app/login/page";

export const dynamic = "force-dynamic";

type AdminCustomer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  mobile: string | null;
  trade: string | null;
  onboarding_status: string | null;
  callcatch_number: string | null;
  created_at: string;
  subscriptions?: Array<{
    status: string;
    trial_end: string | null;
    current_period_end: string | null;
  }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default async function AdminPage() {
  const user = await requireUser("/admin");

  if (!(await isAdminUser(user))) {
    redirect("/dashboard");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id,email,first_name,last_name,business_name,mobile,trade,onboarding_status,callcatch_number,created_at,subscriptions(status,trial_end,current_period_end)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const customers = (data ?? []) as AdminCustomer[];
  const trialing = customers.filter((customer) =>
    customer.subscriptions?.some((subscription) => subscription.status === "trialing")
  ).length;
  const active = customers.filter((customer) =>
    customer.subscriptions?.some((subscription) => subscription.status === "active")
  ).length;

  return (
    <div className="app-wrap">
      <nav className="app-nav">
        <Link href="/" className="logo">
          Call<span>Catch</span>.
        </Link>
        <div className="nav-actions">
          <Link href="/dashboard" className="nav-link">
            Customer dashboard
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
          <div className="eyebrow">Admin dashboard</div>
          <h1>
            Customers, trials, and <em>subscriptions</em>.
          </h1>
          <p>
            Read-only operational view backed by Supabase. Add admin access via ADMIN_EMAILS or
            public.admin_users.
          </p>
        </section>

        <section className="dashboard-grid">
          <div className="card">
            <span className="stat">
              Customers
              <strong className="stat-value">{customers.length}</strong>
            </span>
          </div>
          <div className="card">
            <span className="stat">
              Trialing
              <strong className="stat-value">{trialing}</strong>
            </span>
          </div>
          <div className="card">
            <span className="stat">
              Active
              <strong className="stat-value">{active}</strong>
            </span>
          </div>
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <h2>Customer records</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Business</th>
                  <th>Mobile</th>
                  <th>Trade</th>
                  <th>Status</th>
                  <th>Trial end</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const subscription = customer.subscriptions?.[0];
                  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ");

                  return (
                    <tr key={customer.id}>
                      <td>
                        <strong>{name || customer.email}</strong>
                        <br />
                        {customer.email}
                      </td>
                      <td>
                        {customer.business_name ?? "-"}
                        <br />
                        <span className="muted">{customer.callcatch_number ?? "No number yet"}</span>
                      </td>
                      <td>{customer.mobile ?? "-"}</td>
                      <td>{customer.trade ?? "-"}</td>
                      <td>{subscription?.status ?? customer.onboarding_status ?? "signup"}</td>
                      <td>{formatDate(subscription?.trial_end)}</td>
                      <td>{formatDate(customer.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
