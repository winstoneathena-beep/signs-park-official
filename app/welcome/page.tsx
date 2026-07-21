"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Pencil,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Lock,
  User,
  Mail,
  KeyRound,
  LogOut,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { setRolePref, signOut, type Role } from "@/lib/orders";
import { useAuth, signInWithPassword, signUpWithPassword } from "@/lib/auth";
import { isApprover, isParkwellDomain } from "@/lib/approvers";
import { cn } from "@/lib/utils";

const ROLES: {
  id: Role;
  title: string;
  blurb: string;
  can: string[];
  cant?: string[];
  Icon: React.ElementType;
}[] = [
  {
    id: "requester",
    title: "I'm a Requester",
    blurb:
      "Location managers and ops staff who order signs for their lots. You'll spend most of your time creating signs.",
    Icon: Pencil,
    can: [
      "Browse the full sign library",
      "Customize editable fields and download proofs",
      "Submit orders for approval",
      "Track every order you've sent",
    ],
    cant: ["Approve, reject, or mark orders as ordered"],
  },
  {
    id: "approver",
    title: "I'm an Approver",
    blurb:
      "Senior leadership who reviews and clears sign orders for vendor handoff. You can do everything a requester can — plus close the loop.",
    Icon: ShieldCheck,
    can: [
      "Everything a requester can do",
      "Review the approval queue and approve or request revisions",
      "Edit a pending sign in place before approving",
      "Mark an approved order as ordered once the vendor confirms",
    ],
  },
];

/** Lightweight email check — not RFC-perfect, just sane: x@y.z */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Mode = "signin" | "signup";

export default function WelcomePage() {
  const router = useRouter();
  const auth = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const signedIn = auth.status === "signed-in";
  const verifiedEmail = signedIn ? auth.user.email : "";

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const nameOk = mode === "signin" || trimmedName.length >= 2;
  const emailShapeOk = EMAIL_RE.test(trimmedEmail);
  const domainOk = isParkwellDomain(trimmedEmail);
  const emailOk = emailShapeOk && domainOk;
  const passwordOk = password.length >= 8;
  const formOk = nameOk && emailOk && passwordOk;

  // Approver access requires the VERIFIED (signed-in) email to be on the
  // allowlist — the typed email proves nothing until Supabase accepts it.
  const approverEligible = signedIn && isApprover(verifiedEmail);
  const canProceed = signedIn;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!formOk || pending) return;
    setPending(true);
    setAuthError(null);
    const error =
      mode === "signup"
        ? await signUpWithPassword(trimmedName, trimmedEmail, password)
        : await signInWithPassword(trimmedEmail, password);
    setPending(false);
    if (error) setAuthError(error);
    // Success needs no navigation — the auth store flips to signed-in and
    // this page re-renders into the role-pick state.
  };

  const pick = (role: Role) => {
    if (!canProceed) {
      setAttempted(true);
      return;
    }
    // Hard guard: an Approver pick from a non-listed email gets silently
    // demoted. UI already hides the chip, but this is the seatbelt.
    const safeRole: Role =
      role === "approver" && !approverEligible ? "requester" : role;
    setRolePref(safeRole);
    router.replace("/");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 bg-grid-soft opacity-50" aria-hidden />
      <div
        className="absolute -top-40 -right-40 w-[40rem] h-[40rem] rounded-full blur-[140px]"
        style={{
          background: "radial-gradient(circle, #19B2EC55, transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className="absolute -bottom-40 -left-40 w-[40rem] h-[40rem] rounded-full blur-[140px]"
        style={{
          background: "radial-gradient(circle, #19B2EC33, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-24">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
          <Logo tone="white" className="w-32" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">
            <Lock className="h-3 w-3" />
            Internal — Parkwell only
          </span>
          <h1 className="mt-6 text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight">
            Welcome.
            <br />
            Sign in to continue.
          </h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-white/70">
            Every sign order is tied to a verified Parkwell account — for
            approval routing, order history, and accountability. Sign in with
            your work email, then pick the role that matches what you&rsquo;re
            here to do today.
          </p>
        </motion.div>

        {/* Step 1 — real authentication */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-5 md:p-6"
        >
          {signedIn ? (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45 mb-4">
                Step 1 — Signed in
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-parkwell-green/15 text-parkwell-green ring-1 ring-parkwell-green/30">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">
                      {auth.user.name || auth.user.email}
                    </div>
                    <div className="text-xs text-white/55">
                      {auth.user.email}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-4 text-xs font-medium text-white/70 hover:text-white hover:border-white/30 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Not you? Sign out
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
                  Step 1 —{" "}
                  {mode === "signup" ? "Create your account" : "Sign in"}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signup" ? "signin" : "signup");
                    setAuthError(null);
                    setAttempted(false);
                  }}
                  className="text-[11px] font-medium text-parkwell-blue hover:underline"
                >
                  {mode === "signup"
                    ? "Already have an account? Sign in"
                    : "First time here? Create your account"}
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {mode === "signup" && (
                  <FieldOnDark
                    icon={User}
                    label="Full name"
                    placeholder="e.g. Andre Gurule"
                    value={name}
                    onChange={setName}
                    showError={attempted && !nameOk}
                    errorText="Please enter your full name."
                    autoComplete="name"
                  />
                )}
                <FieldOnDark
                  icon={Mail}
                  label="Work email"
                  placeholder="e.g. andre@goparkwell.com"
                  value={email}
                  onChange={setEmail}
                  showError={attempted && !emailOk}
                  errorText={
                    !emailShapeOk
                      ? "Please enter a valid work email."
                      : "Use your @goparkwell.com email — this site is internal to Parkwell."
                  }
                  type="email"
                  autoComplete="email"
                />
                <FieldOnDark
                  icon={KeyRound}
                  label="Password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={setPassword}
                  showError={attempted && !passwordOk}
                  errorText="Password must be at least 8 characters."
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                />
              </div>
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={pending}
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-parkwell-blue px-6 text-sm font-semibold text-white transition-colors",
                    pending
                      ? "opacity-60 cursor-wait"
                      : "hover:bg-parkwell-blue/90",
                  )}
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === "signup" ? "Create account" : "Sign in"}
                </button>
                {authError && (
                  <span className="text-sm text-parkwell-red">{authError}</span>
                )}
              </div>
            </form>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45"
        >
          Step 2 — Pick your role
        </motion.div>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {ROLES.filter(
            (r) =>
              // Hide Approver entirely unless the signed-in email is on the
              // allowlist. Before sign-in both cards render (discovery
              // state); once we know who you are, the chip is truth.
              r.id !== "approver" || !signedIn || approverEligible,
          ).map((r, i) => {
            const disabled = !canProceed;
            return (
              <motion.button
                key={r.id}
                type="button"
                onClick={() => pick(r.id)}
                aria-disabled={disabled}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.12 + i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={disabled ? undefined : { y: -4 }}
                className={cn(
                  "group relative text-left rounded-3xl p-7 md:p-9 border transition-colors",
                  "bg-white/5 backdrop-blur border-white/10",
                  disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-parkwell-blue/60 hover:bg-white/[0.07] cursor-pointer",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-parkwell-blue/15 text-parkwell-blue ring-1 ring-parkwell-blue/30">
                    <r.Icon className="h-6 w-6" />
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center justify-center h-10 w-10 rounded-full border border-white/15 transition-colors",
                      !disabled &&
                        "group-hover:border-parkwell-blue group-hover:bg-parkwell-blue group-hover:text-white",
                    )}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>

                <h2 className="mt-6 text-2xl md:text-3xl font-bold tracking-tight">
                  {r.title}
                </h2>
                <p className="mt-3 text-sm md:text-base text-white/65 leading-relaxed">
                  {r.blurb}
                </p>

                <div className="mt-7 pt-5 border-t border-white/10 space-y-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                    What you can do
                  </div>
                  <ul className="space-y-2">
                    {r.can.map((c) => (
                      <li
                        key={c}
                        className="flex items-start gap-2 text-sm text-white/85"
                      >
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-parkwell-green" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                  {r.cant && r.cant.length > 0 && (
                    <ul className="pt-2 space-y-2">
                      {r.cant.map((c) => (
                        <li
                          key={c}
                          className="flex items-start gap-2 text-sm text-white/45"
                        >
                          <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-1 rounded-b-3xl bg-gradient-to-r from-parkwell-blue to-parkwell-green transition-opacity",
                    disabled
                      ? "opacity-0"
                      : "opacity-0 group-hover:opacity-100",
                  )}
                  aria-hidden
                />
              </motion.button>
            );
          })}
        </div>

        {attempted && !canProceed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-sm text-parkwell-red text-center"
          >
            Sign in before picking a role.
          </motion.p>
        )}

        {signedIn && !approverEligible && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center text-xs text-white/50"
          >
            Approver access is granted by an administrator. If you need approval
            rights, ask your manager.
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-10 text-center text-xs text-white/40"
        >
          One Parkwell login, shared across internal tools. Accounts are
          invite-only — ask an admin if you can&rsquo;t sign up.
        </motion.p>
      </div>
    </div>
  );
}

/* ----- Dark-themed text field for the welcome page ----- */

function FieldOnDark({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  showError,
  errorText,
  type = "text",
  autoComplete,
}: {
  icon: React.ElementType;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  showError?: boolean;
  errorText?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
        {label}
      </span>
      <div className="mt-1.5 relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            "w-full h-11 rounded-full bg-white/5 border pl-10 pr-4 text-sm text-white",
            "placeholder:text-white/35 placeholder:font-normal placeholder:italic",
            "focus:outline-none focus:ring-2 focus:ring-parkwell-blue/60 focus:border-parkwell-blue/60",
            "transition-colors",
            showError
              ? "border-parkwell-red/60"
              : "border-white/15 hover:border-white/25",
          )}
        />
      </div>
      {showError && errorText && (
        <span className="mt-1.5 block text-[11px] text-parkwell-red">
          {errorText}
        </span>
      )}
    </label>
  );
}
