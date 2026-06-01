"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { TriviaGame } from "@/components/games/trivia-game"
import type { GameType, Difficulty } from "@/lib/trivia/types"

function TriviaContent() {
  const searchParams = useSearchParams()
  const gameType = (searchParams.get("type") as GameType) || "flag"
  const difficulty = (searchParams.get("difficulty") as Difficulty) || "easy"

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-2xl px-4 py-8">
      <TriviaGame gameType={gameType} difficulty={difficulty} />
    </div>
  )
}

export default function TriviaPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Loading game...</p>
          </div>
        </div>
      }
    >
      <TriviaContent />
    </Suspense>
  )
}
