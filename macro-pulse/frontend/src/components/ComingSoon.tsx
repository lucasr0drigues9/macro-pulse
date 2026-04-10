"use client";

import { useState } from "react";
import { subscribeEmail } from "@/lib/subscribe";

type Phase = "idle" | "submitting" | "awaiting_confirm" | "missing" | "error";
const SOURCE = "coming_soon";

const features = [
  {
    title: "Portfolio X-ray",
    description: "Paste your current ETF holdings and see what macro bet you're actually making.",
    id: "xray",
  },
  {
    title: "Mobile Alerts",
    description: "Push notifications when a trigger fires — no need to check the site.",
    id: "mobile",
  },
  {
    title: "Multi-market Regimes",
    description: "See how Europe and Asia compare to the US regime signal.",
    id: "multimarket",
  },
];

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || phase === "submitting") return;
    setPhase("submitting");
    setErrorMessage("");
    const result = await subscribeEmail({
      email,
      source: SOURCE,
      waitlistFeatures: Array.from(selected),
    });
    if (result.ok) {
      setPhase("awaiting_confirm");
    } else {
      setErrorMessage(result.message);
      setPhase("error");
    }
  };

  const handleMissing = () => setPhase("missing");

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">What&apos;s Coming Next</h2>
      <p className="text-xs text-[#555] mb-6">Join the waitlist for early access</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {features.map((f) => (
          <div key={f.id} className="p-4 rounded-lg bg-[#111] border border-[#222]">
            <h3 className="text-sm font-bold text-[#e0e0e0] mb-1">{f.title}</h3>
            <p className="text-xs text-[#888]">{f.description}</p>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-lg bg-[#111] border border-[#222]">
        {(phase === "idle" || phase === "submitting" || phase === "error") && (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-wrap gap-3 mb-4">
              {features.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm text-[#e0e0e0] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(f.id)}
                    onChange={() => toggle(f.id)}
                    className="rounded"
                  />
                  {f.title}
                </label>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={phase === "submitting"}
                className="flex-1 bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#444] focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={phase === "submitting"}
                className="px-6 py-2 bg-[#222] hover:bg-[#333] text-sm text-[#e0e0e0] rounded transition-colors disabled:opacity-50"
              >
                {phase === "submitting" ? "Sending…" : "Join waitlist"}
              </button>
            </div>
            {phase === "error" && errorMessage && (
              <p className="text-xs text-[#ef4444] mt-2" role="alert">{errorMessage}</p>
            )}
          </form>
        )}

        {phase === "awaiting_confirm" && (
          <div className="text-center py-2">
            <p className="text-sm text-[#22c55e] mb-2">You&apos;re on the waitlist.</p>
            <p className="text-xs text-[#888] mb-3 leading-relaxed max-w-md mx-auto">
              We just sent a welcome email to <b className="text-[#e0e0e0]">{email}</b> from{" "}
              <span className="text-[#e0e0e0]">alerts@macro-pulse.io</span>. Open it and click
              the <b className="text-[#22c55e]">&quot;Confirm I got this email ✓&quot;</b> button.
            </p>
            <button type="button" onClick={handleMissing} className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2 transition-colors">Didn&apos;t arrive?</button>
          </div>
        )}

        {phase === "missing" && (
          <div className="max-w-md mx-auto py-2 text-left">
            <p className="text-sm text-[#eab308] mb-2 text-center">Can&apos;t find it?</p>
            <ul className="text-xs text-[#888] space-y-1.5 list-disc list-inside">
              <li>Check spam / promotions for &quot;Welcome to Macro Pulse&quot;</li>
              <li>Add <b className="text-[#e0e0e0]">alerts@macro-pulse.io</b> to your contacts</li>
              <li>Still nothing? Email us directly</li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
