"use client";

import { useState } from "react";
import { subscribeEmail, confirmReceipt } from "@/lib/subscribe";

type SubscribeFormProps = {
  title: string;
  description: string;
  buttonLabel: string;
  /** Identifies which form/page the user signed up from. Drives welcome email
   * copy and is logged when the user confirms receipt. */
  source: string;
  /** Tag stored as a waitlist feature so we can segment subscribers later. */
  waitlistFeature: string;
  /** Optional accent colour for the submit button (hex). */
  accent?: string;
};

type Phase =
  | "idle"
  | "submitting"
  | "awaiting_confirm"
  | "confirmed"
  | "missing"
  | "error";

/**
 * Shared subscribe widget used across all tracker pages. Wraps a real <form>
 * with controlled inputs and uses subscribeEmail() (which never lies about
 * persistence). After successful signup it asks the user to confirm they
 * received the welcome email — a lightweight deliverability health check.
 */
export default function SubscribeForm({
  title,
  description,
  buttonLabel,
  source,
  waitlistFeature,
  accent,
}: SubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || phase === "submitting") return;
    setPhase("submitting");
    setErrorMessage("");
    const result = await subscribeEmail({
      email,
      source,
      regimeAlerts: true,
      waitlistFeatures: [waitlistFeature],
    });
    if (result.ok) {
      setPhase("awaiting_confirm");
    } else {
      setErrorMessage(result.message);
      setPhase("error");
    }
  };

  const handleGotIt = async () => {
    setPhase("confirmed");
    confirmReceipt(email, source); // fire-and-forget
  };

  const handleMissing = () => {
    setPhase("missing");
  };

  const buttonStyle = accent
    ? { backgroundColor: accent }
    : { backgroundColor: "#222" };

  return (
    <div className="p-6 rounded-lg bg-[#111] border border-[#222] text-center">
      <h2 className="text-lg font-bold text-[#e0e0e0] mb-2">{title}</h2>
      <p className="text-xs text-[#555] mb-4 max-w-md mx-auto">{description}</p>

      {(phase === "idle" || phase === "submitting" || phase === "error") && (
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={phase === "submitting"}
              className="flex-1 px-3 py-2 rounded bg-[#0a0a0a] border border-[#222] text-sm text-[#e0e0e0] placeholder-[#333] focus:border-[#555] outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={phase === "submitting"}
              className="px-4 py-2 rounded text-sm text-[#e0e0e0] hover:opacity-80 transition-opacity disabled:opacity-50"
              style={buttonStyle}
            >
              {phase === "submitting" ? "Sending…" : buttonLabel}
            </button>
          </div>
          {phase === "error" && errorMessage && (
            <p className="text-xs text-[#ef4444] mt-3" role="alert">
              {errorMessage}
            </p>
          )}
        </form>
      )}

      {phase === "awaiting_confirm" && (
        <div className="max-w-md mx-auto py-2">
          <p className="text-sm text-[#22c55e] mb-2">
            You&apos;re subscribed.
          </p>
          <p className="text-xs text-[#888] mb-4 leading-relaxed">
            We just sent a welcome email to <b className="text-[#e0e0e0]">{email}</b> from{" "}
            <span className="text-[#e0e0e0]">alerts@macro-pulse.io</span>. It should arrive within a minute.
            Once it lands, click below so we know our delivery pipeline is working.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={handleGotIt}
              className="px-4 py-2 rounded text-sm text-[#0a0a0a] bg-[#22c55e] hover:opacity-90 transition-opacity font-bold"
            >
              Got it ✓
            </button>
            <button
              type="button"
              onClick={handleMissing}
              className="px-4 py-2 rounded text-sm text-[#888] bg-[#1a1a1a] border border-[#222] hover:bg-[#222] transition-colors"
            >
              Didn&apos;t arrive
            </button>
          </div>
        </div>
      )}

      {phase === "confirmed" && (
        <div className="py-2">
          <p className="text-sm text-[#22c55e] mb-1">Thanks — you&apos;re all set.</p>
          <p className="text-xs text-[#555]">
            Welcome to Macro Pulse. We&apos;ll be in touch when something matters.
          </p>
        </div>
      )}

      {phase === "missing" && (
        <div className="max-w-md mx-auto py-2 text-left">
          <p className="text-sm text-[#eab308] mb-2 text-center">Can&apos;t find it?</p>
          <ul className="text-xs text-[#888] space-y-1.5 mb-3 list-disc list-inside">
            <li>Check your spam / promotions folder for &quot;Welcome to Macro Pulse&quot;</li>
            <li>Add <b className="text-[#e0e0e0]">alerts@macro-pulse.io</b> to your contacts so future alerts land in your inbox</li>
            <li>Still nothing after 5 minutes? Email <b className="text-[#e0e0e0]">alerts@macro-pulse.io</b> directly and we&apos;ll sort it out</li>
          </ul>
          <p className="text-[10px] text-[#555] text-center">
            You&apos;re still subscribed — we&apos;ll send the next update either way.
          </p>
        </div>
      )}
    </div>
  );
}
