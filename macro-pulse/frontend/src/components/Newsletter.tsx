"use client";

import { useState } from "react";
import { subscribeEmail } from "@/lib/subscribe";

type Phase = "idle" | "submitting" | "awaiting_confirm" | "missing" | "error";

const SOURCE = "home_weekly_pulse";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || phase === "submitting") return;
    setPhase("submitting");
    setErrorMessage("");
    const result = await subscribeEmail({ email, source: SOURCE, weeklyPulse: true });
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
      <div className="p-6 rounded-lg bg-[#111] border border-[#222] text-center">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Weekly World Order View</h2>
        <p className="text-sm text-[#888] mb-6 max-w-lg mx-auto">
          Every Tuesday — the full regime update, this week&apos;s key releases, live trigger status,
          and current allocation. Written by the tool, edited for humans.
        </p>

        {(phase === "idle" || phase === "submitting" || phase === "error") && (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={phase === "submitting"}
                className="flex-1 bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#444] focus:outline-none text-center sm:text-left disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={phase === "submitting"}
                className="px-6 py-2 bg-[#222] hover:bg-[#333] text-sm text-[#e0e0e0] rounded transition-colors disabled:opacity-50"
              >
                {phase === "submitting" ? "Sending…" : "Send me the weekly briefing"}
              </button>
            </form>
            {phase === "error" && errorMessage && (
              <p className="mt-3 text-xs text-[#ef4444]" role="alert">{errorMessage}</p>
            )}
          </>
        )}

        {phase === "awaiting_confirm" && (
          <div className="max-w-md mx-auto py-2">
            <p className="text-sm text-[#22c55e] mb-2">You&apos;re subscribed.</p>
            <p className="text-xs text-[#888] mb-3 leading-relaxed">
              We just sent a welcome email to <b className="text-[#e0e0e0]">{email}</b> from{" "}
              <span className="text-[#e0e0e0]">alerts@macro-pulse.io</span>. Open it and click
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
              <li>Add <b className="text-[#e0e0e0]">alerts@macro-pulse.io</b> to your contacts so future alerts land in your inbox</li>
              <li>Still nothing after 5 minutes? Email <b className="text-[#e0e0e0]">alerts@macro-pulse.io</b> directly and we&apos;ll sort it out</li>
            </ul>
            <p className="text-[10px] text-[#555] text-center">
              You&apos;re still subscribed — first briefing lands next Tuesday morning either way.
            </p>
          </div>
        )}

        <button
          onClick={() => setShowPreview(!showPreview)}
          className="mt-4 text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          {showPreview ? "Hide preview" : "See what the email looks like"}
        </button>

        {showPreview && (
          <div className="mt-4 p-4 rounded bg-[#0a0a0a] border border-[#181818] text-left text-xs text-[#888] max-w-md mx-auto">
            <div className="text-[#555] mb-2">Subject: Weekly World Order View — April 1, 2026</div>
            <div className="space-y-2 leading-relaxed">
              <p className="font-bold text-[#e0e0e0]">Current Regime: Stagflation (4th month)</p>
              <p>FRED says Reflation. Geopolitical says Stagflation. We go with geo — it&apos;s more current.</p>
              <p className="font-bold text-[#e0e0e0] mt-3">This Week</p>
              <p>• ISM Manufacturing PMI (Tue) — below 50 confirms contraction</p>
              <p>• CPI March (Thu Apr 10) — energy component will dominate</p>
              <p className="font-bold text-[#e0e0e0] mt-3">Triggers</p>
              <p>• Hormuz transits: 6/day (watch)</p>
              <p>• WTI crude: $109.60 (watch — $120 lock-in level)</p>
              <p className="font-bold text-[#e0e0e0] mt-3">Allocation</p>
              <p>XLE 30% · GLD 20% · DBC 20% · XLP 15% · XLU 15%</p>
              <p className="text-[#555] mt-3 italic">What would change this: Brent below $85 for two weeks → rotate to growth.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
