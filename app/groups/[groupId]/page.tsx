"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { useSimulation } from "@/lib/hooks/use-simulation"
import teamsData from "@/data/teams.json"
import type { Team } from "@/lib/simulation"
import { getMatchupKey } from "@/lib/simulation"
import { GroupTable } from "@/components/group-table"
import { TeamCard } from "@/components/team-card"
import { MatchCard } from "@/components/match-card"
import { MatchProbabilityBar } from "@/components/probability-bar"
import { StageProbabilityChart } from "@/components/stage-probability-chart"

const allTeams = teamsData as Team[]
const teamMap: Record<string, Team> = {}
for (const team of allTeams) {
  teamMap[team.id] = team
}

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = use(params)
  const groupLetter = groupId.toUpperCase()
  const { result, isRunning } = useSimulation()

  const groupTeams = allTeams.filter((t) => t.group === groupLetter)
  if (groupTeams.length === 0) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-black text-primary-foreground">
            {groupLetter}
          </span>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
              Group {groupLetter}
            </h1>
            <p className="text-sm text-muted-foreground">
              {groupTeams.length} teams | Top 2 advance + possible best 3rd
            </p>
          </div>
        </div>
      </div>

      {isRunning && (
        <div className="mb-8 flex items-center justify-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-primary">
            Running simulations...
          </span>
        </div>
      )}

      {result && (
        <>
          {/* Group Table */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Simulated Standings
            </h2>
            <GroupTable
              group={groupLetter}
              standings={result.groupStandings[groupLetter] || []}
              teams={teamMap}
            />
          </section>

          {/* Head-to-Head Matches */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Match Predictions
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {result.groupMatches[groupLetter]?.map((match, idx) => {
                const tA = teamMap[match.teamA]
                const tB = teamMap[match.teamB]
                if (!tA || !tB) return null

                const probKey = getMatchupKey(tA.id, tB.id)
                const prob = result.matchupProbabilities[probKey]

                return (
                  <div key={idx} className="flex flex-col gap-3">
                    <MatchCard
                      teamA={tA}
                      teamB={tB}
                      result={match}
                      probability={prob}
                    />
                    {prob && (
                      <MatchProbabilityBar
                        teamAName={tA.name}
                        teamBName={tB.name}
                        teamAFlag={tA.flag}
                        teamBFlag={tB.flag}
                        winA={prob.winA}
                        draw={prob.draw}
                        winB={prob.winB}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Team Stage Probabilities */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Tournament Progression Probability
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {groupTeams.map((team) =>
                result.teamProbabilities[team.id] ? (
                  <div
                    key={team.id}
                    className="rounded-xl border border-border/50 bg-card p-4"
                  >
                    <StageProbabilityChart
                      probability={result.teamProbabilities[team.id]}
                      teamName={`${team.flag} ${team.name}`}
                    />
                  </div>
                ) : null
              )}
            </div>
          </section>
        </>
      )}

      {/* Team Cards */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Team Profiles
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {groupTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              probability={result?.teamProbabilities[team.id]?.champion}
              showGroup={false}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
