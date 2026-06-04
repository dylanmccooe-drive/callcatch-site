import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function signup(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const mobile = String(formData.get("mobile") ?? "").trim();
  const trade = String(formData.get("trade") ?? "").trim();

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
        business_name: businessName,
        mobile,
        trade
      }
    }
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    const admin = createSupabaseAdminClient();
    const { error: customerError } = await admin.from("customers").upsert(
      {
        user_id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        business_name: businessName,
        mobile,
        trade,
        onboarding_status: "signup"
      },
      { onConflict: "user_id" }
    );

    if (customerError) {
      redirect(`/signup?error=${encodeURIComponent(customerError.message)}`);
    }
  }

  if (data.session) {
    redirect("/dashboard?welcome=1");
  }

  redirect(
    "/login?message=Check your email to confirm your account, then log in to activate your trial."
  );
}

export default async function SignupPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const error = param(params.error);

  return (
    <div className="app-wrap">
      <nav className="app-nav">
        <Link href="/" className="logo">
          Call<span>Catch</span>.
        </Link>
        <div className="nav-actions">
          <Link href="/login" className="nav-link">
            Log in
          </Link>
        </div>
      </nav>

      <main className="page-shell auth-grid">
        <section className="page-heading">
          <div className="eyebrow">21-day free trial</div>
          <h1>
            Create your account, then activate <em>Stripe billing</em>.
          </h1>
          <p>
            Start with 21 days free. Stripe securely stores the payment method and charges
            £45/month only after the trial unless you cancel.
          </p>
          <ul className="feature-list">
            <li>Supabase authentication and customer storage</li>
            <li>21-day Stripe subscription trial</li>
            <li>£45/month after trial, cancel anytime</li>
            <li>Customer dashboard included immediately</li>
          </ul>
        </section>

        <section className="card">
          <h2>Start your trial</h2>
          {error ? <div className="notice error">{error}</div> : null}
          <form action={signup}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  defaultValue={param(params.firstName) ?? ""}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  defaultValue={param(params.lastName) ?? ""}
                  autoComplete="family-name"
                  required
                />
              </div>
              <div className="form-field full">
                <label htmlFor="businessName">Business name</label>
                <input
                  id="businessName"
                  name="businessName"
                  defaultValue={param(params.businessName) ?? ""}
                  autoComplete="organization"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="mobile">Mobile number</label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  defaultValue={param(params.mobile) ?? ""}
                  autoComplete="tel"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="trade">Trade</label>
                <select id="trade" name="trade" defaultValue={param(params.trade) ?? ""} required>
                  <option value="">Select...</option>
                  <option value="plumber">Plumber / Gas</option>
                  <option value="electrician">Electrician</option>
                  <option value="joiner">Joiner / Carpenter</option>
                  <option value="builder">Builder</option>
                  <option value="handyman">Handyman</option>
                  <option value="roofer">Roofer</option>
                  <option value="painter">Painter / Decorator</option>
                  <option value="locksmith">Locksmith</option>
                  <option value="other">Other trade</option>
                </select>
              </div>
              <div className="form-field full">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="form-field full">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <button className="btn btn-primary form-submit" type="submit">
              Create account
            </button>
          </form>
          <p className="muted">
            Already signed up? <Link href="/login">Log in.</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
