"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

type Step = 1 | 2;

function validatePassword(password: string) {
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(rules).filter(Boolean).length;

  return {
    valid: score === 5,
    score,
    rules,
  };
}

function getPasswordStrength(score: number) {
  if (score <= 1) return { label: "Weak", width: "20%", color: "bg-red-600" };
  if (score === 2) return { label: "Fair", width: "40%", color: "bg-orange-500" };
  if (score === 3) return { label: "Good", width: "60%", color: "bg-yellow-500" };
  if (score === 4) return { label: "Strong", width: "80%", color: "bg-lime-500" };
  return { label: "Excellent", width: "100%", color: "bg-emerald-500" };
}

export default function SignupPage() {
  const supabase = createClient();
  const turnstileRef = useRef<TurnstileInstance>(null);

  const [step, setStep] = useState<Step>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [smsConsent, setSmsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const passwordCheck = validatePassword(password);
  const passwordStrength = getPasswordStrength(passwordCheck.score);

  function nextStep() {
    setError("");

    if (!fullName.trim()) return setError("Please enter your full name.");
    if (!email.trim()) return setError("Please enter your email.");

    if (!password.trim() || !confirmPassword.trim()) {
      return setError("Please enter and confirm your password.");
    }

    if (!passwordCheck.valid) {
      return setError(
        "Please create a stronger password with uppercase, lowercase, number, special character, and at least 8 characters."
      );
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setStep(2);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!termsConsent) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    if (phone.trim() && !smsConsent) {
      setError("Please check the SMS consent box if you enter a phone number.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the verification.");
      return;
    }

    setLoading(true);

    try {
      const { error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login`
              : undefined,
          data: {
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            sms_consent: smsConsent,
            marketing_consent: marketingConsent,
            sms_consent_language:
              "I agree to receive SMS messages from RoseOut about my account, recommendations, booking updates, reminders, and customer support. Message frequency varies. Message and data rates may apply. Reply STOP to opt out and HELP for help.",
            sms_consent_timestamp: smsConsent ? new Date().toISOString() : null,
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        turnstileRef.current?.reset();
        setTurnstileToken("");
        return;
      }

      setMessage("Account created. Please check your email to confirm.");
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setSmsConsent(false);
      setMarketingConsent(false);
      setTermsConsent(false);
      setTurnstileToken("");
      turnstileRef.current?.reset();
      setStep(1);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(225,6,42,0.28),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(127,29,29,0.28),transparent_28%),linear-gradient(180deg,#050505,#000)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="RoseOut"
              width={38}
              height={38}
              className="object-contain drop-shadow-[0_0_12px_rgba(225,6,42,0.45)]"
              priority
            />
            <span className="text-sm font-black uppercase tracking-[0.28em] text-white">
              RoseOut
            </span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/70 transition hover:bg-white hover:text-black"
          >
            Log In
          </Link>
        </header>

        <section className="grid min-h-[calc(100vh-96px)] items-center gap-8 lg:grid-cols-[1fr_430px]">
          <div className="hidden lg:block">
            <p className="text-xs font-black uppercase tracking-[0.38em] text-red-400">
              AI-powered outing planner
            </p>

            <h1 className="mt-5 max-w-2xl text-6xl font-black leading-[0.92] tracking-tight xl:text-7xl">
              Create your
              <br />
              <span className="text-red-500">RoseOut.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
              Plan better outings, save your selections, and keep your next
              experience ready whenever you are.
            </p>

            <div className="mt-8 flex gap-3">
              <StepPill active={step === 1} label="Account" />
              <StepPill active={step === 2} label="Consent" />
            </div>
          </div>

          <section className="rounded-[1.75rem] border border-white/10 bg-[#0b0b0b]/90 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="border-b border-white/10 px-5 py-5">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-red-400">
                Step {step} of 2
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight">
                {step === 1 ? "Create Account" : "SMS Consent"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                {step === 1
                  ? "Set up your RoseOut login details."
                  : "Choose how RoseOut can contact you."}
              </p>
            </div>

            <form onSubmit={handleSignup} className="p-5">
              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-100">
                  {error}
                </div>
              )}

              {message && (
                <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-100">
                  {message}
                </div>
              )}

              {step === 1 && (
                <>
                  <Field
                    label="Full Name"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Your name"
                  />

                  <Field
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                  />

                  <Field
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Create password"
                  />

                  <PasswordStrength
                    score={passwordCheck.score}
                    strength={passwordStrength}
                    rules={passwordCheck.rules}
                    show={password.length > 0}
                  />

                  <Field
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm password"
                  />

                  {confirmPassword.length > 0 && (
                    <p
                      className={`mt-2 text-xs font-bold ${
                        password === confirmPassword
                          ? "text-emerald-400"
                          : "text-red-300"
                      }`}
                    >
                      {password === confirmPassword
                        ? "✓ Passwords match"
                        : "Passwords do not match"}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={nextStep}
                    className="mt-5 w-full rounded-full bg-red-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500"
                  >
                    Continue
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <Field
                    label="Mobile Number"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="516-555-1234"
                  />

                  <ConsentBox
                    checked={smsConsent}
                    onChange={setSmsConsent}
                    required={!!phone.trim()}
                  >
                    I agree to receive SMS messages from RoseOut about my
                    account, recommendations, booking updates, reminders, and
                    customer support. Message frequency varies. Message and data
                    rates may apply. Reply STOP to opt out and HELP for help.
                  </ConsentBox>

                  <ConsentBox
                    checked={marketingConsent}
                    onChange={setMarketingConsent}
                  >
                    I also agree to receive occasional RoseOut promotional
                    texts, offers, and featured outing ideas. Optional.
                  </ConsentBox>

                  <ConsentBox checked={termsConsent} onChange={setTermsConsent}>
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="font-bold text-red-300 hover:text-white"
                    >
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-bold text-red-300 hover:text-white"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </ConsentBox>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-3">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-white/35">
                      Verification
                    </p>

                    {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
                      <Turnstile
                        ref={turnstileRef}
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                        options={{
                          theme: "dark",
                          size: "compact",
                        }}
                        onSuccess={(token) => setTurnstileToken(token)}
                        onExpire={() => setTurnstileToken("")}
                        onError={() => {
                          setTurnstileToken("");
                          setError("Verification failed. Please try again.");
                        }}
                      />
                    ) : (
                      <p className="text-sm font-bold text-red-200">
                        Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY.
                      </p>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-white/40">
                    Consent is not a condition of purchase. You can opt out any
                    time by replying STOP. For help, reply HELP.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-full border border-white/15 px-5 py-3.5 text-sm font-black text-white transition hover:bg-white hover:text-black"
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !turnstileToken}
                      className="rounded-full bg-red-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Creating..." : "Create Account"}
                    </button>
                  </div>
                </>
              )}

              <p className="mt-5 text-center text-sm font-bold text-white/45">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-red-300 transition hover:text-white"
                >
                  Log in
                </Link>
              </p>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="mt-4">
      <label className="block text-xs font-black uppercase tracking-[0.16em] text-white/60">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-red-500"
      />
    </div>
  );
}

function PasswordStrength({
  score,
  strength,
  rules,
  show,
}: {
  score: number;
  strength: { label: string; width: string; color: string };
  rules: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
  show: boolean;
}) {
  if (!show) return null;

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
          Password Strength
        </p>

        <p
          className={`text-xs font-black ${
            score <= 1
              ? "text-red-400"
              : score === 2
                ? "text-orange-400"
                : score === 3
                  ? "text-yellow-400"
                  : score === 4
                    ? "text-lime-400"
                    : "text-emerald-400"
          }`}
        >
          {strength.label}
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${strength.color} transition-all duration-500 ease-out`}
          style={{ width: strength.width }}
        />
      </div>

      <div className="mt-3 grid gap-1 text-xs sm:grid-cols-2">
        <PasswordRule valid={rules.length} label="8+ characters" />
        <PasswordRule valid={rules.uppercase} label="Uppercase letter" />
        <PasswordRule valid={rules.lowercase} label="Lowercase letter" />
        <PasswordRule valid={rules.number} label="Number" />
        <PasswordRule valid={rules.special} label="Special character" />
      </div>
    </div>
  );
}

function PasswordRule({ valid, label }: { valid: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2 font-bold ${
        valid ? "text-emerald-400" : "text-white/35"
      }`}
    >
      <span>{valid ? "✓" : "•"}</span>
      <span>{label}</span>
    </div>
  );
}

function ConsentBox({
  checked,
  onChange,
  children,
  required = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
      <label className="flex gap-3 text-xs leading-5 text-white/65">
        <input
          type="checkbox"
          checked={checked}
          required={required}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 accent-red-600"
        />
        <span>{children}</span>
      </label>
    </div>
  );
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${
        active
          ? "bg-red-600 text-white shadow-lg shadow-red-950/40"
          : "border border-white/10 bg-white/[0.04] text-white/35"
      }`}
    >
      {label}
    </div>
  );
}