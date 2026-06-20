"use client"

import { useState, useEffect } from "react"
import { GroupTable } from "@/components/group-table"
import teamsData from "@/data/teams.json"
import type { Team, GroupStanding } from "@/lib/simulation"
import Link from "next/link"
import { Trophy, RefreshCw } from "lucide-react"

const allTeams = teamsData as Team[]
const teamMap: Record<string, Team> = {}
for (const team of allTeams) teamMap[team.id] = team

const GROUP_ORDER = "ABCDEFGHIJKL".split("")

export function LiveGroupStandings() {
  const [standings, setStandings] = useState<Record<string, GroupStanding[]> | null>(null)
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchStandings = async () => {
      try {
        const res = await fetch("/api/standings")
        const data = await res.json()
        if (!cancelled) {
          setStandings(data.standings)
          setHasResults(data.hasResults)
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchStandings()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2 text-white/40">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider">Loading standings...</span>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
            Live Group Standings
          </h2>
          {hasResults && (
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-400">
              Live
            </span>
          )}
        </div>
        <Link
          href="/groups"
          className="text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
        >
          All Groups →
        </Link>
      </div>

      {!hasResults ? (
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
          <Trophy className="mx-auto mb-3 h-8 w-8 text-white/20" />
          <p className="text-sm font-bold text-white/40 uppercase tracking-wider">
            No live results yet
          </p>
          <p className="mt-1 text-xs text-white/20">
            Group standings will appear here once matches are played.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {GROUP_ORDER.map((g) => {
            const groupStandings = standings?.[g]
            if (!groupStandings || groupStandings.every(s => s.played === 0)) return null
            return (
              <GroupTable
                key={g}
                group={g}
                standings={groupStandings}
                teams={teamMap}
                compact
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
