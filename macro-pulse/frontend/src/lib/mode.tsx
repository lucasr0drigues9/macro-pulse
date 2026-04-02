"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Mode = "conservative" | "active" | "aggressive";

export const MODE_CONFIG = {
  conservative: {
    label: "Conservative",
    description: "Wait for confirmation",
    confirmationMonths: 2,
    earlyRotationPct: 0,
    cashPct: 25,
    color: "#3b82f6",
  },
  active: {
    label: "Active",
    description: "Act on strong signals",
    confirmationMonths: 1,
    earlyRotationPct: 10,
    cashPct: 15,
    color: "#eab308",
  },
  aggressive: {
    label: "Aggressive",
    description: "Move early, accept more risk",
    confirmationMonths: 0,
    earlyRotationPct: 25,
    cashPct: 5,
    color: "#ef4444",
  },
} as const;

const ModeContext = createContext<{
  mode: Mode;
  setMode: (m: Mode) => void;
}>({ mode: "active", setMode: () => {} });

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("active");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("macro-pulse-mode") as Mode | null;
    if (saved && saved in MODE_CONFIG) {
      setModeState(saved);
    }
    setLoaded(true);
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    localStorage.setItem("macro-pulse-mode", m);
  };

  if (!loaded) return null;

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
