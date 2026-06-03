import { readFileSync } from "node:fs";
import { join } from "node:path";
import Script from "next/script";

function extractTag(html: string, tag: "style" | "body" | "script") {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1] ?? "";
}

function getLandingContent() {
  const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
  const styles = extractTag(html, "style");
  const script = extractTag(html, "script");
  let body = extractTag(html, "body");

  body = body
    .replace(/href="#signup"/g, 'href="/signup"')
    .replace(/Start free trial/g, "Start 21-day trial")
    .replace(/No card/g, "Stripe-secured")
    .replace(/no card/g, "Stripe checkout")
    .replace(/No contract/g, "No contract")
    .replace(
      '<div class="logo">Call<span>Catch</span>.</div>',
      '<a class="logo" href="/">Call<span>Catch</span>.</a><div class="saas-nav-actions"><a class="nav-link" href="/login">Log in</a><a class="nav-cta" href="/signup">Start trial</a></div>'
    )
    .replace(
      "By submitting, you'll be sent to <strong>WhatsApp</strong> to confirm details. <strong>Stripe checkout needed.</strong> Cancel anytime.",
      "Create your account, then activate your <strong>21-day Stripe trial</strong>. Cancel anytime before billing."
    );

  return { styles, body, script };
}

const signupOverride = `
  window.submitSignup = function(e) {
    e.preventDefault();
    var params = new URLSearchParams();
    ["firstName", "lastName", "businessName", "mobile", "trade"].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.value) params.set(id, el.value.trim());
    });
    var plan = document.querySelector('input[name="plan"]:checked');
    if (plan) params.set("plan", plan.value);
    window.location.href = "/signup" + (params.toString() ? "?" + params.toString() : "");
    return false;
  };
`;

export default function HomePage() {
  const landing = getLandingContent();

  return (
    <main className="landing-enhancements">
      <style dangerouslySetInnerHTML={{ __html: landing.styles }} />
      <div dangerouslySetInnerHTML={{ __html: landing.body }} />
      <Script id="callcatch-landing" strategy="afterInteractive">
        {landing.script}
      </Script>
      <Script id="callcatch-signup-override" strategy="afterInteractive">
        {signupOverride}
      </Script>
    </main>
  );
}
