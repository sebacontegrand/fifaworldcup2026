"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { ChipCounter } from "@/components/games/chip-counter"
import { cn } from "@/lib/utils"
import { getChips } from "@/lib/games/chips"
import {
  Gamepad2,
  Flag,
  Shirt,
  Users,
  Shuffle,
  Zap,
} from "lucide-react"

const triviaTypes = [
  {
    key: "flag" as const,
    label: "Flag Trivia",
    description: "Identify the team from their flag",
    icon: <Flag className="h-5 w-5" />,
    color: "border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10",
    iconBg: "bg-primary/20 text-primary",
  },
  {
    key: "kit" as const,
    label: "Kit Trivia",
    description: "Name the team from their kit colors",
    icon: <Shirt className="h-5 w-5" />,
    color: "border-cyan/50 hover:border-cyan bg-cyan/5 hover:bg-cyan/10",
    iconBg: "bg-cyan/20 text-cyan",
  },
  {
    key: "player" as const,
    label: "Player Trivia",
    description: "Guess the player from their details",
    icon: <Users className="h-5 w-5" />,
    color: "border-gold/50 hover:border-gold bg-gold/5 hover:bg-gold/10",
    iconBg: "bg-gold/20 text-gold",
  },
]

const difficulties = [
  { key: "easy" as const, label: "Easy", desc: "5 questions", icon: "●" },
  { key: "medium" as const, label: "Medium", desc: "10 questions", icon: "●●" },
  { key: "hard" as const, label: "Hard", desc: "15 questions", icon: "●●●" },
]

const sortOptions = [
  {
    key: "teams" as const,
    label: "Sort Teams",
    description: "By FIFA rank, Elo, A-Z, or group",
    icon: <Shuffle className="h-5 w-5" />,
    color: "border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10",
    iconBg: "bg-primary/20 text-primary",
  },
  {
    key: "players" as const,
    label: "Sort Players",
    description: "By goals, assists, age, rank, or score",
    icon: <Users className="h-5 w-5" />,
    color: "border-gold/50 hover:border-gold bg-gold/5 hover:bg-gold/10",
    iconBg: "bg-gold/20 text-gold",
  },
]

export default function GamesPage() {
  const router = useRouter()
  const [chips, setChips] = useState(getChips())

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-4 py-12">
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
          Games <span className="text-primary">Hub</span>
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Play trivia and sorting games to earn chips
        </p>
        <div className="mt-4 flex justify-center">
          <ChipCounter chips={chips} />
        </div>
      </motion.div>

      {/* Trivia Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Zap className="h-3 w-3" />
          Trivia Games
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {triviaTypes.map((t) => (
            <motion.button
              key={t.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/games/trivia?type=${t.key}&difficulty=easy`)}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all",
                t.color
              )}
            >
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", t.iconBg)}>
                {t.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {t.label}
                </h3>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {t.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Sort Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Shuffle className="h-3 w-3" />
          Sort It Out
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {sortOptions.map((s) => (
            <motion.button
              key={s.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/games/sort?target=${s.key}&difficulty=easy`)}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all",
                s.color
              )}
            >
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", s.iconBg)}>
                {s.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {s.label}
                </h3>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {s.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Difficulty */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-border/50 bg-card p-4"
      >
        <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Difficulty Guide
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {difficulties.map((d) => (
            <div
              key={d.key}
              className="flex items-center gap-3 rounded-lg border border-border/30 bg-secondary/50 px-3 py-2"
            >
              <span className="text-sm text-primary">{d.icon}</span>
              <div>
                <span className="text-xs font-bold text-foreground">{d.label}</span>
                <span className="ml-2 text-[10px] text-muted-foreground">{d.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
