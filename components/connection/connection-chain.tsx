"use client"

import type { Player } from "@/lib/connection/types"
import { PlayerCard } from "./player-card"
import { Button } from "@/components/ui/button"
import { X, ChevronDown } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface ConnectionChainProps {
  playerA: Player
  playerB: Player
  chain: Player[]
  onRemove: (index: number) => void
  editable?: boolean
}

export function ConnectionChain({ playerA, playerB, chain, onRemove, editable = true }: ConnectionChainProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <PlayerCard player={playerA} label="START" variant="start" />
      {chain.map((player, i) => (
        <motion.div
          key={`${player.id}-${i}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          className="relative flex flex-col items-center"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ChevronDown className="h-4 w-4" />
            <span className={cn("font-mono text-[10px]", "text-neon/70")}>CONNECTION {i + 1}</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          <div className="relative">
            <PlayerCard player={player} variant="chain" />
            {editable && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onRemove(i)}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </motion.div>
      ))}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ChevronDown className="h-4 w-4" />
        <span className="font-mono text-[10px] text-gold/70">TARGET</span>
        <ChevronDown className="h-4 w-4" />
      </div>
      <PlayerCard player={playerB} label="END" variant="end" />
    </div>
  )
}
