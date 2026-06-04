import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function logout() {
  "use server";

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const error = param(params.error);
  const message = param(params.message);
  const next = param(params.next) ?? "/dashboard";

  return (
    <div className="app-wrap">
      <nav className="app-nav">
        <Link href="/" className="logo">
          Call<span>Catch</span>.
        </Link>
        <div className="nav-actions">
          <Link href="/signup" className="nav-link">
            Sign up
          </Link>
        </div>
      </nav>

      <main className="page-shell auth-grid">
        <section className="page-heading">
          <div className="eyebrow">Welcome back</div>
          <h1>
            Log in to your <em>CallCatch</em> dashboard.
          </h1>
          <p>
            Manage your trial, billing, business details, and setup status from one place.
          </p>
          <ul className="feature-list">
            <li>Supabase-secured authentication</li>
            <li>Stripe subscription and billing portal access</li>
            <li>Setup status and CallCatch number details</li>
          </ul>
        </section>

        <section className="card">
          <h2>Log in</h2>
          {message ? <div className="notice">{message}</div> : null}
          {error ? <div className="notice error">{error}</div> : null}
          <form action={login}>
            <input type="hidden" name="next" value={next} />
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <button className="btn btn-primary form-submit" type="submit">
              Log in
            </button>
          </form>
          <p className="muted">
            No account yet? <Link href="/signup">Start your 21-day trial.</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
