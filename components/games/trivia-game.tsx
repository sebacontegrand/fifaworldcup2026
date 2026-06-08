"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { TriviaQuestion } from "./trivia-question"
import { ChipCounter } from "./chip-counter"
import { Button } from "@/components/ui/button"
import {
  RotateCcw,
  Trophy,
  Sparkles,
  Home,
  Play,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { GameType, Difficulty } from "@/lib/trivia/types"
import { getItemCountForDifficulty } from "@/lib/trivia/types"
import { generateQuestionBatch } from "@/lib/trivia/game-logic"
import { addChips, getChips, setStreak, getStreak } from "@/lib/games/chips"

interface TriviaGameProps {
  gameType: GameType
  difficulty: Difficulty
}

export function TriviaGame({ gameType, difficulty }: TriviaGameProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState<ReturnType<typeof generateQuestionBatch>>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [chips, setChipsState] = useState(getChips())
  const [streak, setStreakState] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [answersCorrect, setAnswersCorrect] = useState(0)
  const [answersWrong, setAnswersWrong] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [started, setStarted] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const scoreSaved = useRef(false)

  const totalQuestions = getItemCountForDifficulty(difficulty)

  useEffect(() => {
    const batch = generateQuestionBatch(gameType, difficulty, totalQuestions)
    setQuestions(batch)
  }, [gameType, difficulty, totalQuestions])

  useEffect(() => {
    if (!isComplete || scoreSaved.current) return
    scoreSaved.current = true
    const typeMap: Record<string, string> = {
      flag: "trivia_flag",
      kit: "trivia_kit",
      player: "trivia_player",
    }
    fetch("/api/games/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameType: typeMap[gameType],
        difficulty,
        score,
        totalPossible: totalQuestions * 30,
      }),
    }).catch(() => {})
    if (score > 0) {
      fetch("/api/chips/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: score, source: "game" }),
      }).catch(() => {})
    }
  }, [isComplete, gameType, difficulty, score, totalQuestions])

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (correct) {
        const newStreak = streak + 1
        const streakBonus = Math.min(newStreak * 2, 20)
        const earned = 10 + streakBonus
        setScore((s) => s + earned)
        setChipsState(addChips(earned))
        setStreakState(newStreak)
        setBestStreak((b) => Math.max(b, newStreak))
        setAnswersCorrect((c) => c + 1)
        setStreak(newStreak)
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 800)
      } else {
        setStreakState(0)
        setAnswersWrong((w) => w + 1)
        setStreak(0)
      }

      setTimeout(() => {
        if (currentIndex + 1 >= totalQuestions) {
          setIsComplete(true)
        } else {
          setCurrentIndex((i) => i + 1)
        }
      }, 400)
    },
    [currentIndex, streak, totalQuestions]
  )

  function handleRestart() {
    const batch = generateQuestionBatch(gameType, difficulty, totalQuestions)
    setQuestions(batch)
    setCurrentIndex(0)
    setScore(0)
    setChipsState(getChips())
    setStreakState(0)
    setBestStreak(0)
    setAnswersCorrect(0)
    setAnswersWrong(0)
    setIsComplete(false)
    setStarted(true)
    setShowCelebration(false)
    scoreSaved.current = false
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary glow-neon">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-wider">
            {gameType === "flag" && "Flag Trivia"}
            {gameType === "kit" && "Kit Trivia"}
            {gameType === "player" && "Player Trivia"}
          </h2>
          <p className="max-w-sm text-xs text-muted-foreground">
            {gameType === "flag" && "Identify the team from their flag!"}
            {gameType === "kit" && "Name the team from their kit colors!"}
            {gameType === "player" && "Guess the player from their details!"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {totalQuestions} questions &middot;{" "}
            {difficulty === "easy" && "Easy difficulty"}
            {difficulty === "medium" && "Medium difficulty"}
            {difficulty === "hard" && "Hard difficulty"}
          </p>
          <ChipCounter chips={chips} streak={streak} />
        </motion.div>

        <Button
          size="lg"
          onClick={() => setStarted(true)}
          className="h-12 w-48 text-sm font-black uppercase tracking-widest glow-neon"
        >
          <Play className="mr-2 h-5 w-5" />
          Start Game
        </Button>
      </div>
    )
  }

  if (isComplete) {
    const accuracy =
      totalQuestions > 0
        ? Math.round((answersCorrect / totalQuestions) * 100)
        : 0

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
            Game Over
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card px-6 py-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Score
              </span>
              <span className="text-2xl font-black text-primary">{score}</span>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card px-6 py-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Accuracy
              </span>
              <span className="text-2xl font-black text-gold">{accuracy}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-green-400">{answersCorrect} correct</span>
            <span>&middot;</span>
            <span className="text-destructive">{answersWrong} wrong</span>
            <span>&middot;</span>
            <span>Best streak: {bestStreak}</span>
          </div>

          <ChipCounter chips={chips} streak={0} />

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/games")}
            >
              <Home className="mr-2 h-4 w-4" />
              Games
            </Button>
            <Button size="sm" onClick={handleRestart}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Play Again
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  if (!currentQ) return null

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="flex w-full max-w-md items-center justify-between">
        <ChipCounter chips={chips} streak={streak} />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-primary font-bold">{answersCorrect}</span>
          <span>/</span>
          <span>{answersWrong}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full max-w-md overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{
            width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <TriviaQuestion
        key={currentIndex}
        question={currentQ}
        questionNumber={currentIndex + 1}
        totalQuestions={totalQuestions}
        onAnswer={handleAnswer}
      />

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="relative">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "absolute h-3 w-3 rounded-full",
                    i % 3 === 0 && "bg-primary",
                    i % 3 === 1 && "bg-gold",
                    i % 3 === 2 && "bg-cyan"
                  )}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: Math.cos((i / 12) * Math.PI * 2) * 80,
                    y: Math.sin((i / 12) * Math.PI * 2) * 80,
                    scale: [0, 1.5, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.6 }}
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
