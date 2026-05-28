import { PrismaClient } from "@prisma/client"
import teamsData from "../data/teams.json"

const prisma = new PrismaClient()

type Team = {
  id: string
  name: string
  code: string
  flag: string
  group: string
  fifaRanking: number
  confederation: string
  eloRating: number
  attackStrength: number
  defenseStrength: number
  eloSigma: number
  topPlayers: { name: string; position: string; club: string; age: number }[]
  stats: { worldCupAppearances: number; bestFinish: string; recentForm: string }
}

async function main() {
  const teams = teamsData as Team[]

  // Clear existing matches and guesses before reseeding
  await prisma.guess.deleteMany()
  await prisma.match.deleteMany()
  console.log("Cleared existing matches and guesses")

  // Group teams by group
  const groups: Record<string, Team[]> = {}
  for (const team of teams) {
    if (!groups[team.group]) groups[team.group] = []
    groups[team.group].push(team)
  }

  const groupIds = Object.keys(groups).sort()

  // --- Group stage matches (round-robin within each group) ---
  let groupMatchOrder = 0
  const groupMatches: { groupId: string; teamA: Team; teamB: Team; order: number }[] = []

  for (const groupId of groupIds) {
    const groupTeams = groups[groupId]
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        groupMatches.push({
          groupId,
          teamA: groupTeams[i],
          teamB: groupTeams[j],
          order: groupMatchOrder++,
        })
      }
    }
  }

  for (const gm of groupMatches) {
    await prisma.match.create({
      data: {
        round: "group",
        groupId: gm.groupId,
        matchOrder: gm.order,
        teamAId: gm.teamA.id,
        teamBId: gm.teamB.id,
        teamAName: gm.teamA.name,
        teamBName: gm.teamB.name,
      },
    })
  }
  console.log(`Created ${groupMatches.length} group stage matches`)

  // --- Knockout stage match slots ---
  const knockoutRounds = [
    { round: "roundOf32", matchCount: 16 },
    { round: "roundOf16", matchCount: 8 },
    { round: "quarterFinal", matchCount: 4 },
    { round: "semiFinal", matchCount: 2 },
    { round: "final", matchCount: 1 },
  ]

  let knockoutTotal = 0
  for (const kr of knockoutRounds) {
    for (let i = 0; i < kr.matchCount; i++) {
      await prisma.match.create({
        data: {
          round: kr.round,
          groupId: null,
          matchOrder: i,
          teamAId: null,
          teamBId: null,
          teamAName: null,
          teamBName: null,
        },
      })
      knockoutTotal++
    }
  }
  console.log(`Created ${knockoutTotal} knockout match slots`)

  const total = groupMatches.length + knockoutTotal
  console.log(`Total matches created: ${total}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
