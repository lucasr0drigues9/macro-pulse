"use client";

import { useEffect, useState } from "react";
import { triggersData as fallback } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";

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
  const [submitted, setSubmitted] = useState(false);

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
    if (!email) return;
    try {
      await fetch(apiUrl("/api/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, eventAlerts, regimeAlerts, weeklyPulse }),
      });
    } catch {}
    setSubmitted(true);
  };

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

        {submitted ? (
          <div className="text-center py-4">
            <span className="text-[#22c55e] text-sm">You&apos;re in. We&apos;ll only email when it matters.</span>
          </div>
        ) : (
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
                className="flex-1 bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#444] focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-[#222] hover:bg-[#333] text-sm text-[#e0e0e0] rounded transition-colors"
              >
                Notify me
              </button>
            </div>

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
      </div>
    </section>
  );
}
