"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  text: string;
};

type SectionChatProps = {
  /** What section/page this chat is about — passed to the AI as context. */
  context: string;
  /** Suggested questions shown as chips before the user asks anything. */
  suggestions?: string[];
  /** Optional label above the chat. Defaults to "Ask about this section". */
  label?: string;
};

/**
 * General-purpose AI chat widget for any section of the site.
 * Uses /api/chat/general which gives Claude the section context + web search.
 */
export default function SectionChat({ context, suggestions, label }: SectionChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput("");
    const updated = [...messages, { role: "user" as const, text: q }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/chat/general"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          context,
          history: updated.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer || data.error || "No response." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Network error — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-1.5 text-[10px] text-[#555] hover:text-[#888] transition-colors"
      >
        <span className="w-4 h-4 rounded-full border border-[#333] flex items-center justify-center text-[8px]">?</span>
        {label || "Ask about this section"}
      </button>
    );
  }

  return (
    <div className="mt-3 p-2 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] text-[#555] uppercase tracking-wider">
          {label || "Ask about this section"}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] text-[#333] hover:text-[#555]"
        >
          close
        </button>
      </div>

      {/* Suggestion chips */}
      {messages.length === 0 && suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestions.map((s) => (
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
                <div className="text-[#888] pl-2 border-l border-[#222]">{m.text}</div>
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-1.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
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
