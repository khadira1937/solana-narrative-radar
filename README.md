# Solana Narrative Radar (prototype)

A lightweight, explainable tool that detects early Solana ecosystem signals and converts them into:
- **Emerging narratives** (ranked)
- **Clear explanations** with evidence links
- **3–5 actionable build ideas** per narrative

Built for the Superteam Earn **Agents Only** bounty: "Develop a narrative detection and idea generation tool".

## Hosted Tool
- Deploy on Vercel (recommended)
- After deployment, add your hosted URL here.

## Data Sources Used
This prototype intentionally uses **stable, public** sources so results are reproducible:

### 1) On-chain (Solana RPC)
- Solana mainnet RPC (`SOLANA_RPC_URL`, defaults to `https://api.mainnet-beta.solana.com`)
- Method: `getSignaturesForAddress` for the **BPF Upgradeable Loader** program
  - `BPFLoaderUpgradeab1e11111111111111111111111`
- Why: upgrade/deploy activity is a lightweight proxy for shipping velocity, launches, and iteration cycles.

### 2) Developer activity (GitHub)
- GitHub REST API
- Curated repo list (kept small to avoid rate-limit issues)
- Metrics fetched per repo:
  - stars, forks, open issues, last pushed time

Optional:
- `GITHUB_TOKEN` can be set to increase rate limits.

### 3) Ecosystem discourse (RSS)
- A curated RSS feed list (e.g., Solana blog, Helius blog)
- Items are collected and used as evidence/citations

> Note: The bounty mentions social signals (X/Discord/etc.). This prototype prioritizes **reproducibility** and avoids fragile scraping. In the next iteration, add social sources via official APIs (or curated, cited links) to keep it compliant and verifiable.

## How signals are detected and ranked
This is a transparent scoring approach (no black box):

1. Collect signals from the sources above.
2. Convert them into simple features (counts + **fortnight deltas**).
3. Compute a narrative score using a **weighted, capped sum** of signal deltas.
4. For every narrative, show an **evidence panel** so judges can verify why it was detected.

### Fortnight windows
The tool compares:
- **Current window:** last 14 days
- **Previous window:** the 14 days before that

This is what makes narratives “emerging/accelerating” rather than static snapshots.

## Detected narratives + build ideas
The tool produces a ranked list of narratives and for each narrative:
- explanation/summary
- evidence items (metrics + citations)
- **3–5 build ideas** tied to that narrative

### Where to see the full narrative list
Because narratives are refreshed each run, the authoritative list is in:
- UI: `/report`
- Markdown export: `/api/report`

These endpoints include the complete list of detected narratives and their build ideas for the current run.

### Built-in narrative families (what the tool is designed to detect)
The tool clusters discourse signals into Solana-relevant narrative families such as:
- RWAs & tokenized assets
- Stablecoins & payments
- MEV/validators/performance engineering
- Developer tooling & infra
- DeFi primitives (AMMs/perps/options)

## Reproduce / run locally

### 1) Requirements
- Node.js 20+

### 2) Setup
```bash
cp .env.example .env
npm install
```

### 3) Run
```bash
npm run dev
```
Open http://localhost:3000

### 4) Generate a run
Click **Run analysis** in the UI, or:
```bash
curl -X POST http://localhost:3000/api/run
```

### Environment variables
- `SOLANA_RPC_URL` (optional)
- `GITHUB_TOKEN` (optional)

## Future improvements (if extended)
- True fortnight-over-fortnight deltas for on-chain metrics
- Clustering narratives automatically from signal topics
- Social signals (X lists) via allowed APIs + explicit citations
- Better on-chain features: unique wallets, program-level usage spikes, token mints, etc.
- Report export (Markdown/PDF) and scheduled runs
