# CNBC Markets Now Rail — Jun 05, 2026

**Status:** Complete  
**Scope:** MYCODAO Pulse CNBC widget — Markets Now rail aligned with CNBC indices (DOW, S&P 500, NASDAQ, Gold, Bitcoin, US Treasuries, etc.)

## What changed

- **`lib/adapters/cnbc-markets.ts`** — Ordered CNBC market slots, Finnhub index symbols via `fetchTickers()`, Stooq fallbacks (indices, gold, oil, 10Y), direct CoinGecko BTC + MYCO GeckoTerminal quote, 60s server cache.
- **`lib/adapters/tickers.ts`** — Finnhub map extended: `DOW` (^DJI), `SPX` (^GSPC), `NDX` (^IXIC), `RUT`, `US10Y` (^TNX), `XAU` (OANDA:XAU_USD).
- **`app/api/pulse/cnbc-markets/route.ts`** — API for Pulse SPA.
- **`myco-pulse/src/lib/cnbcMarkets.ts`** — Client fetch + ticker fallback mapping.
- **`myco-pulse/src/components/CNBCNewsWidget.tsx`** — Markets Now uses full CNBC slot list; scrollable rail; bottom crawl priority updated.

## CNBC slot order

1. DOW Industrials  
2. S&P 500  
3. NASDAQ Composite  
4. Russell 2000  
5. WTI Crude Oil  
6. Gold  
7. Bitcoin  
8. US 10-Yr Treasury (yield %)  
9. VIX  
10. US Dollar Index  
11. MYCO Protocol  

Missing live data shows **—** (no studio fake prices).

## Verify

```powershell
cd MYCODAO
npm run dev   # :3004
npx tsx -e "import { fetchCnbcMarkets } from './lib/adapters/cnbc-markets.ts'; fetchCnbcMarkets().then(console.log)"
```

Open Pulse CNBC widget → **Markets Now** right rail should list all slots above.

## Env

| Variable | Purpose |
|----------|---------|
| `FINNHUB_API_KEY` | Primary source for US indices, gold spot, oil ETF, 10Y yield, VIX, DXY |
| `MYCO_SOLANA_MINT` | Live MYCO price (GeckoTerminal fallback) |

Without Finnhub, Stooq + CoinGecko fill indices/crypto when rate limits allow.
