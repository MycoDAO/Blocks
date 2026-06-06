# Finnhub Pulse Integration — Jun 05, 2026

**Status:** Complete  
**Related:** [Finnhub Dashboard](https://finnhub.io/dashboard), `lib/adapters/tickers.ts`, `app/api/pulse/finnhub-webhook/route.ts`

## Environment (`.env.local` only — never commit)

| Variable | Purpose |
|----------|---------|
| `FINNHUB_API_KEY` | Live US indices, equities, gold (OANDA:XAU_USD), treasury (^TNX) |
| `FINNHUB_WEBHOOK_SECRET` | Validates inbound webhook POSTs from Finnhub |

## Webhook URL to register in Finnhub

Use the **public** Pulse host (Cloudflare tunnel or production):

```
https://pulse.mycodao.com/api/pulse/finnhub-webhook?secret=<FINNHUB_WEBHOOK_SECRET>
```

Or send the secret as header:

```
X-Finnhub-Secret: <FINNHUB_WEBHOOK_SECRET>
```

**Local dev (LAN tunnel):** If Cloudflare tunnel points at dev Next on `:3004`:

```
https://<your-tunnel-host>/api/pulse/finnhub-webhook?secret=<FINNHUB_WEBHOOK_SECRET>
```

## Behavior

- `POST /api/pulse/finnhub-webhook` — accepts Finnhub events; invalidates ticker cache on trade/quote payloads.
- `GET /api/pulse/finnhub-webhook?secret=...&limit=10` — recent events (ops/debug).
- `/api/pulse/config-status` reports `FINNHUB_API_KEY`, `FINNHUB_WEBHOOK_SECRET`, and `CRYPTO_NEWS_RSS`.

## Verify

```powershell
cd D:\Users\admin2\Desktop\MYCOSOFT\CODE\MYCODAO
npm run dev
# Another shell:
Invoke-RestMethod http://localhost:3004/api/pulse/config-status
Invoke-RestMethod http://localhost:3004/api/tickers
Invoke-RestMethod http://localhost:3004/api/news
```

Expect DOW, SPX, NDX, XAU, US10Y rows when `FINNHUB_API_KEY` is valid; crypto headlines from RSS without GNews/NewsAPI keys.
