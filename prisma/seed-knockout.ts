import { PrismaClient } from "@prisma/client"
import teamsData from "../data/teams.json"

const prisma = new PrismaClient()

const roundOf32Matches = [
  { date: "2026-06-28", timeUTC: "19:00", teamAId: "south-africa", teamAName: "South Africa", teamBId: "canada", teamBName: "Canada", venue: "SoFi Stadium, Los Angeles" },
  { date: "2026-06-29", timeUTC: "17:00", teamAId: "brazil", teamAName: "Brazil", teamBId: "japan", teamBName: "Japan", venue: "NRG Stadium, Houston" },
  { date: "2026-06-29", timeUTC: "20:30", teamAId: "germany", teamAName: "Germany", teamBId: "paraguay", teamBName: "Paraguay", venue: "Gillette Stadium, Boston" },
  { date: "2026-06-29", timeUTC: "23:00", teamAId: "netherlands", teamAName: "Netherlands", teamBId: "morocco", teamBName: "Morocco", venue: "Estadio Monterrey, Monterrey" },
  { date: "2026-06-30", timeUTC: "18:00", teamAId: "ivory-coast", teamAName: "Ivory Coast", teamBId: "norway", teamBName: "Norway", venue: "AT&T Stadium, Dallas" },
  { date: "2026-06-30", timeUTC: "21:00", teamAId: "france", teamAName: "France", teamBId: "sweden", teamBName: "Sweden", venue: "MetLife Stadium, New York/New Jersey" },
  { date: "2026-06-30", timeUTC: "23:00", teamAId: "mexico", teamAName: "Mexico", teamBId: "ecuador", teamBName: "Ecuador", venue: "Estadio Azteca, Mexico City" },
  { date: "2026-07-01", timeUTC: "17:00", teamAId: "england", teamAName: "England", teamBId: "dr-congo", teamBName: "DR Congo", venue: "Mercedes-Benz Stadium, Atlanta" },
  { date: "2026-07-01", timeUTC: "20:00", teamAId: "belgium", teamAName: "Belgium", teamBId: "senegal", teamBName: "Senegal", venue: "Lumen Field, Seattle" },
  { date: "2026-07-01", timeUTC: "23:00", teamAId: "usa", teamAName: "USA", teamBId: "bosnia-herzegovina", teamBName: "Bosnia and Herzegovina", venue: "Levi's Stadium, San Francisco" },
  { date: "2026-07-02", timeUTC: "19:00", teamAId: "spain", teamAName: "Spain", teamBId: "austria", teamBName: "Austria", venue: "SoFi Stadium, Los Angeles" },
  { date: "2026-07-02", timeUTC: "22:00", teamAId: "portugal", teamAName: "Portugal", teamBId: "croatia", teamBName: "Croatia", venue: "BMO Field, Toronto" },
  { date: "2026-07-02", timeUTC: "01:00", teamAId: "switzerland", teamAName: "Switzerland", teamBId: "algeria", teamBName: "Algeria", venue: "BC Place, Vancouver" },
  { date: "2026-07-03", timeUTC: "17:00", teamAId: "australia", teamAName: "Australia", teamBId: "egypt", teamBName: "Egypt", venue: "AT&T Stadium, Dallas" },
  { date: "2026-07-03", timeUTC: "20:00", teamAId: "argentina", teamAName: "Argentina", teamBId: "cape-verde", teamBName: "Cape Verde", venue: "Hard Rock Stadium, Miami" },
  { date: "2026-07-03", timeUTC: "23:00", teamAId: "colombia", teamAName: "Colombia", teamBId: "ghana", teamBName: "Ghana", venue: "Arrowhead Stadium, Kansas City" }
]

function getRealTeamId(nameOrId: string) {
  const norm = nameOrId.toLowerCase().trim()
  
  const found = (teamsData as any[]).find(t => 
    t.name.toLowerCase().trim() === norm || 
    t.id.toLowerCase() === norm ||
    t.code.toLowerCase() === norm
  )
  
  if (found) return found.id
  
  if (norm === "usa" || norm === "united states") return "usa"
  if (norm === "bosnia-herzegovina" || norm === "bosnia and herzegovina") return "bih"
  if (norm === "south-africa") return "rsa"
  if (norm === "south-korea") return "kor"
  if (norm === "ivory-coast") return "civ"
  if (norm === "dr-congo" || norm === "dr congo") return "cod"
  if (norm === "cape-verde" || norm === "cape verde") return "cpv"
  
  console.warn(`Could not map team: ${nameOrId}, using it directly`)
  return nameOrId
}

async function main() {
  console.log("Seeding Round of 32 Matches...")

  // Delete all existing knockout matches to start fresh
  await prisma.match.deleteMany({
    where: { round: "roundOf32" }
  })
  
  for (let i = 0; i < roundOf32Matches.length; i++) {
    const m = roundOf32Matches[i]
    const realTeamA = getRealTeamId(m.teamAName)
    const realTeamB = getRealTeamId(m.teamBName)
    
    const kickoff = new Date(`${m.date}T${m.timeUTC}:00Z`)
    
    console.log(`Creating Match ${realTeamA} vs ${realTeamB}`)
    await prisma.match.create({
      data: {
        round: "roundOf32",
        groupId: null,
        matchOrder: i + 1,
        teamAId: realTeamA,
        teamBId: realTeamB,
        teamAName: m.teamAName,
        teamBName: m.teamBName,
        kickoffUTC: kickoff,
        venue: m.venue
      }
    })
  }
  
  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
