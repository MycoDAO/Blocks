/**
 * Legacy service barrel — delegates to MYCODAO /api routes and real external APIs only.
 * No Gemini, no mock fallbacks.
 */

import {
  fetchLiquidityPoolsFromDex,
  fetchPolymarketActivity,
  fetchPulseGlobalMarket,
  fetchPulseMyco,
  fetchPulseNews,
  fetchPulseOhlc,
  fetchPulsePodcasts,
  fetchPulseTickers,
  type LiquidityPoolRow,
  type PulseMycoSnapshot,
  type PulseNewsItem,
  type PulsePodcastEpisode,
} from "../lib/pulseApi";

export type { LiquidityPoolRow };

export interface MarketData {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
  mcap?: string;
  fdv?: string;
  liq?: string;
  type: string;
}

export const fetchCryptoPrices = async (_symbols: string[]) => {
  const tickers = await fetchPulseTickers();
  if (!tickers.length) return null;
  const out: Record<string, { usd: number; usd_24h_change: number }> = {};
  const idMap: Record<string, string> = {
    bitcoin: "BTC",
    ethereum: "ETH",
    solana: "SOL",
    vitadao: "VITA",
    valleydao: "VALLEY",
  };
  for (const [id, sym] of Object.entries(idMap)) {
    const t = tickers.find((x) => x.symbol.toUpperCase() === sym);
    if (t) out[id] = { usd: t.price, usd_24h_change: t.changePct ?? 0 };
  }
  return Object.keys(out).length ? out : null;
};

export const fetchDexScreenerToken = async (_address: string) => {
  const myco = await fetchPulseMyco();
  if (!myco || !myco.price) return null;
  return {
    pairs: [
      {
        priceUsd: String(myco.price),
        priceChange: { h24: myco.changePct ?? 0 },
        fdv: myco.fdv,
        marketCap: myco.fdv,
        liquidity: { usd: myco.liquidityUsd ?? 0 },
      },
    ],
  };
};

export const fetchMarketNews = async (): Promise<PulseNewsItem[]> => fetchPulseNews();

export const fetchLiveMycoTokenMetrics = async () => {
  const snap = await fetchPulseMyco();
  if (!snap || snap.price <= 0) return null;
  return {
    price: String(snap.price),
    fdv: snap.fdv ?? 0,
    marketCap: snap.fdv ?? 0,
    liq: snap.liquidityUsd ?? 0,
    priceChange24h: snap.changePct ?? 0,
    active: true,
    live: true,
  };
};

export const fetchGlobalMarketData = async () => {
  const tickers = await fetchPulseTickers();
  return fetchPulseGlobalMarket(tickers);
};

/** Streamlabs not configured on MYCODAO — always null until backend exists. */
export const fetchStreamlabsStats = async () => null;

/** Neural/Gemini reports removed — use MAS task API when configured. */
export const generateNeuralReport = async (_marketContext: string) => null;

export const fetchRSSEpisodes = async (): Promise<PulsePodcastEpisode[]> =>
  fetchPulsePodcasts();

export const fetchDAOProposals = async () => [];

export const fetchHistory = async (symbol: string) => {
  const bars = await fetchPulseOhlc(symbol, "1h");
  if (!bars.length) return [];
  return bars.map((b) => ({
    time: b.time,
    value: b.close ?? b.open ?? 0,
    vol: b.volume ?? 0,
  }));
};

export const fetchPolymarketWhales = async () => fetchPolymarketActivity();

export const fetchLiquidityPools = async (): Promise<LiquidityPoolRow[]> =>
  fetchLiquidityPoolsFromDex();
