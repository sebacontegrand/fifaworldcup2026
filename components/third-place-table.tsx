"use client"

import { useState, useEffect } from "react"
import { getFlagImageUrl } from "@/lib/team-flags"
import teamsData from "@/data/teams.json"
import type { Team, GroupStanding } from "@/lib/simulation"
import { cn } from "@/lib/utils"

const allTeams = teamsData as Team[]
const teamMap: Record<string, Team> = {}
for (const team of allTeams) teamMap[team.id] = team

export function ThirdPlaceTable() {
  const [thirdPlaced, setThirdPlaced] = useState<ThirdPlaceRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const res = await fetch("/api/standings")
        const data = await res.json()
        if (!cancelled && data.standings) {
          const rows: ThirdPlaceRow[] = []
          for (const [group, groupStandings] of Object.entries(data.standings as Record<string, GroupStanding[]>)) {
            const third = groupStandings[2]
            if (third && third.played > 0) {
              rows.push({
                group,
                teamId: third.teamId,
                teamName: teamMap[third.teamId]?.name ?? third.teamId,
                points: third.points,
                goalDifference: third.goalDifference,
                goalsFor: third.goalsFor,
                played: third.played,
              })
            }
          }
          rows.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
            return b.goalsFor - a.goalsFor
          })
          setThirdPlaced(rows.map((r, i) => ({ ...r, rank: i + 1, qualified: i < 8 })))
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  if (loading) return null
  if (thirdPlaced.length === 0) return null

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="bg-white/[0.03] border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          Third-Place Ranking
          <span className="text-[9px] font-normal text-white/40 normal-case">(top 8 advance to R32)</span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/40 w-8">#</th>
              <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/40 w-10">Group</th>
              <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/40">Team</th>
              <th className="text-center px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/40">Pts</th>
              <th className="text-center px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">GD</th>
              <th className="text-center px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">GF</th>
              <th className="text-center px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/40 w-16">Status</th>
            </tr>
          </thead>
          <tbody>
            {thirdPlaced.map((row) => {
              const cutOff = row.rank === 8
              return (
                <tr key={row.teamId} className={cn(
                  "border-b border-white/5 last:border-0 transition-colors",
                  cutOff && "border-dashed border-yellow-500/30",
                  row.qualified ? "hover:bg-emerald-500/5" : "hover:bg-red-500/5"
                )}>
                  <td className={cn(
                    "px-3 py-2.5 font-bold",
                    row.qualified ? "text-emerald-400" : "text-red-400"
                  )}>
                    {row.rank}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono font-bold text-white/40">Group {row.group}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img src={getFlagImageUrl(row.teamId, 20)} alt="" className="h-4 w-4 object-contain" />
                      <span className="font-medium text-white/80 truncate max-w-[120px]">{row.teamName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold">{row.points}</td>
                  <td className={cn(
                    "px-3 py-2.5 text-center font-mono tabular-nums hidden sm:table-cell",
                    row.goalDifference > 0 ? "text-emerald-400" : row.goalDifference < 0 ? "text-red-400" : "text-white/40"
                  )}>
                    {row.goalDifference > 0 ? "+" : ""}{row.goalDifference}
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono tabular-nums text-white/60 hidden sm:table-cell">{row.goalsFor}</td>
                  <td className="px-3 py-2.5 text-center">
                    {row.qualified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                        R32
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
                        Eliminated
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {thirdPlaced.length > 0 && (
        <div className="border-t border-white/5 px-4 py-2 text-[9px] text-white/30 text-center">
          12 groups × 3rd place = 12 teams · Top 8 advance to Round of 32 · Bottom 4 eliminated
        </div>
      )}
    </div>
  )
}

interface ThirdPlaceRow {
  rank: number
  group: string
  teamId: string
  teamName: string
  points: number
  goalDifference: number
  goalsFor: number
  played: number
  qualified: boolean
}
