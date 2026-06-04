import { NextRequest, NextResponse } from "next/server"
import { generateAnalysis, buildSystemPrompt, generateStreamingAnalysis } from "@/lib/ai/groq"

interface AnalysisRequest {
  type: "bracket" | "simulation" | "cinderella" | "betting" | "narrative" | "chat"
  context: Record<string, unknown>
  question?: string
  stream?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalysisRequest = await req.json()
    const { type, context, question, stream } = body

    if (!type) {
      return NextResponse.json({ error: "Missing analysis type" }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(type, context)

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(question
        ? [{ role: "user" as const, content: question }]
        : [{ role: "user" as const, content: "Provide the analysis." }]
      ),
    ]

    if (stream) {
      const encoder = new TextEncoder()
      const groqStream = generateStreamingAnalysis(messages)

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of groqStream) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Stream failed"
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        },
      })

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    const content = await generateAnalysis(messages)

    return NextResponse.json({ content, type, cached: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    const status = err instanceof Error && "status" in err ? (err as any).status : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function GET() {
  return NextResponse.json({
    available: !!process.env.GROQ_API_KEY,
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
    analysisTypes: ["bracket", "simulation", "cinderella", "betting", "narrative", "chat"],
  })
}
