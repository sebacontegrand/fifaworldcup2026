"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { SortGame } from "@/components/games/sort-game"
import type { SortTarget, Difficulty } from "@/lib/sort/types"
import type { TeamSortCriterion, PlayerSortCriterion } from "@/lib/sort/types"

function SortContent() {
  const searchParams = useSearchParams()
  const target = (searchParams.get("target") as SortTarget) || "teams"
  const difficulty = (searchParams.get("difficulty") as Difficulty) || "easy"

  const criterion: TeamSortCriterion | PlayerSortCriterion =
    target === "teams"
      ? (searchParams.get("criterion") as TeamSortCriterion) || "fifaRanking"
      : (searchParams.get("criterion") as PlayerSortCriterion) || "goals2526"

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-2xl px-4 py-8">
      <SortGame target={target} criterion={criterion} difficulty={difficulty} />
    </div>
  )
}

export default function SortPage() {
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
      <SortContent />
    </Suspense>
  )
}
