"use client"

import { Suspense, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useConnectionGame } from "@/hooks/connection/use-connection-game"
import { PlayerCard } from "@/components/connection/player-card"
import { SearchBar } from "@/components/connection/search-bar"
import { ConnectionChain } from "@/components/connection/connection-chain"
import { GameHeader } from "@/components/connection/game-header"
import { ResultDisplay } from "@/components/connection/result-display"
import { HintDisplay } from "@/components/connection/hint-display"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, Check, RotateCcw, Users } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import type { Difficulty, GameMode, Player } from "@/lib/connection/types"

function PlayContent() {
  const searchParams = useSearchParams()

  const {
    playerA,
    playerB,
    chain,
    isComplete,
    isCorrect,
    validationResult,
    hintChain,
    hintType,
    hasValidPath,
    gameStarted,
    score,
    difficulty,
    mode,
    startGame,
    addToChain,
    removeFromChain,
    submitSolution,
    submitNoConnection,
    resetGame,
    error,
    loading,
  } = useConnectionGame()

  useEffect(() => {
    const diff = (searchParams.get("difficulty") as Difficulty) || "medium"
    const md = (searchParams.get("mode") as GameMode) || "infinite"
    startGame(diff, md)
  }, []) 

  const handleSelectPlayer = useCallback(
    (player: Player) => {
      if (isComplete) return
      if (player.id === playerA?.id || player.id === playerB?.id) return
      addToChain(player)
    },
    [isComplete, playerA?.id, playerB?.id, addToChain]
  )

  const currentMaxConnections =
    difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : difficulty === "hard" ? 3 : 4

  const canAddMore = chain.length < currentMaxConnections && !isComplete
  const hasChain = chain.length > 0

  if (error) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => startGame(difficulty, mode)}>
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (loading || !gameStarted || !playerA || !playerB) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Generating puzzle...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <GameHeader />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
        <div className="flex flex-col items-center gap-4">
          {isComplete && isCorrect && validationResult ? (
            <ResultDisplay result={validationResult} />
          ) : isComplete && !isCorrect && validationResult ? (
            <ResultDisplay result={validationResult} />
          ) : (
            <>
              <PlayerCard player={playerA} label="PLAYER 1" variant="start" />
              <ArrowDown className="h-5 w-5 text-muted-foreground/50" />
            </>
          )}

          {!isComplete && (
            <div className="flex flex-col items-center gap-3">
              {(hintChain || hintType === "direct" || hintType === "unavailable") && (
                <HintDisplay players={hintChain ?? []} playerAName={playerA.name} playerBName={playerB.name} hintType={hintType} />
              )}

              {isCorrect === false && validationResult && (
                <ResultDisplay result={validationResult} />
              )}

              {canAddMore && mode !== "hardcore" && (
                <SearchBar onSelect={handleSelectPlayer} placeholder="Add a connecting player..." />
              )}

              {mode === "hardcore" && canAddMore && (
                <p className="text-[10px] text-muted-foreground italic">
                  Hardcore mode: manual entry disabled
                </p>
              )}

              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-white/10" />
                <span className="text-[9px] text-white/20 font-bold uppercase tracking-wider">or</span>
                <div className="h-px w-12 bg-white/10" />
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={submitNoConnection}
                className="border-orange-500/30 text-orange-400/70 hover:text-orange-300 hover:border-orange-400/50 text-[10px] font-bold uppercase tracking-wider"
              >
                No connection exists
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          {isComplete && isCorrect && validationResult ? null : chain.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2"
            >
              {chain.map((player, i) => (
                <div key={`${player.id}-${i}`} className="flex flex-col items-center gap-2">
                  <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
                  <div className="relative">
                    <PlayerCard player={player} variant="chain" className="scale-90" />
                    {!isComplete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromChain(i)}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                      >
                        <span className="text-[10px] font-bold">×</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
            </motion.div>
          )}

          {!isComplete && hasChain && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                size="lg"
                onClick={submitSolution}
                className="glow-neon text-sm font-black uppercase tracking-widest"
              >
                <Check className="h-5 w-5 mr-2" />
                Submit
              </Button>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          {isComplete && isCorrect && validationResult ? null : (
            <>
              <PlayerCard player={playerB} label="PLAYER 2" variant="end" />
              {!isComplete && !hasChain && (
                <p className="text-[10px] text-muted-foreground text-center max-w-[180px]">
                  Search for a player that connects these two
                </p>
              )}
            </>
          )}

          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              {isCorrect && (
                <div className="rounded-xl border border-neon/30 bg-neon/5 p-6 text-center">
                  <div className="text-3xl font-black text-neon text-glow-neon">+{score}</div>
                  <p className="mt-1 text-[10px] text-muted-foreground">CHIPS EARNED</p>
                </div>
              )}
              <Button
                variant="outline"
                onClick={resetGame}
                className="text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                New Puzzle
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        <Badge variant="secondary" className="text-[9px]">
          <Users className="h-3 w-3 mr-1" />
          {chain.length}/{currentMaxConnections} connections
        </Badge>
        {!isComplete && (
          <Badge variant="outline" className="text-[9px] text-muted-foreground">
            Find the path or guess no connection
          </Badge>
        )}
      </div>
    </div>
  )
}

export default function ConnectionPlayPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading game...</p>
        </div>
      </div>
    }>
      <PlayContent />
    </Suspense>
  )
}
