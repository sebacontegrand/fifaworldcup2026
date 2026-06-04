"use client"

import { useState, useRef, useEffect } from "react"
import { useSimulation } from "@/lib/hooks/use-simulation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MessageCircle, Send, Loader2, Brain, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export function AiChat() {
  const { result } = useSimulation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch("/api/ai/analysis")
      .then(r => r.json())
      .then(d => setAvailable(d.available ?? false))
      .catch(() => setAvailable(false))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const buildChatContext = () => {
    if (!result) return {}
    const top5 = Object.entries(result.teamProbabilities)
      .sort(([, a], [, b]) => b.champion - a.champion)
      .slice(0, 5)
      .map(([id, p]) => ({ id, champPct: Math.round(p.champion * 100) / 100 }))

    const tightest = Object.entries(result.matchupProbabilities)
      .sort(([, a], [, b]) => Math.abs(a.winA - 50) - Math.abs(b.winA - 50))
      .slice(0, 3)
      .map(([key, m]) => ({ matchup: key, winA: Math.round(m.winA), winB: Math.round(m.winB) }))

    return {
      topTeams: top5,
      tightestMatchups: tightest,
      entropy: Math.round(result.extendedMetrics.tournamentEntropy * 100) / 100,
      upsetIndex: result.extendedMetrics.upsetIndex.slice(0, 3),
    }
  }

  const sendMessage = async () => {
    const question = input.trim()
    if (!question || loading) return

    setInput("")
    setMessages(prev => [...prev, { role: "user", content: question }])
    setLoading(true)

    setMessages(prev => [...prev, { role: "assistant", content: "" }])

    try {
      const context = buildChatContext()
      const res = await fetch("/api/ai/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          context,
          question,
          stream: true,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to generate response")
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

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
            if (json.content) {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === "assistant") {
                  updated[updated.length - 1] = { ...last, content: last.content + json.content }
                }
                return updated
              })
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "assistant",
          content: err instanceof Error ? err.message : "Failed to generate response",
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (available !== true) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
            open
              ? "bg-white/10 text-white border border-white/20"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md max-h-[80vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="px-4 py-3 border-b border-white/10">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold">
            <Brain className="h-4 w-4 text-primary" />
            AI Chat
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-white/30 py-12">
              <Brain className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs font-medium">Ask anything about the tournament</p>
              <p className="text-[10px] mt-1 text-white/20">
                {result ? "Simulation data is loaded" : "Run a simulation first for richer answers"}
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "bg-primary/20 text-primary-foreground border border-primary/30"
                    : "bg-white/5 text-white/80 border border-white/10"
                )}
              >
                {msg.role === "assistant" && msg.content === "" && loading ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-xs text-white/40">Thinking...</span>
                  </div>
                ) : msg.role === "assistant" ? (
                  <div
                    className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-primary [&_h3]:mb-1"
                    dangerouslySetInnerHTML={{ __html: formatAnalysis(msg.content) }}
                  />
                ) : (
                  <span className="text-xs">{msg.content}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/10 p-3 flex items-center gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the tournament..."
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/30 resize-none"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatAnalysis(text: string): string {
  return text
    .replace(/### (.+)/g, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n(?=\d\.|[-*])/g, "<br/>")
    .replace(/^- (.+)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n(?!<)/g, " ")
    .replace(/\s{2,}/g, " ")
}
