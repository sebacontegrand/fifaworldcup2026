# ⚽ FIFA World Cup 2026 Simulation & Analytics

A high-performance forecasting engine and interactive dashboard for the 2026 FIFA World Cup. This application leverages advanced statistical models and game theory analysis to predict tournament outcomes with precision.

![Hero Banner](https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=2000)

## 🚀 Key Features

### 🎲 Advanced Simulation Engine
- **10,000 Monte Carlo Iterations**: Every tournament outcome is simulated 10,000 times to produce stable probability distributions.
- **Dynamic Elo Rating System**: Real-time win probabilities based on FIFA rankings and adjusted Elo ratings.
- **Poisson Distribution Modeling**: Match scores are predicted using goal-frequency statistics calibrated to international football.

### 📊 Interactive Analytics
- **Live Knockout Bracket**: Visualize the most likely paths to the final with real-time probability updates.
- **Group Stage Deep-Dive**: Analysis of all 12 groups, including automated "Group of Death" identification.
- **Simulation Controls**: Adjust global variables like "Chaos Factor" or specific team settings (injuries, tactical styles) to see how they impact tournament outcomes.

### 🎯 Strategic Insights
- **Game Theory Analysis**: Nash Equilibrium evaluations for tactical matchups (Attacking vs. Defensive strategies).
- **Squad Impact Simulation**: Track how the absence of star players affects a team's championship probability.
- **"My Team" Tracker**: Follow your favorite nation through the tournament with dedicated metrics and projections.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- **Visuals**: [Framer Motion](https://www.framer.com/motion/) (Animations) & [Recharts](https://recharts.org/) (Data Visualization)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives

## 📈 Methodology

Our prediction model is built on three core pillars:

1.  **Elo Rating Adjustment**: `E = 1 / (1 + 10^((Rb - Ra) / 400))` adjusted for home advantage and squad strength.
2.  **Match Simulation**: Goal scoring follows a **Poisson Point Process**, where the expected goals are derived from offensive and defensive ratings.
3.  **Tactical Matrix**: 3x3 payoff matrices simulate manager decisions, identifying optimal strategies for underdog vs. favorite matchups.

## 🏁 Getting Started

First, install the dependencies:

```bash
npm install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the simulator in action.

---
*Built with ❤️ for the beautiful game.*
