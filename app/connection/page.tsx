"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Gamepad2, Zap, Infinity, Clock, Shield, Trophy } from "lucide-react"
import type { Difficulty, GameMode } from "@/lib/connection/types"

const difficulties: { key: Difficulty; label: string; description: string; icon: string }[] = [
  { key: "easy", label: "Easy", description: "1 connection", icon: "●" },
  { key: "medium", label: "Medium", description: "2 connections", icon: "●●" },
  { key: "hard", label: "Hard", description: "3 connections", icon: "●●●" },
  { key: "expert", label: "Expert", description: "4 connections", icon: "●●●●" },
]

const modes: { key: GameMode; label: string; description: string; icon: React.ReactNode }[] = [
  { key: "daily", label: "Daily Challenge", description: "Same pair for everyone", icon: <Zap className="h-4 w-4" /> },
  { key: "infinite", label: "Infinite Mode", description: "Random pairs forever", icon: <Infinity className="h-4 w-4" /> },
  { key: "hardcore", label: "Hardcore", description: "No autocomplete", icon: <Shield className="h-4 w-4" /> },
  { key: "timed", label: "Timed Mode", description: "60 seconds", icon: <Clock className="h-4 w-4" /> },
]

export default function ConnectionPage() {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [mode, setMode] = useState<GameMode>("infinite")

  function handlePlay() {
    router.push(`/connection/play?difficulty=${difficulty}&mode=${mode}`)
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary glow-neon">
            <Gamepad2 className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-wider text-foreground">
          Football <span className="text-primary">Connections</span>
        </h1>
        <p className="mt-2 text-xs text-muted-foreground max-w-md">
          Connect two football players through their shared teammates. The shortest path wins.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full space-y-6"
      >
        <div>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Difficulty
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {difficulties.map((d) => (
              <button
                key={d.key}
                onClick={() => setDifficulty(d.key)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                  difficulty === d.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                <span className="text-lg">{d.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{d.label}</span>
                <span className="text-[8px] text-muted-foreground">{d.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Game Mode
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                  mode === m.key
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border/50 bg-card text-muted-foreground hover:border-gold/30 hover:text-foreground"
                )}
              >
                {m.icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                <span className="text-[8px] text-muted-foreground text-center">{m.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={handlePlay}
            className="flex-1 h-12 text-sm font-black uppercase tracking-widest glow-neon"
          >
            <Zap className="h-5 w-5 mr-2" />
            Play
          </Button>
          <Link href="/connection/leaderboard">
            <Button
              variant="outline"
              size="lg"
              className="h-12 border-white/10 text-xs font-bold uppercase tracking-wider"
            >
              <Trophy className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <p className="text-center text-[9px] text-muted-foreground">
          Powered by TheSportsDB — {difficulties.find((d) => d.key === difficulty)?.description} max
        </p>
      </motion.div>
    </div>
  )
}
