import type { PulseChainStats } from "./pulseTypes";
import type {
  PulseCalendarEvent,
  PulseFearGreed,
  PulseLearnModule,
  PulseNewsItem,
  PulsePodcastEpisode,
  PulseResearchItem,
  PulseTicker,
  PulseWhaleMovement,
} from "./pulseApi";

export interface OracleSyncInput {
  loading: boolean;
  tickers: PulseTicker[];
  news: PulseNewsItem[];
  episodes: PulsePodcastEpisode[];
  calendar: PulseCalendarEvent[];
  research: PulseResearchItem[];
  learnModules: PulseLearnModule[];
  whales: PulseWhaleMovement[];
  fearGreed: PulseFearGreed | null;
  chainStats: PulseChainStats | null;
}

/** User-facing Oracle Sync line — based on live data, never env/config hints. */
export function buildOracleSyncInsight(input: OracleSyncInput): string {
  const feeds: string[] = [];

  if (input.news.length > 0) feeds.push("News");
  if (input.tickers.length > 0) feeds.push("Markets");
  if (input.episodes.length > 0) feeds.push("Podcasts");
  if (input.calendar.length > 0) feeds.push("Calendar");
  if (input.research.length > 0) feeds.push("Research");
  if (input.learnModules.length > 0) feeds.push("Learn");
  if (input.whales.length > 0) feeds.push("Whale watch");
  if (input.fearGreed?.classification) feeds.push("Sentiment");
  if (
    input.chainStats?.bitcoinBlockHeight != null ||
    input.chainStats?.solanaValidators != null ||
    input.chainStats?.globalMarketCapUsd != null
  ) {
    feeds.push("Chain");
  }

  if (feeds.length > 0) {
    return `Live feeds: ${feeds.join(" · ")}.`;
  }

  if (input.loading) {
    return "Syncing live intelligence feeds…";
  }

  return "Oracle online — refreshing feeds…";
}
