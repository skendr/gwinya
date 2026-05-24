import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; mode?: string }>;
}) {
  const { next = "/", error, mode } = await searchParams;
  const initialMode = mode === "magic" ? "magic" : "password";
  return (
    <main className="flex flex-1 flex-col px-5 pt-12">
      <div className="space-y-3">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Sign in
        </p>
        <h1 className="font-display text-[2.15rem] font-semibold leading-[1.05] tracking-tight text-balance text-[var(--color-ink)]">
          Welcome back. <br />
          <span
            className="squiggle italic text-[var(--color-clay-deep)]"
            style={{ fontVariationSettings: '"WONK" 1, "SOFT" 100' }}
          >
            Quick & quiet.
          </span>
        </h1>
        <p className="text-pretty text-[0.95rem] leading-relaxed text-[var(--color-ink-soft)]">
          Pick a password and you&apos;re in. We&apos;ll create your account on the fly —
          no email verification, no waiting around.
        </p>
      </div>

      <div className="mt-8">
        <SignInForm next={next} initialError={error} initialMode={initialMode} />
      </div>

      <p className="mt-auto pt-10 pb-6 text-center text-xs text-[var(--color-muted)]">
        Gwinya isn&apos;t a clinical tool. It supports the plan you&apos;ve already made with
        your Speech and Language Therapist.
      </p>
    </main>
  );
}
