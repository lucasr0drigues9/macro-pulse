"use client";

import { useState } from "react";
import SectionChat from "@/components/SectionChat";

type StrategicCard = {
  title: string;
  content: string;
  keyMetric: string;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  Unsustainable: "#ef4444",
  Elevated: "#ef4444",
  Declining: "#eab308",
  Accelerating: "#eab308",
  Pivoting: "#eab308",
  Mixed: "#eab308",
  Expanding: "#22c55e",
  Progressing: "#22c55e",
};

export default function WorldOrderPosition({
  title,
  subtitle,
  cards,
  chatContext,
  chatSuggestions,
  accent,
}: {
  title: string;
  subtitle: string;
  cards: StrategicCard[];
  chatContext: string;
  chatSuggestions: string[];
  accent?: string;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section className="px-4 py-8 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-[#e0e0e0] mb-1">{title}</h2>
      <p className="text-xs text-[#555] mb-6">{subtitle}</p>

      <div className="space-y-3">
        {cards.map((card, i) => {
          const isOpen = expanded === i;
          const statusColor = STATUS_COLORS[card.status] || "#888";
          return (
            <div key={card.title} className="rounded-lg bg-[#111] border border-[#222] overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-[#151515] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#e0e0e0]">{card.title}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: statusColor, backgroundColor: statusColor + "20" }}
                  >
                    {card.status}
                  </span>
                </div>
                <span className="text-[#555] text-sm">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-[#222]">
                  <p className="text-xs text-[#888] mt-3 leading-relaxed">{card.content}</p>
                  <div className="mt-3 text-xs">
                    <span className="text-[#555]">Key metric: </span>
                    <span className="font-bold" style={{ color: accent || "#e0e0e0" }}>
                      {card.keyMetric}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SectionChat
        context={chatContext}
        label="Ask about world order positioning"
        suggestions={chatSuggestions}
      />
    </section>
  );
}
