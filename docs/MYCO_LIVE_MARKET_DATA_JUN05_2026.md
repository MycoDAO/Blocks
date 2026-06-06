# MYCO Live Market Data — Jun 05, 2026

**Status:** Complete  
**Mint:** `EzYEwn4R5tNkNGw4K2a5a58MJFQESdf1r4UJrV7cpUF3`

## Problem

Pulse showed studio/fake prices when APIs were empty. DexScreener’s **token** API often returns `pairs: null` for this mint (thin liquidity), while [DexScreener](https://dexscreener.com/solana/EzYEwn4R5tNkNGw4K2a5a58MJFQESdf1r4UJrV7cpUF3), [Solflare](https://www.solflare.com/prices/myco/EzYEwn4R5tNkNGw4K2a5a58MJFQESdf1r4UJrV7cpUF3/), and [CoinSwitch](https://coinswitch.co/web3/myco-EzYEwn4R5tNkNGw4K2a5a58MJFQESdf1r4UJrV7cpUF3) list the token but may show no tradable price when liquidity is very low.

## Solution

1. **`lib/adapters/myco-price-sources.ts`** — DexScreener first; **GeckoTerminal** fallback (live pool price when DexScreener has no pairs).
2. **`/api/tickers`** and **`/api/myco`** always attempt MYCO via `fetchLiveMycoQuote()` (mint from env or canonical default).
3. **Pulse SPA** — removed synthetic price fallbacks; bottom crawl and Markets Now rail use live tickers; client-side `ensureMycoInTickers()` fills MYCO if the API omits it.
4. **Liquidity pools** — fetch by mint (not generic `search?q=MYCO`); include pools with price even when liquidity is thin; GeckoTerminal fallback.

## Verify

```powershell
cd MYCODAO
npm run dev   # port 3004
node scripts/pulse-smoke-local.mjs
```

Expect: `OK MYCO live price $0.022…` from `/api/tickers` and `/api/myco`.

Rebuild Pulse UI after changes:

```powershell
cd myco-pulse
npm run build
```

## Env

```env
MYCO_SOLANA_MINT=EzYEwn4R5tNkNGw4K2a5a58MJFQESdf1r4UJrV7cpUF3
NEXT_PUBLIC_MYCO_SOLANA_MINT=EzYEwn4R5tNkNGw4K2a5a58MJFQESdf1r4UJrV7cpUF3
```

Optional Vite: `VITE_MYCO_SOLANA_MINT` (same value) in `myco-pulse/.env`.
