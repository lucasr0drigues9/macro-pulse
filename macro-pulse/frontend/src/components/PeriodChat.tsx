"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/api";

type PeriodContext = {
  region: "US" | "EU";
  start: string;
  end: string;
  regime: string;
  aiRegime?: string;
  bestRegime?: string;
  allRegimeReturns?: Record<string, number | null>;
  periodAnalysis?: {
    event: string;
    why_data: string;
    why_ai: string;
    winner_dynamic: string;
  } | null;
};

type Message = {
  role: "user" | "assistant";
  text: string;
};

const SUGGESTIONS = [
  "What was the key event that drove this period?",
  "Why didn't the other baskets perform?",
  "What would have been the early warning sign?",
];

export default function PeriodChat({ context }: { context: PeriodContext }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/chat/period"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context }),
      });
      const data = await res.json();
      const answer = data.answer || data.error || "No response.";
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Network error — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div className="mt-3 p-2 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
      <div className="text-[9px] text-[#555] uppercase tracking-wider mb-2">
        Ask about this period
      </div>

      {/* Suggestion chips — hide once user has asked something */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="text-[10px] px-2 py-1 rounded bg-[#111] border border-[#222] text-[#888] hover:text-[#e0e0e0] hover:border-[#444] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-2 mb-2 max-h-[300px] overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className="text-[10px] leading-relaxed">
              {m.role === "user" ? (
                <div className="text-[#e0e0e0]">
                  <span className="text-[#555]">You:</span> {m.text}
                </div>
              ) : (
                <div className="text-[#888] pl-2 border-l border-[#222]">
                  {m.text}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="text-[10px] text-[#555] pl-2 border-l border-[#222] animate-pulse">
              Thinking...
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this period..."
          disabled={loading}
          className="flex-1 px-2 py-1 rounded bg-[#111] border border-[#222] text-[10px] text-[#e0e0e0] placeholder-[#333] focus:border-[#444] outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-2 py-1 rounded bg-[#222] text-[10px] text-[#888] hover:text-[#e0e0e0] transition-colors disabled:opacity-30"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
