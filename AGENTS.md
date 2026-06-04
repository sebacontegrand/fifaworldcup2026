# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

FIFA World Cup 2026 Predictor — a Next.js 16 (App Router) application with an interactive tournament simulation engine, prediction pool, and connection puzzle game.

## Tech Stack

- **Framework**: Next.js 16 App Router, React 19, TypeScript 5.7
- **Styling**: Tailwind CSS v4, shadcn/ui (New York style), Vanilla CSS
- **Database**: Prisma 6 + PostgreSQL (schema in `prisma/schema.prisma`)
- **Auth**: NextAuth v4 with Google and GitHub OAuth providers
- **Animation**: Framer Motion (package `motion`)
- **Charts**: Recharts
- **Icons**: Lucide React

## Common Commands

Install dependencies (the project uses both `npm` and `pnpm`; `pnpm-lock.yaml` exists):

```bash
npm install
# or
pnpm install
```

Run development server:

```bash
npm run dev
```

Build for production (note: `ignoreBuildErrors: true` is set in `next.config.mjs`):

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Database operations:

```bash
# Run Prisma migrations
npx prisma migrate dev

# Reset and seed the database with matches + card templates
npm run seed
# (alias for: npx tsx prisma/seed.ts)

# Generate Prisma client (also runs automatically on postinstall)
npx prisma generate
```

Tests (Python Playwright scripts, not JS):

```bash
cd tests && bash run.sh
# Runs: connection_game.py, live_predictions.py
```

## Architecture

### Application Router (`app/`)

The app uses Next.js App Router conventions. Key routes:

- `/` — Home
- `/teams`, `/players`, `/groups`, `/bracket`, `/ranking` — Tournament data views
- `/simulate` — Main Monte Carlo simulation dashboard
- `/analysis`, `/methodology` — Statistical analysis and model docs
- `/my-team` — User's favorite team tracker
- `/pool` — Prediction pool with chip betting and card system
- `/connection` — Connection puzzle game (link players via shared clubs)
- `/games` — Mini-games hub
- `/api/*` — Backend API routes (auth, simulation, pool, connection, matches, chips, ranking)

### Simulation Engine (`lib/simulation.ts`)

The core simulation is a custom Monte Carlo engine (10,000 iterations) written in TypeScript. Key concepts:

- **Dixon-Coles bivariate Poisson model** for match score prediction with a low-score correction factor `ρ = -0.13`
- **Bayesian Elo sampling**: team ratings are drawn from `N(mean, sigma)` per iteration, with sigma scaled by `sqrt(entropyMultiplier)`
- **Tactical style modifiers**: `Normal`/`Attacking`/`Defensive` affect attack/defense strengths and interact pairwise
- **Chaos factor**: derived from `targetUpsetIndex`, capped at 0.35, pulls team Elos toward the mean
- **Host advantage**: configurable Elo points (default 80) for USA/MEX/CAN
- **Match overrides**: users can pin results via `TournamentState.matchOverrides` keyed as `"teamAId_teamBId"`
- **Stage anchors**: users can force teams into semifinals, finals, or as champion
- Spanish team name aliases are hardcoded in `getTeamByName()` for internationalization

### Game Theory (`lib/game-theory.ts`)

Provides Nash Equilibrium computation and payoff matrices for tactical matchups:

- Generates 3×3 strategy matrices (`attacking`/`balanced`/`defensive`)
- Computes mixed-strategy equilibrium via iterated best response with softmax temperature decay
- Context-aware utility (group stage vs. knockout, scoreline, minute)

### Global Simulation State (`lib/hooks/use-simulation.tsx`)

A React Context provider wraps the entire app. It:

- Loads simulation config + tournament state from `/api/simulation/config` on mount
- Debounced auto-save (1s) back to the same API
- Exposes `simulate()` which runs `runFullSimulation()` in a `setTimeout` to unblock the UI thread

### Prediction Pool (`app/pool/`, `lib/games/chips.ts`, `prisma/schema.prisma`)

A betting system where users wager chips on match outcomes:

- `ChipBalance` model tracks per-user chips, lifetime earnings, daily streak
- `Bet` model stores wagers with odds multipliers and card effects
- `CardTemplate` / `UserCard` models implement power-up cards (`double_down`, `hedge`, `lock_in`, `scout`, `insurance`, `boost`)
- Frontend chip state is also mirrored in `localStorage` (`wc2026-chips`, `wc2026-streak`) for resilience

### Connection Game (`lib/connection/`)

A graph-based puzzle where players connect two footballers through shared clubs:

- `graph.ts` — player-club bipartite graph with shortest-path search
- `game-logic.ts` — validation, hints, and chip rewards per difficulty
- `api.ts` — Wikidata-backed player data enrichment
- `types.ts` — defines difficulty/mode configs

### Database & Auth

- `prisma/schema.prisma` — PostgreSQL schema with models: `User`, `Account`, `Session`, `Match`, `Guess`, `Bet`, `ChipBalance`, `CardTemplate`, `UserCard`, `ConnectionScore`, `SimulationConfig`
- `lib/db.ts` — singleton PrismaClient with global hot-reload guard
- `lib/auth.ts` — NextAuth config using `PrismaAdapter` with a **separate plain PrismaClient** (not the extended one from `lib/db.ts`) because the adapter is incompatible with `$extends()`
- `types/next-auth.d.ts` — extends the `Session` type to include `user.id`

### Data Sources

- `data/teams.json` — static 48-team dataset with Elo ratings, attack/defense strengths, kits, top players
- `fifa_2026_group_stage.json` — group stage match schedule (home/away, dates, times, groups)
- `data/players.json` — player dataset for connection game

### shadcn/ui Components

UI components live in `components/ui/` and are generated via shadcn. Custom components (simulation controls, bracket view, pool dashboard, connection game UI) live directly in `components/`. The project uses path aliases `@/components`, `@/lib`, `@/hooks` defined in `tsconfig.json` and `components.json`.

## Environment Variables

See `.env.example`. Required:

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Google OAuth
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` — GitHub OAuth
- `AUTH_SECRET` — NextAuth secret (random 32-byte hex)
- `NEXTAUTH_URL` — production deployment URL

## Notes for Development

- The project uses **Tailwind CSS v4** with `@tailwindcss/postcss` — there is no `tailwind.config.js`; styling is configured in `app/globals.css` and `postcss.config.mjs`.
- Images are served unoptimized (`images.unoptimized: true` in `next.config.mjs`).
- `tsconfig.json` uses `target: ES6` and `moduleResolution: bundler`.
- The simulation engine is entirely client-side and CPU-intensive; `use-simulation.tsx` wraps it in `setTimeout` to avoid blocking React renders.
- There are no JavaScript unit tests — the `tests/` directory contains Python Playwright scripts for end-to-end testing.
- `prisma/seed.ts` creates group stage matches from `data/teams.json` and seeds 6 card templates. It also pre-creates empty knockout match slots.
