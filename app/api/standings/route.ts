import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import teamsData from "@/data/teams.json"
import type { GroupStanding, Team } from "@/lib/simulation"

const allTeams = teamsData as Team[]

export async function GET() {
  const groups: Record<string, Team[]> = {}
  for (const team of allTeams) {
    if (!groups[team.group]) groups[team.group] = []
    groups[team.group].push(team)
  }

  const factMatches = await prisma.match.findMany({
    where: { round: "group", isFact: true, scoreA: { not: null }, scoreB: { not: null } },
  })

  const standings: Record<string, GroupStanding[]> = {}

  for (const [group, groupTeams] of Object.entries(groups)) {
    const teamStandings: Record<string, GroupStanding> = {}

    for (const team of groupTeams) {
      teamStandings[team.id] = {
        teamId: team.id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      }
    }

    const groupMatches = factMatches.filter(m => m.groupId === group)

    for (const match of groupMatches) {
      if (!match.teamAId || !match.teamBId || match.scoreA === null || match.scoreB === null) continue

      const scoreA = match.scoreA
      const scoreB = match.scoreB
      const teamA = match.teamAId
      const teamB = match.teamBId

      const sA = teamStandings[teamA]
      const sB = teamStandings[teamB]
      if (!sA || !sB) continue

      sA.played++
      sB.played++
      sA.goalsFor += scoreA
      sA.goalsAgainst += scoreB
      sB.goalsFor += scoreB
      sB.goalsAgainst += scoreA

      if (scoreA > scoreB) {
        sA.won++
        sA.points += 3
        sB.lost++
      } else if (scoreB > scoreA) {
        sB.won++
        sB.points += 3
        sA.lost++
      } else {
        sA.drawn++
        sB.drawn++
        sA.points += 1
        sB.points += 1
      }

      sA.goalDifference = sA.goalsFor - sA.goalsAgainst
      sB.goalDifference = sB.goalsFor - sB.goalsAgainst
    }

    standings[group] = Object.values(teamStandings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })
  }

  return NextResponse.json({ standings, hasResults: factMatches.length > 0 })
}
