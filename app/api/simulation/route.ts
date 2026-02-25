import { NextResponse } from "next/server"
import { runFullSimulation } from "@/lib/simulation"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chaosFactor = searchParams.get("chaosFactor")
    
    const config = chaosFactor ? {
      teamSettings: {},
      globalSettings: {
        chaosFactor: parseFloat(chaosFactor)
      }
    } : undefined

    const results = runFullSimulation(config)
    
    return NextResponse.json(results)
  } catch (error) {
    console.error("Simulation API Error:", error)
    return NextResponse.json(
      { error: "Failed to run tournament simulation" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const results = runFullSimulation(body.config, body.tournamentState)
    return NextResponse.json(results)
  } catch (error) {
    console.error("Simulation API Error:", error)
    return NextResponse.json(
      { error: "Failed to run tournament simulation" },
      { status: 500 }
    )
  }
}
