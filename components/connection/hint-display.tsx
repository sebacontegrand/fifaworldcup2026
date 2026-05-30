"use client"

import type { Player } from "@/lib/connection/types"
import { motion } from "motion/react"
import { Lightbulb } from "lucide-react"

interface HintDisplayProps {
  players: Player[]
  playerAName: string
  playerBName: string
}

export function HintDisplay({ players, playerAName, playerBName }: HintDisplayProps) {
  if (players.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="rounded-xl border border-gold/30 bg-gold/5 p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-gold" />
        <span className="text-xs font-bold text-gold">HINT</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Try connecting <span className="font-medium text-foreground">{playerAName}</span> and{" "}
        <span className="font-medium text-foreground">{playerBName}</span> through:
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {players.map((p) => (
          <span
            key={p.id}
            className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-foreground"
          >
            {p.name}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
