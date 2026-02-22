"use client"

import playersData from "@/data/players.json"
import { PlayerCard } from "@/components/player-card"
import Link from "next/link"

export default function PlayersPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                        Top <span className="text-gold text-glow-gold">Players</span>
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Ranked by expected impact based on 2025/2026 club performance.
                    </p>
                </div>
                <Link
                    href="/"
                    className="rounded-lg border border-border/50 bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary"
                >
                    Back to Home
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {playersData.map((player: any) => (
                    <PlayerCard key={player.rank} player={player} />
                ))}
            </div>
        </div>
    )
}
