"use client";

import { useEffect, useState } from "react";
import { calendarData as fallback } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";
import { subscribeEmail } from "@/lib/subscribe";

type Phase = "idle" | "submitting" | "awaiting_confirm" | "missing" | "error";
const SOURCE = "weekly_calendar";

type CalendarEvent = {
  name: string; source: string; date: string; day: string;
  impact: "High" | "Medium" | "Low"; implication: string;
  scenarios?: Record<string, string> | null;
};

const impactColors = {
  High: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
  Medium: { color: "#eab308", bg: "rgba(234, 179, 8, 0.15)" },
  Low: { color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)" },
};

export default function WeeklyCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(fallback);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || phase === "submitting") return;
    setPhase("submitting");
    setErrorMessage("");
    const result = await subscribeEmail({ email, source: SOURCE, eventAlerts: true });
    if (result.ok) {
      setPhase("awaiting_confirm");
    } else {
      setErrorMessage(result.message);
      setPhase("error");
    }
  };

  const handleMissing = () => setPhase("missing");

  useEffect(() => {
    fetch(apiUrl("/api/calendar"))
      .then((r) => r.json())
      .then((d) => {
        if (d.events?.length) setEvents(d.events);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="px-4 py-12 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">Upcoming — What to Watch</h2>
      <p className="text-xs text-[#555] mb-6">Next economic releases with regime implications · Updated daily</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => {
          const impact = impactColors[event.impact] || impactColors.Low;
          const isExpanded = expanded === event.name;
          const hasScenarios = event.scenarios && Object.values(event.scenarios).some(Boolean);

          return (
            <div
              key={event.name}
              className="p-4 rounded-lg bg-[#111] border border-[#222] hover:border-[#333] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold text-[#e0e0e0] leading-tight">{event.name}</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded ml-2 shrink-0"
                  style={{ color: impact.color, backgroundColor: impact.bg }}
                >
                  {event.impact}
                </span>
              </div>
              <div className="text-xs text-[#555] mb-2">
                {event.day}, {event.date} · {event.source}
              </div>
              <p className="text-xs text-[#888] leading-relaxed">{event.implication}</p>

              {hasScenarios && (
                <>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : event.name)}
                    className="text-xs text-[#555] hover:text-[#888] mt-2 transition-colors"
                  >
                    {isExpanded ? "Hide scenarios" : "View scenarios"}
                  </button>
                  {isExpanded && event.scenarios && (
                    <div className="mt-2 space-y-1 border-t border-[#181818] pt-2">
                      {Object.entries(event.scenarios).map(([key, val]) => (
                        val ? (
                          <div key={key} className="text-xs">
                            <span className="text-[#555] capitalize">{key}:</span>{" "}
                            <span className="text-[#888]">{val}</span>
                          </div>
                        ) : null
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Email signup */}
      <div className="mt-8 p-4 rounded-lg bg-[#111] border border-[#222] text-center">
        {(phase === "idle" || phase === "submitting" || phase === "error") && (
          <>
            <p className="text-sm text-[#e0e0e0] mb-1">Get notified after each event</p>
            <p className="text-xs text-[#555] mb-3">Plain English summary of what the data showed and whether your allocation needs to adjust.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
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
                {phase === "submitting" ? "Sending…" : "Notify me"}
              </button>
            </form>
            {phase === "error" && errorMessage && (
              <p className="text-xs text-[#ef4444] mt-2" role="alert">{errorMessage}</p>
            )}
          </>
        )}

        {phase === "awaiting_confirm" && (
          <div className="max-w-md mx-auto py-2">
            <p className="text-sm text-[#22c55e] mb-2">You&apos;re subscribed.</p>
            <p className="text-xs text-[#888] mb-3 leading-relaxed">
              We just sent a welcome email to <b className="text-[#e0e0e0]">{email}</b> from{" "}
              <span className="text-[#e0e0e0]">hello@worldorderview.com</span>. Open it and click
              the <b className="text-[#22c55e]">&quot;Confirm I got this email ✓&quot;</b> button.
            </p>
            <button type="button" onClick={handleMissing} className="text-xs text-[#555] hover:text-[#888] underline underline-offset-2 transition-colors">Didn&apos;t arrive?</button>
          </div>
        )}

        {phase === "missing" && (
          <div className="max-w-md mx-auto py-2 text-left">
            <p className="text-sm text-[#eab308] mb-2 text-center">Can&apos;t find it?</p>
            <ul className="text-xs text-[#888] space-y-1.5 list-disc list-inside">
              <li>Check spam / promotions for &quot;Welcome to World Order View&quot;</li>
              <li>Add <b className="text-[#e0e0e0]">hello@worldorderview.com</b> to your contacts</li>
              <li>Still nothing? Email us directly at the same address</li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
