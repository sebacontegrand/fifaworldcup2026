const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

const MODELS = {
  fast: "llama-3.1-8b-instant",
  versatile: "llama-3.3-70b-versatile",
} as const

interface GroqMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface GroqResponse {
  id: string
  choices: {
    index: number
    message: { role: string; content: string }
    finish_reason: string
  }[]
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

export class GroqError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = "GroqError"
  }
}

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    throw new GroqError("GROQ_API_KEY not configured")
  }
  return key
}

export async function generateAnalysis(
  messages: GroqMessage[],
  opts?: { model?: "fast" | "versatile"; maxTokens?: number; temperature?: number }
): Promise<string> {
  const apiKey = getApiKey()
  const model = MODELS[opts?.model ?? "versatile"]

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: opts?.maxTokens ?? 1024,
      temperature: opts?.temperature ?? 0.7,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new GroqError(`Groq API error (${res.status}): ${body}`, res.status)
  }

  const data: GroqResponse = await res.json()
  return data.choices[0]?.message?.content ?? ""
}

export async function* generateStreamingAnalysis(
  messages: GroqMessage[],
  opts?: { model?: "fast" | "versatile"; maxTokens?: number; temperature?: number }
): AsyncGenerator<string> {
  const apiKey = getApiKey()
  const model = MODELS[opts?.model ?? "versatile"]

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: opts?.maxTokens ?? 1024,
      temperature: opts?.temperature ?? 0.7,
      stream: true,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new GroqError(`Groq API error (${res.status}): ${body}`, res.status)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new GroqError("No response body")

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed === "data: [DONE]") continue
      if (!trimmed.startsWith("data: ")) continue

      try {
        const json = JSON.parse(trimmed.slice(6))
        const content = json.choices?.[0]?.delta?.content
        if (content) yield content
      } catch {
        // skip malformed chunks
      }
    }
  }
}

export function buildSystemPrompt(type: string, context: Record<string, unknown>): string {
  const basePrompt = `You are an AI football analyst for the 2026 FIFA World Cup. You provide concise, insightful analysis based on Monte Carlo simulation data. Keep responses under 200 words. Use markdown formatting.`

  const typeSpecific: Record<string, string> = {
    simulation: `Analyze these simulation results. Focus on the most likely bracket path, the champion favorite's projected journey, and any high-variance teams. Context: ${JSON.stringify(context)}`,

    bracket: `Analyze this tournament bracket. Highlight the most competitive potential matchups, any projected upsets, and which half of the bracket is stronger. Context: ${JSON.stringify(context)}`,

    cinderella: `Identify teams outside the top 10 in championship probability that have a realistic path to the semifinals based on their bracket draw. For each, explain the path. Context: ${JSON.stringify(context)}`,

    betting: `Based on the simulation probabilities, identify matches where the projected winner has less than 60% confidence — these are high-value betting opportunities. Context: ${JSON.stringify(context)}`,

    narrative: `Write a brief narrative of how the tournament is projected to unfold based on simulation data. Include the champion, key bracket storylines, and any surprise deep runs. Context: ${JSON.stringify(context)}`,

    chat: `The user is asking a free-form question about the 2026 FIFA World Cup simulation. Use the provided simulation context to answer conversationally but concisely. When relevant, refer to specific teams, probabilities, or matchups from the data. If the question is general football knowledge, answer from your training. Context: ${JSON.stringify(context)}`,
  }

  const prompt = typeSpecific[type] ?? `Analyze the tournament data. Context: ${JSON.stringify(context)}`

  return `${basePrompt}\n\n${prompt}`
}
