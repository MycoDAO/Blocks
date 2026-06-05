import type { PulseOhlcBar, PulseTicker } from "./pulseApi";

export interface AssetDisplayRow {
  symbol: string;
  name: string;
  price: string;
  change: string;
  up: boolean;
  type: string;
  mcap?: string;
  fdv?: string;
  liq?: string;
  exchanges: string[];
  explorer: string | null;
  coingecko: string | null;
  dexscreener: string | null;
  binance: string | null;
  pools: string[];
}

export interface TickerStripItem {
  s: string;
  p: string;
  c: string;
  up: boolean;
}

export interface TickerGroups {
  crypto: TickerStripItem[];
  metals: TickerStripItem[];
  commodities: TickerStripItem[];
  bio: TickerStripItem[];
  tech: TickerStripItem[];
  business: TickerStripItem[];
  indicators: TickerStripItem[];
}

export const EMPTY_CHART_DATA: { time: string; price: number; volume?: number }[] = [];

export const EMPTY_TICKER_GROUPS: TickerGroups = {
  crypto: [],
  metals: [],
  commodities: [],
  bio: [],
  tech: [],
  business: [],
  indicators: [],
};

function assetClassToType(assetClass: string): string {
  switch (assetClass) {
    case "crypto":
      return "CRYPTO";
    case "equity":
      return "XSTOCK";
    case "bio":
      return "DESCI";
    case "precious_metals":
      return "METAL";
    case "commodity":
      return "COMMODITY";
    default:
      return assetClass.toUpperCase();
  }
}

function formatPrice(price: number): string {
  if (!price || price <= 0) return "—";
  if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(5);
}

function formatChange(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function tickerToAssetRow(t: PulseTicker): AssetDisplayRow {
  const up = (t.changePct ?? 0) >= 0;
  return {
    symbol: t.symbol,
    name: t.name,
    price: formatPrice(t.price),
    change: formatChange(t.changePct ?? 0),
    up,
    type: assetClassToType(t.assetClass),
    mcap: undefined,
    fdv: undefined,
    liq: undefined,
    exchanges: [],
    explorer: null,
    coingecko: null,
    dexscreener: t.symbol === "MYCO" ? "https://dexscreener.com/" : null,
    binance: null,
    pools: [],
  };
}

export function buildTickerGroups(tickers: PulseTicker[]): TickerGroups {
  const strip = (list: PulseTicker[]): TickerStripItem[] =>
    list.map((t) => ({
      s: t.symbol,
      p: formatPrice(t.price),
      c: formatChange(t.changePct ?? 0),
      up: (t.changePct ?? 0) >= 0,
    }));

  const crypto = strip(tickers.filter((t) => t.assetClass === "crypto"));
  const metals = strip(tickers.filter((t) => t.assetClass === "precious_metals"));
  const commodities = strip(tickers.filter((t) => t.assetClass === "commodity"));
  const bio = strip(tickers.filter((t) => t.assetClass === "bio"));
  const tech = strip(tickers.filter((t) => t.assetClass === "equity"));
  const business = strip(
    tickers.filter((t) => ["equity", "forex"].includes(t.assetClass) && !tech.find((x) => x.s === t.symbol))
  );

  return {
    crypto,
    metals,
    commodities,
    bio,
    tech,
    business,
    indicators: strip(
      tickers.filter((t) => ["SPY", "QQQ", "DXY", "VIX"].includes(t.symbol.toUpperCase()))
    ),
  };
}

export function ohlcBarsToChartData(bars: PulseOhlcBar[]): { time: string; price: number; volume?: number }[] {
  return bars.map((b) => ({
    time: b.time,
    price: b.close ?? b.open ?? 0,
    volume: b.volume,
  }));
}
