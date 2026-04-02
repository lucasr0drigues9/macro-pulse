"use client";

import { useMode, MODE_CONFIG, type Mode } from "@/lib/mode";

const modes: Mode[] = ["conservative", "active", "aggressive"];

export default function ModeSelector() {
  const { mode, setMode } = useMode();

  return (
    <section className="px-4 pb-6 max-w-5xl mx-auto">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-[#555] uppercase tracking-wider">Approach</span>
        <div className="flex rounded-lg border border-[#222] overflow-hidden">
          {modes.map((m) => {
            const config = MODE_CONFIG[m];
            const isActive = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-4 sm:px-6 py-2 transition-colors text-center"
                style={{
                  backgroundColor: isActive ? config.color + "20" : "transparent",
                  borderRight: m !== "aggressive" ? "1px solid #222" : undefined,
                }}
              >
                <div
                  className="text-sm font-bold"
                  style={{ color: isActive ? config.color : "#555" }}
                >
                  {config.label}
                </div>
                <div className="text-xs text-[#555] hidden sm:block">{config.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
