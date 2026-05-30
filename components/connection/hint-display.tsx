"use client"

import type { Player, HintType } from "@/lib/connection/types"
import { motion } from "motion/react"
import { Lightbulb, Users } from "lucide-react"

interface HintDisplayProps {
  players: Player[]
  playerAName: string
  playerBName: string
  hintType: HintType | null
}

export function HintDisplay({ players, playerAName, playerBName, hintType }: HintDisplayProps) {
  if (!hintType) return null

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

      {hintType === "path" && players.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            Try connecting{" "}
            <span className="font-medium text-foreground">{playerAName}</span> and{" "}
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
        </>
      )}

      {hintType === "direct" && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{playerAName}</span> and{" "}
          <span className="font-medium text-foreground">{playerBName}</span>{" "}
          have played on the same team. No intermediaries needed!
        </p>
      )}

      {hintType === "unavailable" && (
        <p className="text-xs text-muted-foreground">
          No path found between{" "}
          <span className="font-medium text-foreground">{playerAName}</span> and{" "}
          <span className="font-medium text-foreground">{playerBName}</span>{" "}
          within the allowed depth.
        </p>
      )}
    </motion.div>
  )
}