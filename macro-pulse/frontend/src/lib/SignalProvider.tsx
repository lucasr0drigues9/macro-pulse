"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiUrl } from "@/lib/api";

// ── Types ──

type RegimeData = { regime: string; periodStart?: string; overweight?: unknown[] };
type LiquidityData = {
  latest: { date: string; netLiquidity: number; fedBalanceSheet: number; tga: number; rrp: number };
  changes: { oneMonth: number | null; threeMonth: number | null; twelveMonth: number | null };
  trend: "expanding" | "contracting" | "flat";
  peak: { date: string; value: number };
  trough: { date: string; value: number };
  pctFromPeak: number;
  sparkline: { date: string; value: number }[];
};
type YieldData = {
  latest: { date: string; tenYear: number; curve: number };
  changes: { oneMonthBps: number | null; threeMonthBps: number | null; twelveMonthBps: number | null; curveThreeMonthBps: number | null };
  trend: "rising" | "falling" | "flat";
  curveRegime: "steep" | "normal" | "flat" | "inverted";
  sparkline: { date: string; value: number }[];
};
type OilData = {
  latest: { date: string; brent: number; wti: number | null };
  changes: { oneMonth: number | null; threeMonth: number | null; twelveMonth: number | null };
  trend: "rising" | "falling" | "flat";
  sparkline: { date: string; value: number }[];
};
type InternalSignal = {
  name: string; value: number; change1m: number | null; change3m: number | null;
  trend: "rising" | "falling" | "flat"; signal: "risk-on" | "risk-off" | "neutral";
  alignment: "agrees" | "disagrees" | "neutral";
};
type InternalsData = {
  regime: string; regimeType: "risk-on" | "risk-off";
  internals: InternalSignal[]; confirmationScore: number; contradictionScore: number; total: number;
};

export type SignalState = {
  us: RegimeData | null;
  eu: RegimeData | null;
  cn: RegimeData | null;
  liquidity: LiquidityData | null;
  yields: YieldData | null;
  oil: OilData | null;
  internals: InternalsData | null;
  loaded: boolean;
};

const SignalContext = createContext<SignalState>({
  us: null, eu: null, cn: null, liquidity: null, yields: null, oil: null, internals: null, loaded: false,
});

export function useSignals() {
  return useContext(SignalContext);
}

export function SignalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SignalState>({
    us: null, eu: null, cn: null, liquidity: null, yields: null, oil: null, internals: null, loaded: false,
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      const results = await Promise.allSettled([
        fetch(apiUrl("/api/allocation")).then((r) => r.json()),
        fetch(apiUrl("/api/eu/allocation")).then((r) => r.json()),
        fetch(apiUrl("/api/china/allocation")).then((r) => r.json()),
        fetch("/api/liquidity").then((r) => r.json()),
        fetch("/api/yields").then((r) => r.json()),
        fetch(apiUrl("/api/oil")).then((r) => r.json()),
        fetch(apiUrl("/api/internals")).then((r) => r.json()),
      ]);

      if (!mounted) return;

      const val = (i: number) => {
        const r = results[i];
        if (r.status === "fulfilled" && !r.value?.error) return r.value;
        return null;
      };

      setState({
        us: val(0), eu: val(1), cn: val(2),
        liquidity: val(3), yields: val(4), oil: val(5), internals: val(6),
        loaded: true,
      });
    }

    load();
    return () => { mounted = false; };
  }, []);

  return <SignalContext.Provider value={state}>{children}</SignalContext.Provider>;
}
