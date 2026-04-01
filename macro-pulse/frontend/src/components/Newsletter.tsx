"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/api";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch(apiUrl("/api/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, weeklyPulse: true }),
      });
    } catch {}
    setSubmitted(true);
  };

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <div className="p-6 rounded-lg bg-[#111] border border-[#222] text-center">
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">The Weekly Macro Pulse</h2>
        <p className="text-sm text-[#888] mb-6 max-w-lg mx-auto">
          Every Tuesday — the full regime update, this week&apos;s key releases, live trigger status,
          and current allocation. Written by the tool, edited for humans.
        </p>

        {submitted ? (
          <div className="py-4">
            <span className="text-[#22c55e] text-sm">Subscribed. First issue arrives next Tuesday.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#444] focus:outline-none text-center sm:text-left"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-[#222] hover:bg-[#333] text-sm text-[#e0e0e0] rounded transition-colors"
            >
              Send me the weekly pulse
            </button>
          </form>
        )}

        <button
          onClick={() => setShowPreview(!showPreview)}
          className="mt-4 text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          {showPreview ? "Hide preview" : "See what the email looks like"}
        </button>

        {showPreview && (
          <div className="mt-4 p-4 rounded bg-[#0a0a0a] border border-[#181818] text-left text-xs text-[#888] max-w-md mx-auto">
            <div className="text-[#555] mb-2">Subject: Weekly Macro Pulse — April 1, 2026</div>
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
