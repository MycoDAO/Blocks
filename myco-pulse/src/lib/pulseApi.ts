/**
 * Pulse SPA → MYCODAO Next.js API routes (same origin: /api/*).
 * No Gemini, no synthetic fallbacks — empty/null on failure.
 */

export interface PulseTicker {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  currency: string;
  price: number;
  change: number;
  changePct: number;
  sessionChangePct?: number;
  sparkline: number[];
  updatedAt: string;
}

export interface PulseNewsItem {
  id: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  image?: string;
  tags: string[];
  publishedAt: string;
  category: string;
  relatedAssets?: string[];
}

export interface PulsePodcastEpisode {
  id: string;
  title: string;
  show: string;
  description: string;
  audioUrl: string;
  mediaKind: string;
  embedUrl?: string;
  image?: string;
  durationSec: number;
  publishedAt: string;
}

export interface PulseMycoSnapshot {
  price: number;
  changePct: number;
  supply?: number;
  chain?: string;
  fdv?: number;
  liquidityUsd?: number;
  links?: Record<string, string | undefined>;
  updatedAt?: string;
  researchFunding?: Record<string, number>;
  biobank?: Record<string, number>;
  governance?: Record<string, number>;
}

export interface PulseOhlcBar {
  time: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface PulseConfigStatus {
  service: string;
  time: string;
  configured: Record<string, boolean>;
}

export interface LiquidityPoolRow {
  id: string;
  name: string;
  dexId: string;
  liquidity: number;
  volume: number;
  price: string;
  fee: string;
  apr: string;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchPulseTickers(): Promise<PulseTicker[]> {
  const data = await fetchJson<PulseTicker[] | { error?: string }>("/api/tickers");
  if (!data || Array.isArray(data) === false) return [];
  return data as PulseTicker[];
}

export async function fetchPulseNews(): Promise<PulseNewsItem[]> {
  const data = await fetchJson<PulseNewsItem[] | { error?: string }>("/api/news");
  if (!data || !Array.isArray(data)) return [];
  return data;
}

export async function fetchPulsePodcasts(): Promise<PulsePodcastEpisode[]> {
  const data = await fetchJson<PulsePodcastEpisode[] | { error?: string }>("/api/podcasts");
  if (!data || !Array.isArray(data)) return [];
  return data;
}

export async function fetchPulseMyco(): Promise<PulseMycoSnapshot | null> {
  const data = await fetchJson<PulseMycoSnapshot & { error?: string }>("/api/myco");
  if (!data || data.error) return null;
  return data;
}

export async function fetchPulseOhlc(
  symbol: string,
  interval = "1h"
): Promise<PulseOhlcBar[]> {
  const data = await fetchJson<{ bars?: PulseOhlcBar[]; error?: string }>(
    `/api/ohlc?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`
  );
  if (!data?.bars?.length) return [];
  return data.bars;
}

export async function fetchPulseConfigStatus(): Promise<PulseConfigStatus | null> {
  return fetchJson<PulseConfigStatus>("/api/pulse/config-status");
}

export async function fetchPulseGlobalMarket(
  tickers: PulseTicker[]
): Promise<{ SOL: string; BTC: string; ETH: string; status: string }> {
  const bySymbol = Object.fromEntries(tickers.map((t) => [t.symbol.toUpperCase(), t]));
  const fmt = (t?: PulseTicker) =>
    t && t.price > 0 ? (t.price >= 1000 ? `$${t.price.toLocaleString()}` : String(t.price)) : "—";

  const hasAny = tickers.length > 0;
  return {
    SOL: fmt(bySymbol.SOL),
    BTC: fmt(bySymbol.BTC),
    ETH: fmt(bySymbol.ETH),
    status: hasAny ? "LIVE" : "NO_DATA",
  };
}

/** DexScreener search — real data only; empty array on failure (no mock pools). */
export async function fetchLiquidityPoolsFromDex(): Promise<LiquidityPoolRow[]> {
  try {
    const response = await fetch("https://api.dexscreener.com/latest/dex/search?q=MYCO", {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = await response.json();
    const pairs = data.pairs;
    if (!Array.isArray(pairs)) return [];

    return pairs
      .filter((p: { liquidity?: { usd?: number } }) => (p.liquidity?.usd ?? 0) > 0)
      .slice(0, 10)
      .map((p: Record<string, unknown>, i: number) => {
        const base = p.baseToken as { symbol?: string };
        const quote = p.quoteToken as { symbol?: string };
        const liq = (p.liquidity as { usd?: number })?.usd ?? 0;
        const vol = (p.volume as { h24?: number })?.h24 ?? 0;
        return {
          id: String(p.pairAddress ?? i),
          name: `${base?.symbol ?? "?"}/${quote?.symbol ?? "?"}`,
          dexId: String(p.dexId ?? "dex"),
          liquidity: liq,
          volume: vol,
          price: String(p.priceUsd ?? "—"),
          fee: "—",
          apr: "—",
        };
      });
  } catch {
    return [];
  }
}

/** Polymarket gamma API — real only; empty on CORS/network failure. */
export async function fetchPolymarketActivity(): Promise<unknown[]> {
  try {
    const response = await fetch("https://gamma-api.polymarket.com/activity?limit=10", {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
