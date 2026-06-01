"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { TeamKit } from "@/components/team-kit"
import { Check, X } from "lucide-react"
import type { Question } from "@/lib/trivia/types"

interface TriviaQuestionProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  onAnswer: (correct: boolean) => void
}

export function TriviaQuestion({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: TriviaQuestionProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  function handleSelect(index: number) {
    if (revealed) return
    setSelected(index)
    setRevealed(true)
    const correct = index === question.correctIndex
    setTimeout(() => {
      onAnswer(correct)
      setSelected(null)
      setRevealed(false)
    }, 1200)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <span>
          Q{questionNumber}/{totalQuestions}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={questionNumber}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="flex w-full flex-col items-center gap-6"
        >
          {/* Clue display */}
          <div className="flex h-40 w-full max-w-xs items-center justify-center rounded-2xl border border-border/50 bg-card glow-neon">
            {question.clueType === "flag" && (
              <span className="text-8xl">{question.correctAnswer && getTeamFlag(question.teamId)}</span>
            )}
            {question.clueType === "kit" && question.teamId && (
              <TeamKit teamId={question.teamId} className="h-32 w-32" />
            )}
            {question.clueType === "player" && (
              <div className="flex flex-col items-center gap-2 px-4 text-center">
                <span className="text-lg font-bold text-foreground">Who is this player?</span>
                {question.playerInfo && (
                  <span className="text-sm text-muted-foreground">{question.playerInfo}</span>
                )}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid w-full max-w-md grid-cols-1 gap-2">
            {question.options.map((option, i) => {
              const isSelected = selected === i
              const isCorrect = i === question.correctIndex
              const showResult = revealed && isSelected
              const showCorrect = revealed && isCorrect && selected !== i

              return (
                <motion.button
                  key={`${questionNumber}-${i}`}
                  whileHover={!revealed ? { scale: 1.02 } : undefined}
                  whileTap={!revealed ? { scale: 0.98 } : undefined}
                  onClick={() => handleSelect(i)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all",
                    "border-border/50 bg-card hover:border-primary/30",
                    isSelected && !revealed && "border-primary/50 bg-primary/10",
                    showResult && isCorrect && "border-green-500 bg-green-500/20 text-green-400",
                    showResult && !isCorrect && "border-destructive bg-destructive/20 text-destructive",
                    showCorrect && "border-green-500/50 bg-green-500/10 text-green-400",
                    revealed && "cursor-default"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      "bg-secondary text-muted-foreground",
                      isSelected && "bg-primary/20 text-primary",
                      showResult && isCorrect && "bg-green-500/30 text-green-400",
                      showResult && !isCorrect && "bg-destructive/30 text-destructive",
                      showCorrect && "bg-green-500/20 text-green-400"
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showResult && isCorrect && <Check className="h-4 w-4 text-green-400" />}
                  {showResult && !isCorrect && isSelected && <X className="h-4 w-4 text-destructive" />}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function getTeamFlag(teamId?: string): string {
  const flagMap: Record<string, string> = {
    mex: "🇲🇽", rsa: "🇿🇦", usa: "🇺🇸", can: "🇨🇦", fra: "🇫🇷",
    ger: "🇩🇪", jpn: "🇯🇵", esp: "🇪🇸", ned: "🇳🇱", eng: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    ita: "🇮🇹", uru: "🇺🇾", por: "🇵🇹", bel: "🇧🇪", cro: "🇭🇷",
    mar: "🇲🇦", sen: "🇸🇳", aus: "🇦🇺", kor: "🇰🇷", irn: "🇮🇷",
    egy: "🇪🇬", nga: "🇳🇬", civ: "🇨🇮", tun: "🇹🇳", ksa: "🇸🇦",
    cmr: "🇨🇲", qat: "🇶🇦", sui: "🇨🇭", hai: "🇭🇹", sco: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    par: "🇵🇾", cur: "🇨🇼", ecu: "🇪🇨", nzl: "🇳🇿", cpv: "🇨🇻",
    nor: "🇳🇴", alg: "🇩🇿", aut: "🇦🇹", jor: "🇯🇴", uzb: "🇺🇿",
    col: "🇨🇴", gha: "🇬🇭", pan: "🇵🇦",
  }
  return teamId ? flagMap[teamId] || "🏳️" : "🏳️"
}
