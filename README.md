# Multiplier

**Multiplier shows you the real value of your tokenized stocks on Solana - automatically correcting your balance for every dividend and split, live.**

xStocks (tokenized AAPL, TSLA, SPY, NVDA, QQQ, and more) do not update your wallet balance when a dividend or split happens. Instead, they adjust a hidden multiplier that most wallets never apply. Multiplier watches that multiplier, corrects your balance in real time, and shows you exactly what changed and why - using real, live data, not a simulation.

**Live app**: [multiplier-roan.vercel.app](https://multiplier-roan.vercel.app)
**Live API**: [multiplier-production.up.railway.app](https://multiplier-production.up.railway.app)
**GitHub**: [github.com/GODGRACE07/multiplier](https://github.com/GODGRACE07/multiplier)

Built for the [Stocklana hackathon](https://hackathons.solana.com/hackathons/stocklana) (Solana Foundation).

---

## The 10-second version

1. You hold 10 AAPLx tokens.
2. A dividend happens. Your wallet still shows 10 - it never updates.
3. You actually own 10.03 now, because of a multiplier xStocks updated behind the scenes.
4. Nothing else shows you that. Multiplier does - live, with the full history, in plain English.

## The problem

Tokenized stocks on Ethereum and other EVM chains rebase automatically - a dividend lands, your token balance goes up. On Solana, xStocks work differently: your raw on-chain balance never changes. Instead, a separate multiplier is updated, and every application is expected to fetch it and apply it themselves.

Most dont. Wallets, explorers, and portfolio trackers show the raw number, which silently drifts further from the truth with every dividend, split, or reverse split. xStocks own developer documentation states that a webhook notification system for these events is still forthcoming - meaning even the issuer admits this gap exists.

For a retail holder, this is a wrong number on a screen. For a lending protocol holding tokenized equity as collateral, its a solvency risk - which is exactly why Kamino Finance already runs a price-band mechanism around corporate-action windows on its xStocks lending markets.

## What Multiplier does

- Watches the real xStocks public API for every tracked symbol, on a fixed polling interval
- Detects and classifies every multiplier change - dividend, split, or reverse split - using xStocks own labeled data
- Publishes corrected balances and a full historical ledger over a plain HTTP API
- Displays all of this live, on one page: a naive-vs-corrected balance comparison, a real corporate-action ledger, and the underlying API endpoints any wallet or protocol could consume

Nothing in this project is simulated. Every number shown is fetched live from api.xstocks.fi.

## Why this belongs on Solana

This problem is specific to Solanas token design. xStocks on Solana use the SPL Token-2022 Scaled UI Amount extension: the raw on-chain balance stays fixed, and a multiplier - updated off-chain and fetched via API - determines the true displayed value. This is fundamentally different from how EVM-based tokenized equities auto-rebase. The gap Multiplier fills only exists because of this Solana-specific design choice.

## Who it is for

- Protocols and builders - lending markets, wallets, and portfolio tools that need multiplier-correct pricing. A missed corporate action here is mispriced collateral, not a cosmetic bug.
- Holders - anyone holding xStocks who wants to see what they actually own, and a plain record of every dividend that has quietly adjusted their position.

## Architecture

[xStocks Public API]
| (poll every 5 min)
v
[Poller service] -- stores multiplier snapshots (symbol, value, timestamp)
|
v
[Diff engine] -- detects changes, classifies event type
v
[SQLite event store]
|
+--> [REST API] -- /api/balance/:symbol, /api/replay/:symbol, /api/events
|
+--> [Frontend] -- live naive-vs-corrected comparison, historical ledger


**Backend**: Node.js, TypeScript, Express, node:sqlite, node-cron. Polls api.xstocks.fi/api/v2/public/assets/{symbol}/multiplier and /multiplier/history for AAPLx, TSLAx, SPYx, NVDAx, and QQQx. Deployed on Railway.

**Frontend**: React, TypeScript, Vite. Single-page, no external UI framework - hand-built design using Solanas official brand colors (#9945FF, #14F195). Deployed on Vercel.

## Try it yourself

The live app requires nothing to set up - just open the link and interact with real data:

**[multiplier-roan.vercel.app](https://multiplier-roan.vercel.app)**

Pick a stock (AAPLx is recommended - it has the richest dividend history), see the naive-vs-corrected balance, and scroll the full corporate-action ledger.

## Running it locally

Requires Node.js v20+.

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs on http://localhost:4000. Health check: GET /health.

### Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173. Requires the backend to be running.

### API endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/balance/:symbol?raw=<amount> | Naive vs. corrected balance for a raw token amount |
| GET | /api/replay/:symbol | Full historical corporate-action timeline |
| GET | /api/events | All detected events across tracked symbols |
| GET | /api/multiplier/:symbol | Live current multiplier for a symbol |
| GET | /api/symbols | List of tracked symbols |

## Data sources

- [xStocks Public API](https://docs.xstocks.fi/apis/openapi) - asset prices, multipliers, corporate-action history. No authentication required.

## Scope and honesty notes

This is a read-only data and alerting layer - it does not touch trading, custody, or user funds. Thats a deliberate scope choice: it keeps the security surface minimal and the demo verifiable end-to-end within the hackathon timeframe.

TSLAx correctly shows zero recorded corporate actions - Tesla does not currently pay dividends, and the empty state reflects that honestly rather than fabricating data.

## License

Original work built for the Stocklana hackathon. Open-source dependencies used as listed in package.json for both backend/ and frontend/.
