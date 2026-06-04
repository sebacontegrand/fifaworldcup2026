"use client"

import { useState, useMemo } from "react"
import { useSimulation } from "@/lib/hooks/use-simulation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Sparkles, Loader2, Brain, BookOpen, Zap, Swords, AlertCircle, Telescope } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

type AnalysisType = "narrative" | "cinderella" | "bracket" | "betting"

interface AnalysisTab {
  key: AnalysisType
  label: string
  icon: React.ReactNode
  description: string
}

const TABS: AnalysisTab[] = [
  { key: "narrative", label: "Narrative", icon: <BookOpen className="h-3 w-3" />, description: "How the tournament unfolds" },
  { key: "cinderella", label: "Cinderella", icon: <Telescope className="h-3 w-3" />, description: "Surprise deep-run candidates" },
  { key: "bracket", label: "Bracket Intel", icon: <Swords className="h-3 w-3" />, description: "Key matchups & bracket strength" },
  { key: "betting", label: "Betting Edge", icon: <Zap className="h-3 w-3" />, description: "High-value match predictions" },
]

function buildContext(result: NonNullable<ReturnType<typeof useSimulation>["result"]>) {
  const top10 = Object.entries(result.teamProbabilities)
    .sort(([, a], [, b]) => b.champion - a.champion)
    .slice(0, 10)
    .map(([id, p]) => {
      const team = Object.values(result.groupStandings).flat().find(s => s.teamId === id)
      return { id, champPct: p.champion, groupPosition: team ? 1 : 2 }
    })

  const topMatchups = Object.entries(result.matchupProbabilities)
    .sort(([, a], [, b]) => Math.abs(a.winA - 50) - Math.abs(b.winA - 50))
    .slice(0, 8)
    .map(([key, m]) => ({
      teams: key,
      winA: m.winA,
      winB: m.winB,
      draw: m.draw,
      expectedGoalsA: m.expectedGoalsA,
      expectedGoalsB: m.expectedGoalsB,
    }))

  return {
    topTeams: top10,
    tightestMatchups: topMatchups,
    entropy: result.extendedMetrics.tournamentEntropy,
    upsetIndex: result.extendedMetrics.upsetIndex.slice(0, 5),
    rounds: result.knockoutBracket.map(r => ({
      round: r.round,
      matchCount: r.matches.length,
    })),
  }
}

export function AiAnalysisPanel() {
  const { result, isRunning } = useSimulation()
  const [activeTab, setActiveTab] = useState<AnalysisType>("narrative")
  const [analysis, setAnalysis] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, string>>({})
  const [available, setAvailable] = useState<boolean | null>(null)

  // Check if API is configured
  useState(() => {
    fetch("/api/ai/analysis")
      .then(r => r.json())
      .then(d => setAvailable(d.available ?? false))
      .catch(() => setAvailable(false))
  })

  const context = useMemo(() => result ? buildContext(result) : null, [result])

  if (isRunning || !result) return null

  const generate = async (type: AnalysisType) => {
    if (!context) return
    if (analysis[type]) {
      setActiveTab(type)
      return
    }

    setLoading(prev => ({ ...prev, [type]: true }))
    setError(prev => ({ ...prev, [type]: "" }))

    try {
      const res = await fetch("/api/ai/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, context }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to generate analysis")
      }

      const data = await res.json()
      setAnalysis(prev => ({ ...prev, [type]: data.content }))
      setActiveTab(type)
    } catch (err) {
      setError(prev => ({ ...prev, [type]: err instanceof Error ? err.message : "Unknown error" }))
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  if (available === null) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardContent className="py-6 text-center text-white/30 text-xs">
          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
          Checking AI availability...
        </CardContent>
      </Card>
    )
  }

  if (!available) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-amber-500/20">
        <CardContent className="py-4 flex items-center gap-3 text-xs text-amber-400/60">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>AI analysis requires a <code className="text-amber-300">GROQ_API_KEY</code> in your environment variables.</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/10 overflow-hidden">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-2 text-primary">
            <Brain className="h-3.5 w-3.5" />
            AI Analysis
          </CardTitle>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] px-1.5 py-0">
            Powered by Groq
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* Tab bar */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                if (analysis[tab.key] || loading[tab.key]) {
                  setActiveTab(tab.key)
                } else {
                  generate(tab.key)
                }
              }}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-all",
                activeTab === tab.key && analysis[tab.key]
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : analysis[tab.key]
                    ? "bg-white/5 text-white/60 border border-white/10"
                    : "bg-white/5 text-white/30 border border-transparent hover:text-white/50"
              )}
            >
              {loading[tab.key] ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                tab.icon
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Analysis content */}
        <div className="min-h-[120px]">
          <AnimatePresence mode="wait">
            {loading[activeTab] ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-xs text-white/40 py-6"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating {TABS.find(t => t.key === activeTab)?.description.toLowerCase()}...
              </motion.div>
            ) : error[activeTab] ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400/70 py-4"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{error[activeTab]}</span>
                </div>
                <button
                  onClick={() => generate(activeTab)}
                  className="mt-2 text-[10px] font-bold text-primary hover:underline"
                >
                  Try again
                </button>
              </motion.div>
            ) : analysis[activeTab] ? (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="prose prose-invert prose-xs max-w-none text-xs text-white/80 leading-relaxed [&_strong]:text-white [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-primary [&_h3]:mt-3 [&_h3]:mb-1"
                dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis[activeTab]) }}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-6 text-white/30"
              >
                <Sparkles className="h-6 w-6 mb-2" />
                <p className="text-xs font-medium">Click a tab to generate AI analysis</p>
                <p className="text-[10px] mt-0.5">Based on {context?.topTeams.length ?? 0} teams and current bracket seeding</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
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
