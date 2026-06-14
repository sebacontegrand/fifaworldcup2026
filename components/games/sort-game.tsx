"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChipCounter } from "./chip-counter"
import { Button } from "@/components/ui/button"
import {
  ArrowUp,
  ArrowDown,
  GripVertical,
  Check,
  RotateCcw,
  Trophy,
  Home,
  Play,
  Shuffle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { SortTarget, Difficulty } from "@/lib/sort/types"
import type { TeamSortCriterion, PlayerSortCriterion, SortItem } from "@/lib/sort/types"
import { getRoundsForDifficulty } from "@/lib/sort/types"
import { generateSortQuestion, scoreSortAttempt } from "@/lib/sort/game-logic"
import { addChips, getChips } from "@/lib/games/chips"

interface SortGameProps {
  target: SortTarget
  criterion: TeamSortCriterion | PlayerSortCriterion
  difficulty: Difficulty
}

const targetLabels: Record<SortTarget, string> = {
  teams: "Teams",
  players: "Players",
}

export function SortGame({ target, criterion, difficulty }: SortGameProps) {
  const router = useRouter()
  const [items, setItems] = useState<SortItem[]>([])
  const [correctOrder, setCorrectOrder] = useState<SortItem[]>([])
  const [criterionLabel, setCriterionLabel] = useState("")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [roundScore, setRoundScore] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [chips, setChipsState] = useState(getChips())
  const [round, setRound] = useState(0)
  const [totalRounds, setTotalRounds] = useState(5)
  const [isComplete, setIsComplete] = useState(false)
  const [started, setStarted] = useState(false)
  const [showCorrectOrder, setShowCorrectOrder] = useState<SortItem[] | null>(null)
  const [revealing, setRevealing] = useState(false)
  const scoreSaved = useRef(false)

  const loadRound = useCallback(() => {
    const q = generateSortQuestion(target, criterion, difficulty)
    setItems(q.shuffledItems)
    setCorrectOrder(q.items)
    setCriterionLabel(q.criterionLabel)
    setSubmitted(false)
    setRoundScore(0)
    setSelectedIndex(null)
    setShowCorrectOrder(null)
    setRevealing(false)
    setTotalRounds(getRoundsForDifficulty(difficulty))
  }, [target, criterion, difficulty])

  useEffect(() => {
    if (started) loadRound()
  }, [started, round, loadRound])

  useEffect(() => {
    if (!isComplete || scoreSaved.current) return
    scoreSaved.current = true
    const typeMap: Record<string, string> = {
      teams: "sort_teams",
      players: "sort_players",
    }
    fetch("/api/games/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameType: typeMap[target],
        difficulty,
        score: totalScore,
        totalPossible: totalRounds * 100,
      }),
    }).catch((e) => console.error("Failed to save game score:", e))
    if (totalScore > 0) {
      fetch("/api/chips/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalScore, source: "game" }),
      }).catch((e) => console.error("Failed to earn chips:", e))
    }
  }, [isComplete, target, difficulty, totalScore, totalRounds])

  function handleDragStart(index: number) {
    if (submitted) return
    setDragIndex(index)
  }

  function handleDragOver(index: number) {
    if (submitted || dragIndex === null) return
    setDropIndex(index)
  }

  function handleDrop() {
    if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      setDropIndex(null)
      return
    }
    const newItems = [...items]
    const [moved] = newItems.splice(dragIndex, 1)
    newItems.splice(dropIndex, 0, moved)
    setItems(newItems)
    setDragIndex(null)
    setDropIndex(null)
  }

  function handleCardClick(index: number) {
    if (submitted) return
    if (selectedIndex === null) {
      setSelectedIndex(index)
    } else if (selectedIndex === index) {
      setSelectedIndex(null)
    } else {
      const newItems = [...items]
      const temp = newItems[selectedIndex]
      newItems[selectedIndex] = newItems[index]
      newItems[index] = temp
      setItems(newItems)
      setSelectedIndex(null)
    }
  }

  function moveItem(index: number, direction: -1 | 1) {
    if (submitted) return
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= items.length) return
    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[newIndex]
    newItems[newIndex] = temp
    setItems(newItems)
  }

  function handleSubmit() {
    const earned = scoreSortAttempt(items, correctOrder)
    setRoundScore(earned)
    setTotalScore((s) => s + earned)
    setChipsState(addChips(earned))
    setSubmitted(true)
    setShowCorrectOrder(correctOrder)
    setRevealing(true)
  }

  function handleNext() {
    if (round + 1 < totalRounds) {
      setRound((r) => r + 1)
    } else {
      setIsComplete(true)
    }
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold glow-gold">
            <Shuffle className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-wider">
            Sort It Out
          </h2>
          <p className="max-w-sm text-xs text-muted-foreground">
            Rearrange the {targetLabels[target].toLowerCase()} into the correct order by{" "}
            {criterionLabel.toLowerCase()}.
          </p>
          <p className="text-[10px] text-muted-foreground">
            {totalRounds} rounds &middot;{" "}
            {difficulty === "easy" && "4 items"}
            {difficulty === "medium" && "6 items"}
            {difficulty === "hard" && "8 items"}
          </p>
          <ChipCounter chips={chips} />
        </motion.div>

        <Button
          size="lg"
          onClick={() => setStarted(true)}
          className="h-12 w-48 text-sm font-black uppercase tracking-widest glow-gold"
        >
          <Play className="mr-2 h-5 w-5" />
          Start Game
        </Button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/20 glow-gold">
            <Trophy className="h-10 w-10 text-gold" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-wider text-gold">
            All Done!
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card px-6 py-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Total Score
              </span>
              <span className="text-2xl font-black text-primary">{totalScore}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card px-6 py-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Avg / Round
              </span>
              <span className="text-2xl font-black text-gold">
                {Math.round(totalScore / totalRounds)}
              </span>
            </div>
          </div>

          <ChipCounter chips={chips} />

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/games")}
            >
              <Home className="mr-2 h-4 w-4" />
              Games
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setTotalScore(0)
                setRound(0)
                setIsComplete(false)
                setStarted(true)
                scoreSaved.current = false
                loadRound()
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Play Again
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  const perfectScore = ((items.length * (items.length - 1)) / 2) * 1

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="flex w-full max-w-lg items-center justify-between">
        <ChipCounter chips={chips} />
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <span>
            Round {round + 1}/{totalRounds}
          </span>
          <span className="text-primary">&middot;</span>
          <span className="text-primary">{totalScore} pts</span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 w-full max-w-lg overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((round + 1) / totalRounds) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Criterion */}
      <motion.div
        key={round}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Sort by {criterionLabel}
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1">
          Drag or tap to reorder &middot; Best at top
        </p>
      </motion.div>

      {/* Sortable list */}
      <div className="flex w-full max-w-lg flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            const isSelected = selectedIndex === index
            const isDragOver = dropIndex === index && dragIndex !== index
            const correctItem = showCorrectOrder?.[index]
            const isInCorrectPosition = correctItem && correctItem.id === item.id
            const isAnimating = revealing

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                draggable={!submitted}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => {
                  e.preventDefault()
                  handleDragOver(index)
                }}
                onDragEnd={handleDrop}
                onClick={() => handleCardClick(index)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                  "border-border/50 bg-card cursor-pointer select-none",
                  isSelected && "border-primary/50 bg-primary/10 ring-1 ring-primary/30",
                  isDragOver && "border-primary/30 bg-primary/5 scale-[1.02]",
                  submitted && "cursor-default",
                  isAnimating && isInCorrectPosition && "border-green-500/50 bg-green-500/10",
                  isAnimating && !isInCorrectPosition && correctItem && "border-destructive/30 bg-destructive/10"
                )}
              >
                {/* Rank */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-muted-foreground">
                  {index + 1}
                </span>

                {/* Drag handle */}
                {!submitted && (
                  <span className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <GripVertical className="h-4 w-4" />
                  </span>
                )}

                {/* Item content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {item.subtitle}
                  </div>
                </div>

                {/* Value - hidden until submitted */}
                {submitted && (
                  <span className="shrink-0 text-xs font-mono font-bold text-primary">
                    {item.value}
                  </span>
                )}

                {/* Move buttons */}
                {!submitted && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveItem(index, -1)
                      }}
                      disabled={index === 0}
                      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        moveItem(index, 1)
                      }}
                      disabled={index === items.length - 1}
                      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Status icon after submit */}
                {isAnimating && isInCorrectPosition && (
                  <Check className="h-4 w-4 shrink-0 text-green-400" />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Submit / Next */}
      <div className="flex gap-3">
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            className="h-10 px-8 text-xs font-black uppercase tracking-widest glow-neon"
          >
            <Check className="mr-2 h-4 w-4" />
            Submit Order
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-6 py-3"
            >
              <Trophy className="h-5 w-5 text-gold" />
              <span className="text-lg font-black text-gold">
                +{roundScore} chips
              </span>
              <span className="text-[10px] text-muted-foreground">
                / {perfectScore} max
              </span>
            </motion.div>
            <Button onClick={handleNext} size="sm">
              {round + 1 < totalRounds ? "Next Round" : "See Results"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
