"use client";

import { useEffect, useState } from "react";
import { calendarData as fallback } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";

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
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch(apiUrl("/api/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, eventAlerts: true }),
      });
    } catch {}
    setSubmitted(true);
  };

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
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">This Week — What to Watch</h2>
      <p className="text-xs text-[#555] mb-6">Upcoming economic releases with regime implications</p>

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
        {submitted ? (
          <p className="text-sm text-[#22c55e]">You&apos;re in. We&apos;ll notify you after each release.</p>
        ) : (
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
                className="flex-1 bg-[#0a0a0a] border border-[#222] rounded px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#444] focus:outline-none text-center sm:text-left"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-[#222] hover:bg-[#333] text-sm text-[#e0e0e0] rounded transition-colors"
              >
                Notify me
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
