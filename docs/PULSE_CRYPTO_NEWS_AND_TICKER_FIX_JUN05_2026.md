# Pulse Crypto News Pipeline + Bottom Ticker Fix — Jun 05, 2026

**Status:** Complete

## Delivered

### Real crypto news (no mock fallback)

- `lib/adapters/crypto-news-feeds.ts` — CoinDesk, CoinTelegraph (+ bitcoin/solana tags), Decrypt, The Block, Bitcoin Magazine, Solana blog RSS.
- `lib/adapters/pulse-news-curator.ts` — dedupe, topic detect, balanced pick, `broadcastLabel` (BITCOIN, SOLANA, BREAKING, etc.).
- `lib/adapters/news.ts` — RSS always on; optional GNews/NewsAPI merge; returns `[]` when all sources fail (no synthetic articles).

### Pulse tab bottom ticker

- Root cause: single strip inside `.ticker-track` (marquee needs **two** identical strips) and duplicate `animate-marquee` on child strips.
- `myco-pulse/src/components/PulseMarqueeTicker.tsx` — shared dual-strip marquee for Pulse footer and Block News Live.
- `myco-pulse/src/index.css` — animation only on `.ticker-track`.
- `PulseDashboard` footer uses live quotes + curated news segments.

### UI wiring

- `news_mini` widget shows live `/api/news` items (empty state when none).
- `mergeNewsWithStudio` / `pulseNewsToBroadcastLines` no longer inject studio headlines.
- CNBC widget bottom crawl uses `PulseMarqueeTicker`.

## Verify

```powershell
cd D:\Users\admin2\Desktop\MYCOSOFT\CODE\MYCODAO\myco-pulse
npm run build
cd ..
npm run dev
```

Open `http://localhost:3004/pulse/` → **Pulse** tab: bottom TAPE scrolls; **News** tab: LIVE crawl scrolls.
