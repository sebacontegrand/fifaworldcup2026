import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const config = await prisma.simulationConfig.findUnique({ where: { id: "simulation" } })
    return NextResponse.json(config ?? { config: {}, tournamentState: {}, currentTournamentDate: "2026-06-18" })
  } catch (error) {
    console.error("Failed to load simulation config:", error)
    return NextResponse.json({ config: {}, tournamentState: {}, currentTournamentDate: "2026-06-18" })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const data = await prisma.simulationConfig.upsert({
      where: { id: "simulation" },
      update: {
        config: body.config ?? {},
        tournamentState: body.tournamentState ?? {},
        currentTournamentDate: body.currentTournamentDate ?? "2026-06-18",
      },
      create: {
        id: "simulation",
        config: body.config ?? {},
        tournamentState: body.tournamentState ?? {},
        currentTournamentDate: body.currentTournamentDate ?? "2026-06-18",
      },
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to save simulation config:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
