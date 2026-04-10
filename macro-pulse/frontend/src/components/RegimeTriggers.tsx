"use client";

import { useEffect, useState } from "react";
import { triggersData as fallback } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";
import { subscribeEmail, confirmReceipt } from "@/lib/subscribe";

type Phase = "idle" | "submitting" | "awaiting_confirm" | "confirmed" | "missing" | "error";
const SOURCE = "regime_triggers";

type Trigger = {
  name: string; current: string; threshold: string;
  status: "crisis" | "watch" | "stable"; action: string; urgency: string;
};

const statusConfig = {
  crisis: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", label: "CRISIS" },
  watch: { color: "#eab308", bg: "rgba(234, 179, 8, 0.15)", label: "WATCH" },
  stable: { color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)", label: "STABLE" },
};

export default function RegimeTriggers() {
  const [triggers, setTriggers] = useState<Trigger[]>(fallback);
  const [email, setEmail] = useState("");
  const [eventAlerts, setEventAlerts] = useState(true);
  const [regimeAlerts, setRegimeAlerts] = useState(true);
  const [weeklyPulse, setWeeklyPulse] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch(apiUrl("/api/triggers"))
      .then((r) => r.json())
      .then((d) => {
        if (d.triggers?.length) setTriggers(d.triggers);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || phase === "submitting") return;
    setPhase("submitting");
    setErrorMessage("");
    const result = await subscribeEmail({
      email, source: SOURCE, eventAlerts, regimeAlerts, weeklyPulse,
    });
    if (result.ok) {
      setPhase("awaiting_confirm");
    } else {
      setErrorMessage(result.message);
      setPhase("error");
    }
  };

  const handleGotIt = () => {
    setPhase("confirmed");
    confirmReceipt(email, SOURCE);
  };
  const handleMissing = () => setPhase("missing");

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Regime Change Triggers</h2>
      <p className="text-xs text-[#555] mb-6">Live thresholds that would shift the current regime signal</p>

      <div className="space-y-3">
        {triggers.map((trigger) => {
          const status = statusConfig[trigger.status] || statusConfig.stable;
          return (
            <div
              key={trigger.name}
              className="p-4 rounded-lg bg-[#111] border border-[#222] flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-[#e0e0e0]">{trigger.name}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ color: status.color, backgroundColor: status.bg }}
                  >
                    {status.label}
                  </span>
                  <span className="text-xs text-[#333]">{trigger.urgency}</span>
                </div>
                <div className="text-xs text-[#888]">
                  Current: <span className="text-[#e0e0e0]">{trigger.current}</span>
                </div>
                <div className="text-xs text-[#555] mt-0.5">
                  Threshold: {trigger.threshold}
                </div>
              </div>
              <div className="text-xs text-[#555] sm:text-right sm:max-w-[200px]">
                {trigger.action}
              </div>
            </div>
          );
        })}
      </div>

      {/* Email capture */}
      <div className="mt-10 p-6 rounded-lg bg-[#111] border border-[#222]">
        <h3 className="text-lg font-bold text-[#e0e0e0] mb-1">Get notified when something changes</h3>
        <p className="text-xs text-[#888] mb-4">We send two types of updates — choose what&apos;s useful for you:</p>

        {(phase === "idle" || phase === "submitting" || phase === "error") && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 text-sm text-[#e0e0e0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={eventAlerts}
                  onChange={(e) => setEventAlerts(e.target.checked)}
                  className="rounded"
                />
                <span>Event alerts</span>
                <span className="text-xs text-[#555]">— plain English summary after each economic release</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-[#e0e0e0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={regimeAlerts}
                  onChange={(e) => setRegimeAlerts(e.target.checked)}
                  className="rounded"
                />
                <span>Regime change alerts</span>
                <span className="text-xs text-[#555]">— immediately if a trigger fires or the regime shifts</span>
              </label>
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
                {phase === "submitting" ? "Sending…" : "Notify me"}
              </button>
            </div>

            {phase === "error" && errorMessage && (
              <p className="text-xs text-[#ef4444] mt-2" role="alert">{errorMessage}</p>
            )}

            <p className="text-xs text-[#333] mt-3">No spam. No weekly newsletters unless you want them. Only signal, no noise.</p>

            <label className="flex items-center gap-2 text-xs text-[#555] mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={weeklyPulse}
                onChange={(e) => setWeeklyPulse(e.target.checked)}
                className="rounded"
              />
              Also send me the Weekly Macro Pulse every Tuesday
            </label>
          </form>
        )}

        {phase === "awaiting_confirm" && (
          <div className="text-center py-2">
            <p className="text-sm text-[#22c55e] mb-2">You&apos;re subscribed.</p>
            <p className="text-xs text-[#888] mb-4 leading-relaxed max-w-md mx-auto">
              We just sent a welcome email to <b className="text-[#e0e0e0]">{email}</b> from{" "}
              <span className="text-[#e0e0e0]">alerts@macro-pulse.io</span>. It should arrive within a minute.
              Once it lands, click below so we know our delivery pipeline is working.
            </p>
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={handleGotIt} className="px-4 py-2 rounded text-sm text-[#0a0a0a] bg-[#22c55e] hover:opacity-90 transition-opacity font-bold">Got it ✓</button>
              <button type="button" onClick={handleMissing} className="px-4 py-2 rounded text-sm text-[#888] bg-[#1a1a1a] border border-[#222] hover:bg-[#222] transition-colors">Didn&apos;t arrive</button>
            </div>
          </div>
        )}

        {phase === "confirmed" && (
          <div className="text-center py-2">
            <p className="text-sm text-[#22c55e] mb-1">Thanks — you&apos;re all set.</p>
            <p className="text-xs text-[#555]">We&apos;ll only email when it matters.</p>
          </div>
        )}

        {phase === "missing" && (
          <div className="max-w-md mx-auto py-2 text-left">
            <p className="text-sm text-[#eab308] mb-2 text-center">Can&apos;t find it?</p>
            <ul className="text-xs text-[#888] space-y-1.5 mb-3 list-disc list-inside">
              <li>Check your spam / promotions folder for &quot;Welcome to Macro Pulse&quot;</li>
              <li>Add <b className="text-[#e0e0e0]">alerts@macro-pulse.io</b> to your contacts</li>
              <li>Still nothing after 5 minutes? Email <b className="text-[#e0e0e0]">alerts@macro-pulse.io</b> directly</li>
            </ul>
            <p className="text-[10px] text-[#555] text-center">You&apos;re still subscribed — we&apos;ll send the next update either way.</p>
          </div>
        )}
      </div>
    </section>
  );
}
