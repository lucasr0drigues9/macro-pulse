"use client";

import { useState } from "react";
import { subscribeEmail } from "@/lib/subscribe";

type SubscribeFormProps = {
  title: string;
  description: string;
  buttonLabel: string;
  /** Tag stored as a waitlist feature so we can segment subscribers later. */
  waitlistFeature: string;
  /** Optional accent colour for the submit button (hex). */
  accent?: string;
};

/**
 * Shared subscribe widget used across all tracker pages. Wraps a real <form>
 * with controlled inputs and uses the subscribeEmail helper, which never lies
 * about persistence — failures show a real error.
 */
export default function SubscribeForm({
  title,
  description,
  buttonLabel,
  waitlistFeature,
  accent,
}: SubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await subscribeEmail({
      email,
      regimeAlerts: true,
      waitlistFeatures: [waitlistFeature],
    });
    setSubmitting(false);
    if (result.ok) {
      setSuccess(result.message);
      setSubmitted(true);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-[#111] border border-[#222] text-center">
      <h2 className="text-lg font-bold text-[#e0e0e0] mb-2">{title}</h2>
      <p className="text-xs text-[#555] mb-4 max-w-md mx-auto">{description}</p>
      {submitted ? (
        <p className="text-sm text-[#22c55e] py-2">{success}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={submitting}
              className="flex-1 px-3 py-2 rounded bg-[#0a0a0a] border border-[#222] text-sm text-[#e0e0e0] placeholder-[#333] focus:border-[#555] outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded text-sm text-[#e0e0e0] hover:opacity-80 transition-opacity disabled:opacity-50"
              style={accent ? { backgroundColor: accent } : { backgroundColor: "#222" }}
            >
              {submitting ? "Sending…" : buttonLabel}
            </button>
          </div>
          {error && (
            <p className="text-xs text-[#ef4444] mt-3" role="alert">{error}</p>
          )}
        </form>
      )}
    </div>
  );
}
