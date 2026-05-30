"use client"

import type { ValidationResult } from "@/lib/connection/types"
import { motion } from "motion/react"
import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResultDisplayProps {
  result: ValidationResult
}

export function ResultDisplay({ result }: ResultDisplayProps) {
  if (result.valid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-neon/30 bg-neon/5 p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-neon" />
          <span className="font-bold text-sm text-neon">CORRECT!</span>
        </div>
        <div className="space-y-2">
          {result.chain.map((link, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-foreground">{link.player.name}</span>
              {link.sharedTeam && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-mono text-muted-foreground">
                    {link.sharedTeam}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
        {result.score !== undefined && (
          <div className="mt-3 text-sm font-bold text-gold">
            +{result.score} points
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <XCircle className="h-5 w-5 text-destructive" />
        <span className="font-bold text-sm text-destructive">INCORRECT</span>
      </div>
      {result.errors && result.errors.length > 0 && (
        <ul className="space-y-1">
          {result.errors.map((error, i) => (
            <li key={i} className="text-xs text-destructive/80">
              {error}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
