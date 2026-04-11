"use client";

import { useState } from "react";
import { subscribeEmail } from "@/lib/subscribe";

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
          <p className="text-sm text-[#22c55e] mb-2">You&apos;re subscribed.</p>
          <p className="text-xs text-[#888] mb-3 leading-relaxed">
            We just sent a welcome email to <b className="text-[#e0e0e0]">{email}</b> from{" "}
            <span className="text-[#e0e0e0]">hello@worldorderview.com</span>. Open it and click
            the <b className="text-[#22c55e]">&quot;Confirm I got this email ✓&quot;</b> button
            so we know our delivery pipeline is working.
          </p>
          <button
            type="button"
            onClick={handleMissing}
            className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2 transition-colors"
          >
            Didn&apos;t arrive?
          </button>
        </div>
      )}

      {phase === "missing" && (
        <div className="max-w-md mx-auto py-2 text-left">
          <p className="text-sm text-[#eab308] mb-2 text-center">Can&apos;t find it?</p>
          <ul className="text-xs text-[#888] space-y-1.5 mb-3 list-disc list-inside">
            <li>Check your spam / promotions folder for &quot;Welcome to World Order View&quot;</li>
            <li>Add <b className="text-[#e0e0e0]">hello@worldorderview.com</b> to your contacts so future alerts land in your inbox</li>
            <li>Still nothing after 5 minutes? Email <b className="text-[#e0e0e0]">hello@worldorderview.com</b> directly and we&apos;ll sort it out</li>
          </ul>
          <p className="text-[10px] text-[#555] text-center">
            You&apos;re still subscribed — we&apos;ll send the next update either way.
          </p>
        </div>
      )}
    </div>
  );
}
