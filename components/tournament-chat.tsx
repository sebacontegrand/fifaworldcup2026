"use client"

import { useState, useEffect, useRef } from "react"
import { Bot, Send, Loader2, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export function TournamentChat() {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [dailyMatches, setDailyMatches] = useState<string>("")
  const [dailyDate, setDailyDate] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch("/api/ai/analysis")
      .then(r => r.json())
      .then(d => setAvailable(d.available ?? false))
      .catch(() => setAvailable(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch("/api/daily-banner")
      .then(r => r.json())
      .then(d => {
        if (cancelled || d.matchCount === 0) return
        setDailyDate(d.date)
        const lines = d.matches.map((m: any) =>
          `${m.teamA} ${m.scoreA}-${m.scoreB} ${m.teamB}`
        )
        setDailyMatches(lines.join("\n"))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    const question = input.trim()
    if (!question || loading) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: question }])
    setLoading(true)
    setMessages(prev => [...prev, { role: "assistant", content: "" }])

    try {
      const systemContext: Record<string, any> = {}
      if (dailyMatches) {
        systemContext.dailyMatches = dailyMatches
        systemContext.dailyDate = dailyDate
      }

      const res = await fetch("/api/ai/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "chat", context: systemContext, question, stream: true }),
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
          } catch {}
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

  const dateLabel = dailyDate
    ? new Date(dailyDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "short", day: "numeric",
      })
    : ""

  if (available === false) {
    return (
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/5">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Ask the AI</span>
          <span className="text-[8px] text-white/20 ml-auto">Groq</span>
        </div>
        <div className="p-6 text-center">
          <p className="text-xs text-white/40 font-medium mb-1">GROQ_API_KEY not configured</p>
          <p className="text-[10px] text-white/20">Add it to .env.local to enable AI chat about the tournament.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/5">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          Ask the AI
        </span>
        {dailyDate && (
          <span className="text-[8px] text-white/30 font-mono flex items-center gap-1 ml-auto">
            <Calendar className="h-2.5 w-2.5" />
            {dateLabel}
          </span>
        )}
        <span className="text-[8px] text-white/20 ml-2">Groq</span>
      </div>

      <div className="h-[300px] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/30">
            <Bot className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs font-medium">
              Ask about the tournament or {dailyDate ? "yesterday's matches" : "any team"}
            </p>
            {dailyMatches && (
              <div className="mt-3 space-y-1">
                <p className="text-[9px] text-white/20 uppercase tracking-wider font-semibold">
                  Yesterday's Results
                </p>
                {dailyMatches.split("\n").map((line, i) => (
                  <p key={i} className="text-[10px] font-mono text-white/40">{line}</p>
                ))}
              </div>
            )}
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
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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
          placeholder="Ask about the tournament or yesterday's matches..."
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
    </div>
  )
}
