import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Dices,
    BarChart3,
    Swords,
    Target,
    Trophy,
    ShieldHalf,
    Gauge,
    Zap,
    SlidersHorizontal,
    Users,
    Activity,
    Brain,
    HeartPulse,
    Home,
} from "lucide-react"

/* ─── Section data ────────────────────────────────────────────────── */

interface Section {
    id: string
    icon: React.ReactNode
    color: string // tailwind text-* color
    accentBg: string // small icon background
    title: string
    subtitle: string
    body: React.ReactNode
    deeper?: React.ReactNode
}

const sections: Section[] = [
    /* 1 — Monte Carlo */
    {
        id: "monte-carlo",
        icon: <Dices className="h-5 w-5" />,
        color: "text-[oklch(0.85_0.22_155)]",
        accentBg: "bg-[oklch(0.85_0.22_155/0.12)]",
        title: "The Big Picture — Monte Carlo Simulation",
        subtitle: "We play the entire World Cup thousands of times on a computer and count how often each team wins.",
        body: (
            <>
                <p>
                    Imagine you could replay the 2026 World Cup <strong>10,000 times</strong> in
                    a parallel universe — same teams, same groups, but with all the randomness of
                    football: a lucky deflection here, a red card there. After every replay you
                    write down who won.
                </p>
                <p className="mt-3">
                    If Brazil wins in 1,800 of those replays, we say they have an{" "}
                    <strong>18% chance</strong> of winning the tournament. That&apos;s it — that&apos;s
                    Monte Carlo simulation in a nutshell.
                </p>
                <p className="mt-3">
                    The more replays we run, the more accurate the percentages become. Our default
                    is <Badge variant="outline" className="border-white/10 text-white/70 text-[10px]">10,000 iterations</Badge>,
                    which gives stable, reliable probabilities.
                </p>
            </>
        ),
        deeper: (
            <p className="text-white/50">
                Monte Carlo methods are named after the famous casino in Monaco. They were
                originally developed for nuclear physics simulations in the 1940s. The core idea
                is: when a problem is too complex to solve with an exact formula, you can
                approximate the answer by running random experiments many times and averaging the
                results.
            </p>
        ),
    },

    /* 2 — Elo Ratings */
    {
        id: "elo",
        icon: <BarChart3 className="h-5 w-5" />,
        color: "text-[oklch(0.78_0.15_200)]",
        accentBg: "bg-[oklch(0.78_0.15_200/0.12)]",
        title: "Team Strength — Elo Ratings",
        subtitle: "Every team has a power number. Higher number = stronger team.",
        body: (
            <>
                <p>
                    Think of it like the <strong>overall rating</strong> in EA Sports FC. A team
                    rated 2050 is significantly stronger than one rated 1650 — and the gap between
                    them tells us how likely each team is to win when they face each other.
                </p>
                <p className="mt-3">
                    But here&apos;s the thing: we don&apos;t pretend to know a team&apos;s exact
                    strength. Maybe Argentina is having an off day, or maybe a &quot;weaker&quot;
                    team is on fire. So instead of a single number, we treat each Elo rating as a{" "}
                    <strong>range of possible values</strong>.
                </p>
                <p className="mt-3">
                    Each simulation run picks a random value from that range. This means sometimes
                    the underdog gets a lucky boost and the favourite has a bad day — just like in
                    real football.
                </p>
            </>
        ),
        deeper: (
            <p className="text-white/50">
                The Elo system was originally invented for chess by Arpad Elo in the 1960s. We
                use a <em>Bayesian</em> version, where each team&apos;s rating is modeled as a bell
                curve (a normal distribution) with a mean (the published rating) and a standard
                deviation (σ, sigma — the uncertainty). Every time we simulate, we &quot;sample&quot;
                a rating from that bell curve using a technique called the Box-Muller transform.
                Teams with higher σ have more unpredictable results.
            </p>
        ),
    },

    /* 3 — Dixon-Coles */
    {
        id: "goals",
        icon: <Target className="h-5 w-5" />,
        color: "text-[oklch(0.87_0.17_85)]",
        accentBg: "bg-[oklch(0.87_0.17_85/0.12)]",
        title: "Predicting Scores — The Goal Model",
        subtitle: "How many goals will each team score? We model attack vs. defense.",
        body: (
            <>
                <p>
                    Every team has an <strong>attack strength</strong> (how good they are at
                    scoring) and a <strong>defense strength</strong> (how good they are at
                    stopping goals). When two teams meet, we pit one team&apos;s attack against
                    the other&apos;s defense to figure out how many goals each side is
                    &quot;expected&quot; to score.
                </p>
                <p className="mt-3">
                    A strong attack against a weak defense = lots of expected goals. A weak attack
                    against an elite defense = very few. The simulator then generates actual
                    scorelines using these numbers, so every match produces a realistic score like
                    2-1 or 0-0, not just &quot;Team A wins&quot;.
                </p>
                <p className="mt-3">
                    Importantly, the model also corrects for the fact that <strong>low-scoring
                        outcomes</strong> (like 0-0 and 1-1) happen more often in real football than
                    pure statistics would predict.
                </p>
            </>
        ),
        deeper: (
            <p className="text-white/50">
                Under the hood, this is the <em>Dixon-Coles bivariate Poisson model</em>{" "}
                (1997). Goals are drawn from Poisson distributions whose rates (λ) are determined
                by the attack-defense formula: λ = exp(μ + attack − defense + homeAdv). The
                famous &quot;ρ correction&quot; adjusts the joint probability of low scorelines
                (0-0, 1-0, 0-1, 1-1) to match what we actually see in real data. Goals per match
                are then sampled via rejection sampling against the ρ-corrected distribution.
            </p>
        ),
    },

    /* 4 — Draws */
    {
        id: "draws",
        icon: <ShieldHalf className="h-5 w-5" />,
        color: "text-white/70",
        accentBg: "bg-white/5",
        title: "Draw Probability",
        subtitle: "Evenly-matched teams are more likely to draw — just like in real life.",
        body: (
            <p>
                When two teams are very close in strength (say, France vs. Spain), the simulator
                gives a higher chance of a draw — around <strong>25-28%</strong> — which matches
                real World Cup group-stage averages. When there&apos;s a huge gap (like Brazil
                vs. a lower-ranked team), draws become much rarer.
            </p>
        ),
    },

    /* 5 — Knockout Mechanics */
    {
        id: "knockout",
        icon: <Trophy className="h-5 w-5" />,
        color: "text-[oklch(0.87_0.17_85)]",
        accentBg: "bg-[oklch(0.87_0.17_85/0.12)]",
        title: "Knockout Stage — Extra Time & Penalties",
        subtitle: "In knockout rounds, someone has to win. Here's how the sim handles it.",
        body: (
            <>
                <p>
                    If a knockout match ends in a draw after 90 minutes, the simulator plays{" "}
                    <strong>30 minutes of extra time</strong> — modeled as roughly one-third of a
                    normal match with fewer goals (players are tired!).
                </p>
                <p className="mt-3">
                    If it&apos;s <em>still</em> tied, we go to a <strong>penalty shootout</strong>.
                    The stronger team (by Elo) has a slight edge, but penalties are inherently
                    unpredictable — so upsets happen, just like in real life.
                </p>
            </>
        ),
        deeper: (
            <p className="text-white/50">
                The penalty shootout probability uses the base Elo expected-score formula. The
                extra-time goal rate scales down by 0.33× (representing 30 min out of 90), and
                is further reduced as the user increases the &quot;Penalty Rate&quot; slider,
                making it more likely that games go to spot-kicks.
            </p>
        ),
    },

    /* 6 — Home Advantage */
    {
        id: "home",
        icon: <Home className="h-5 w-5" />,
        color: "text-[oklch(0.85_0.22_155)]",
        accentBg: "bg-[oklch(0.85_0.22_155/0.12)]",
        title: "Home Advantage",
        subtitle: "USA, Mexico, and Canada get a boost as co-hosts.",
        body: (
            <p>
                Playing at home matters. The crowd, the familiarity with the stadiums, the lack
                of jet lag — all of it adds up. In 2026, the three host nations receive an Elo
                points boost (default <strong>+80 points</strong>, configurable via the slider).
                Historically, hosts over-perform by a similar margin. This is a well-documented
                effect in international football.
            </p>
        ),
    },

    /* 7 — Injuries */
    {
        id: "injuries",
        icon: <HeartPulse className="h-5 w-5" />,
        color: "text-red-400",
        accentBg: "bg-red-400/10",
        title: "Injuries & Fatigue",
        subtitle: "Star players can get hurt at any moment — and the sim accounts for it.",
        body: (
            <>
                <p>
                    Before each simulated match, there&apos;s a{" "}
                    <strong>5% chance</strong> that each star player becomes unavailable. Each
                    missing player costs the team <strong>–30 Elo points</strong>. You can also
                    manually bench specific players using the team settings panel.
                </p>
                <p className="mt-3">
                    This means that across 10,000 simulations, deep runs are harder for
                    injury-prone squads — just like in real tournaments.
                </p>
            </>
        ),
    },

    /* 8 — Tactical Styles */
    {
        id: "tactics",
        icon: <Swords className="h-5 w-5" />,
        color: "text-orange-400",
        accentBg: "bg-orange-400/10",
        title: "Tactical Styles",
        subtitle: "Attacking, Balanced, or Defensive — the matchup matters.",
        body: (
            <>
                <p>
                    You can assign each team a tactical style:
                </p>
                <ul className="mt-2 space-y-1 text-white/60">
                    <li>
                        ⚔️ <strong className="text-white/80">Attacking</strong> — more goals scored,
                        but also more goals conceded.
                    </li>
                    <li>
                        ⚖️ <strong className="text-white/80">Balanced</strong> — standard behavior,
                        no modifiers.
                    </li>
                    <li>
                        🛡️ <strong className="text-white/80">Defensive</strong> — fewer goals
                        conceded, but also fewer scored.
                    </li>
                </ul>
                <p className="mt-3">
                    The interesting part is that <strong>the opponent&apos;s style also
                        matters</strong>. An attacking team vs. a defensive team creates a different
                    dynamic than two attacking teams going head-to-head (which tends to produce
                    wild, high-scoring games).
                </p>
            </>
        ),
        deeper: (
            <p className="text-white/50">
                Under the hood, each style combination modifies the attack and defense parameters
                fed into the Dixon-Coles goal model. For example, &quot;Attacking vs.
                Attacking&quot; adds +0.08 to both teams&apos; attack strengths, leading to
                higher expected goals for both sides.
            </p>
        ),
    },

    /* 9 — Game Theory */
    {
        id: "game-theory",
        icon: <Brain className="h-5 w-5" />,
        color: "text-purple-400",
        accentBg: "bg-purple-400/10",
        title: "Game Theory — Nash Equilibrium & Minimax",
        subtitle: "What's the best strategy when your opponent also picks the best counter?",
        body: (
            <>
                <p>
                    Imagine you&apos;re a manager choosing between playing attacking or
                    defensive. Your opponent is making the same decision. Game theory helps us
                    figure out the <strong>Nash Equilibrium</strong> — the combination where
                    neither manager can improve their result by switching strategy alone.
                </p>
                <p className="mt-3">
                    <strong>Minimax analysis</strong> goes further: it asks, &quot;If my opponent
                    always picks the strategy that hurts me the most, what&apos;s the best I can
                    guarantee?&quot; Think of it as the <em>worst-case scenario
                        guarantee</em> — the safe floor below which your chances shouldn&apos;t drop.
                </p>
                <p className="mt-3">
                    The app computes a full <strong>payoff matrix</strong> for every possible
                    matchup — showing what happens with every combination of strategies.
                </p>
            </>
        ),
        deeper: (
            <p className="text-white/50">
                The payoff matrix is a 3×3 grid (Attacking, Balanced, Defensive for each team).
                Mixed-strategy Nash equilibria are computed using support enumeration over all
                possible support pairs. The utility function is context-aware: in group stage, a
                draw has value (1 point), but in knockout rounds, draws are worthless since
                someone must win. Minimax values represent the team&apos;s security level — the
                guaranteed minimum payoff.
            </p>
        ),
    },

    /* 10 — Sliders */
    {
        id: "sliders",
        icon: <SlidersHorizontal className="h-5 w-5" />,
        color: "text-[oklch(0.78_0.15_200)]",
        accentBg: "bg-[oklch(0.78_0.15_200/0.12)]",
        title: "The Simulation Sliders — What Each One Does",
        subtitle: "Twist the knobs to explore different tournament universes.",
        body: (
            <div className="space-y-4">
                <div>
                    <p className="font-semibold text-orange-400 text-sm">🎲 Upset Index (10–50%)</p>
                    <p className="text-white/60 mt-1">
                        Controls how often underdogs beat favourites. At low values, the best teams
                        almost always win. Crank it up, and you get a chaotic tournament where
                        anything can happen — like the 2018 World Cup on steroids.
                    </p>
                </div>
                <div>
                    <p className="font-semibold text-amber-400 text-sm">⚽ Penalty Rate (10–50%)</p>
                    <p className="text-white/60 mt-1">
                        Controls how often knockout matches go to penalty shootouts. Higher values
                        reduce goal-scoring in extra time, making it more likely that matches are
                        decided from the spot.
                    </p>
                </div>
                <div>
                    <p className="font-semibold text-purple-400 text-sm">🌀 Entropy Multiplier (0.2×–3.0×)</p>
                    <p className="text-white/60 mt-1">
                        Controls how &quot;uncertain&quot; team ratings are. At 1.0× (default), we
                        use the standard uncertainty. At 3.0×, team ratings swing wildly from
                        simulation to simulation — as if we really don&apos;t know how good anyone
                        is. At 0.2×, ratings are nearly fixed, and the strongest team on paper almost
                        always wins.
                    </p>
                </div>
                <div>
                    <p className="font-semibold text-emerald-400 text-sm">🏠 Home Advantage Strength (0–200 Elo pts)</p>
                    <p className="text-white/60 mt-1">
                        How much of a boost the three host nations receive. The historical World Cup
                        average is around 80 Elo points. Set it to 0 to remove home advantage
                        entirely.
                    </p>
                </div>
            </div>
        ),
    },

    /* 11 — Tournament Format */
    {
        id: "format",
        icon: <Users className="h-5 w-5" />,
        color: "text-[oklch(0.85_0.22_155)]",
        accentBg: "bg-[oklch(0.85_0.22_155/0.12)]",
        title: "2026 Tournament Format",
        subtitle: "48 teams, 12 groups — the biggest World Cup ever.",
        body: (
            <>
                <p>
                    The 2026 FIFA World Cup expands to <strong>48 teams</strong> in{" "}
                    <strong>12 groups of 4</strong>. From each group:
                </p>
                <ul className="mt-2 space-y-1 text-white/60">
                    <li>🥇 <strong className="text-white/80">Top 2</strong> advance automatically (24 teams)</li>
                    <li>🥉 <strong className="text-white/80">Best 8 third-placed teams</strong> also advance</li>
                </ul>
                <p className="mt-3">
                    That gives us <strong>32 teams</strong> entering the knockout stage, which
                    then follows the familiar path: Round of 32 → Round of 16 → Quarter-Finals →
                    Semi-Finals → Final.
                </p>
                <p className="mt-3 text-white/50 text-xs">
                    Third-placed teams are ranked by points, then goal difference, then goals
                    scored — exactly as FIFA specifies.
                </p>
            </>
        ),
    },

    /* 12 — Sensitivity Analysis */
    {
        id: "sensitivity",
        icon: <Activity className="h-5 w-5" />,
        color: "text-[oklch(0.78_0.15_200)]",
        accentBg: "bg-[oklch(0.78_0.15_200/0.12)]",
        title: "Sensitivity Analysis",
        subtitle: "What happens when you change one thing at a time?",
        body: (
            <>
                <p>
                    The <strong>Analysis</strong> page sweeps each slider across its entire range
                    while keeping everything else at default. For each setting of the slider, it
                    runs hundreds of simulations and plots how the results change.
                </p>
                <p className="mt-3">
                    This answers questions like: &quot;Does cranking up the Upset Index make it
                    harder for top teams to win?&quot; (spoiler: yes, dramatically) or &quot;Does
                    the Entropy Multiplier affect who the favourite is?&quot;
                </p>
            </>
        ),
    },

    /* 13 — Key Metrics */
    {
        id: "metrics",
        icon: <Gauge className="h-5 w-5" />,
        color: "text-[oklch(0.87_0.17_85)]",
        accentBg: "bg-[oklch(0.87_0.17_85/0.12)]",
        title: "Key Metrics on the Dashboard",
        subtitle: "What all those numbers and charts actually mean.",
        body: (
            <div className="space-y-4">
                <div>
                    <p className="font-semibold text-purple-400 text-sm">📊 Tournament Entropy (bits)</p>
                    <p className="text-white/60 mt-1">
                        A fancy word for &quot;how unpredictable is the tournament?&quot; If one
                        team has a 99% chance of winning, entropy is near zero (boring, no surprise).
                        If every team has an equal shot, entropy is maximal (complete chaos). Higher
                        entropy = a more exciting, unpredictable tournament.
                    </p>
                </div>
                <div>
                    <p className="font-semibold text-red-400 text-sm">⚡ Upset Index</p>
                    <p className="text-white/60 mt-1">
                        The average probability that the lower-rated team wins a knockout match.
                        The higher this number, the more upsets are happening across the tournament.
                    </p>
                </div>
                <div>
                    <p className="font-semibold text-amber-400 text-sm">🎯 Penalty Shootout Rate</p>
                    <p className="text-white/60 mt-1">
                        The percentage of knockout matches that go to penalties. Historically,
                        about 15-20% of World Cup knockout games are decided by penalties.
                    </p>
                </div>
                <div>
                    <p className="font-semibold text-cyan-400 text-sm">📈 Top 5 Combined %</p>
                    <p className="text-white/60 mt-1">
                        The total championship probability of the five most likely winners. If this
                        is 80%, it means the top 5 teams have collected 80% of all the
                        &quot;wins&quot; in the simulation. A low number suggests the field is wide
                        open.
                    </p>
                </div>
            </div>
        ),
    },

    /* 14 — Volatility */
    {
        id: "volatility",
        icon: <Zap className="h-5 w-5" />,
        color: "text-yellow-400",
        accentBg: "bg-yellow-400/10",
        title: "Volatility — The Wild Cards",
        subtitle: "Some teams are harder to predict than others.",
        body: (
            <p>
                The dashboard highlights <strong>volatile teams</strong> — teams with a high
                uncertainty (σ) in their Elo rating. These are the wild cards: they could
                massively over-perform or crash out early. Think of a team with incredible
                talent but inconsistent form — their simulation results swing wildly between
                runs. The higher the sigma, the wider the range of possible outcomes.
            </p>
        ),
    },
]

/* ─── Page Component ──────────────────────────────────────────────── */

export default function MethodologyPage() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-10">
            {/* Hero */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-black uppercase tracking-tight md:text-5xl bg-gradient-to-r from-[oklch(0.85_0.22_155)] via-[oklch(0.78_0.15_200)] to-[oklch(0.87_0.17_85)] bg-clip-text text-transparent">
                    How It Works
                </h1>
                <p className="mt-4 text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Behind the predictions you see on this site is a sophisticated simulation
                    engine powered by real-world data. Don&apos;t worry — you don&apos;t need a
                    maths degree. Here&apos;s everything explained in plain football language.
                </p>
            </div>

            {/* Quick Overview Card */}
            <Card className="mb-10 bg-gradient-to-br from-[oklch(0.85_0.22_155/0.08)] to-[oklch(0.78_0.15_200/0.08)] border-white/10">
                <CardContent className="py-6 px-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white/80 mb-3">
                        TL;DR — The 30-Second Version
                    </h2>
                    <ol className="space-y-2 text-sm text-white/60 list-decimal list-inside">
                        <li>
                            Every team has a <strong className="text-white/80">power rating</strong>{" "}
                            (Elo) plus attack &amp; defense stats.
                        </li>
                        <li>
                            We simulate each match by generating a realistic{" "}
                            <strong className="text-white/80">scoreline</strong> based on those
                            stats.
                        </li>
                        <li>
                            We play the <strong className="text-white/80">entire tournament 10,000
                                times</strong> and count who wins.
                        </li>
                        <li>
                            The <strong className="text-white/80">percentages</strong> you see are
                            simply &quot;how many out of 10,000&quot;.
                        </li>
                        <li>
                            You can <strong className="text-white/80">twist the sliders</strong> to
                            explore what-if scenarios.
                        </li>
                    </ol>
                </CardContent>
            </Card>

            {/* Sections */}
            <div className="space-y-6">
                {sections.map((s, i) => (
                    <Card
                        key={s.id}
                        className="bg-card/80 backdrop-blur-sm border-white/10 overflow-hidden"
                    >
                        <CardContent className="py-6 px-6">
                            {/* Header */}
                            <div className="flex items-start gap-4">
                                <div className={`flex items-center justify-center h-10 w-10 rounded-xl shrink-0 ${s.accentBg}`}>
                                    <span className={s.color}>{s.icon}</span>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                            variant="outline"
                                            className="border-white/10 text-white/40 text-[9px] font-mono"
                                        >
                                            {String(i + 1).padStart(2, "0")}
                                        </Badge>
                                        <h2 className="text-base font-bold text-white">
                                            {s.title}
                                        </h2>
                                    </div>
                                    <p className="text-xs text-white/40 mt-1">{s.subtitle}</p>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="mt-4 text-sm text-white/70 leading-relaxed pl-14">
                                {s.body}
                            </div>

                            {/* Deep Dive Accordion */}
                            {s.deeper && (
                                <div className="mt-4 pl-14">
                                    <Accordion type="single" collapsible>
                                        <AccordionItem value="deeper" className="border-white/5">
                                            <AccordionTrigger className="text-xs text-white/30 hover:text-white/50 hover:no-underline py-2">
                                                Want to go deeper?
                                            </AccordionTrigger>
                                            <AccordionContent className="text-xs leading-relaxed">
                                                {s.deeper}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-xs text-white/30 max-w-xl mx-auto">
                <p>
                    All data is sourced from publicly available FIFA rankings, Elo ratings, and
                    team statistics. The simulation engine runs entirely in your browser — no
                    data is sent to any server. Results are probabilistic estimates, not
                    guaranteed outcomes.
                </p>
                <p className="mt-2">
                    Built with ❤️ for football fans who love the beautiful game — and a little
                    bit of maths.
                </p>
            </div>
        </div>
    )
}
