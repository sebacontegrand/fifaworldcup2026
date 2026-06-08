# FIFA World Cup 2026 — Simulation, Predictions & Games

A high-performance tournament forecasting engine, prediction pool, and interactive games hub for the 2026 FIFA World Cup. Built with Next.js 16, TypeScript, and PostgreSQL.

## Features

### Simulation Engine
- **10,000 Monte Carlo iterations** producing stable probability distributions for every team at every stage
- **Dixon-Coles bivariate Poisson model** for match score prediction with low-score correction factor
- **Bayesian Elo sampling** — ratings drawn from `N(mean, sigma)` per iteration to propagate uncertainty
- **Tactical style modifiers** — Normal / Attacking / Defensive affect attack/defense strengths
- **Chaos factor & upset index** — adjustable to control randomness
- **Host advantage** — configurable Elo boost for USA / Mexico / Canada
- **Match overrides & stage anchors** — pin specific results or force teams into semifinals/finals

### Game Theory Engine
- 3x3 strategy matrices (attacking / balanced / defensive)
- Mixed-strategy Nash Equilibrium via iterated softmax best-response
- Context-aware utility (group stage vs. knockout, scoreline, minute)

### Prediction Pool
- Chip-based betting on match outcomes
- Power-up cards: double down, hedge, lock in, scout, insurance, boost
- Odds multipliers and daily streaks
- Persistent balance via database + localStorage fallback

### Connection Game
- Graph-based puzzle connecting two footballers through shared clubs
- Bipartite player-club graph with shortest-path search
- Wikidata-backed player data
- Chip rewards per difficulty

### Games Hub
- Trivia and sorting mini-games
- Scores synced to ranking with 15% weight
- Chip earnings per completion

### Rankings
- Composite leaderboard across Connection (20%), Predictions (30%), Pool (35%), and Games (15%)

### Team & Tournament Data
- All 48 qualified teams with Elo ratings, attack/defense strengths, kits, top players
- Group stage schedule with home/away, dates, times
- Live bracket view, group of death analysis, player rankings

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.7 |
| **Styling** | Tailwind CSS v4, shadcn/ui (New York style) |
| **Database** | PostgreSQL + Prisma 6 |
| **Auth** | NextAuth v4 (Google & GitHub OAuth) |
| **Animation** | Framer Motion (`motion`) |
| **Charts** | Recharts |
| **Icons** | Lucide React |

## Getting Started

1. Clone the repository and install dependencies:

```bash
npm install
# or
pnpm install
```

2. Copy `.env.example` to `.env.local` and fill in the required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth credentials |
| `AUTH_SECRET` | NextAuth secret (random 32-byte hex) |
| `NEXTAUTH_URL` | Production deployment URL |

3. Set up the database:

```bash
npx prisma migrate dev
npm run seed
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed database (matches + card templates) |
| `npx prisma migrate dev` | Run database migrations |
| `npx prisma generate` | Regenerate Prisma client |

## Architecture

### Routes

| Path | Page |
|------|------|
| `/` | Dashboard with simulation controls |
| `/teams` | Team overview |
| `/players` | Player rankings |
| `/groups` | Group breakdowns |
| `/bracket` | Tournament bracket |
| `/ranking` | Overall leaderboard |
| `/simulate` | Monte Carlo simulation dashboard |
| `/analysis` | Statistical analysis |
| `/methodology` | Model documentation & sources |
| `/my-team` | Favorite team tracker |
| `/pool` | Prediction pool (chips & cards) |
| `/connection` | Connection puzzle game |
| `/games` | Mini-games hub |

### Key Directories

```
app/          — Next.js App Router pages and API routes
components/   — React components (UI + custom)
lib/          — Shared logic (simulation, game theory, hooks, DB)
prisma/       — Schema, migrations, seed script
data/         — Static datasets (teams, players, schedule)
tests/        — Python Playwright E2E tests
```

## Model Details

### Dixon-Coles Bivariate Poisson
Match goals are modeled as correlated Poisson variables with a low-score correction (`ρ = -0.13`). Each team has attack and defense strength parameters, and expected goals are calculated as:

```
λ_home = exp(μ + attack_home − defense_away + home_advantage)
λ_away = exp(μ + attack_away − defense_home)
```

### Bayesian Elo
Elo ratings are treated as distributions rather than point estimates. Each Monte Carlo iteration samples fresh ratings from `N(mean, σ)` where σ is scaled by `√(entropyMultiplier)`, propagating parameter uncertainty into outcome distributions.

## Testing

E2E tests use Python Playwright:

```bash
cd tests && bash run.sh
```

---

*Built for the beautiful game.*
