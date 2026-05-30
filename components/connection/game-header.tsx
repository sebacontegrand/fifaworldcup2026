"use client"

import { useConnectionGame } from "@/hooks/connection/use-connection-game"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Lightbulb, RotateCcw, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

export function GameHeader() {
  const { elapsedTime, score, difficulty, mode, isComplete, resetGame, getHintAction, showHint } =
    useConnectionGame()

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm font-mono">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={cn("tabular-nums", elapsedTime > 240 ? "text-destructive" : "text-foreground")}>
            {formatTime(elapsedTime)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-mono">
          <Trophy className="h-4 w-4 text-gold" />
          <span className="text-gold font-bold">{score}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-neon/30 text-neon">
          {difficulty}
        </Badge>
        <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-cyan/30 text-cyan">
          {mode}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={getHintAction}
          disabled={isComplete}
          className="h-8 text-xs"
        >
          <Lightbulb className="h-3.5 w-3.5 mr-1" />
          Hint
        </Button>
        <Button size="sm" variant="ghost" onClick={resetGame} className="h-8 text-xs">
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          New
        </Button>
      </div>
    </div>
  )
}
