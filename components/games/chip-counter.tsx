"use client"

import { motion, AnimatePresence } from "motion/react"
import { Coins, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface ChipCounterProps {
  chips: number
  streak?: number
  className?: string
}

export function ChipCounter({ chips, streak = 0, className }: ChipCounterProps) {
  const [animatedChips, setAnimatedChips] = useState(chips)
  const [prevChips, setPrevChips] = useState(chips)

  useEffect(() => {
    if (chips !== prevChips) {
      const diff = chips - prevChips
      if (diff > 0) {
        const timer = setTimeout(() => setAnimatedChips(chips), 50)
        setPrevChips(chips)
        return () => clearTimeout(timer)
      } else {
        setAnimatedChips(chips)
        setPrevChips(chips)
      }
    }
  }, [chips, prevChips])

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5">
        <Coins className="h-4 w-4 text-gold" />
        <AnimatePresence mode="wait">
          <motion.span
            key={animatedChips}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-black font-mono text-gold"
          >
            {animatedChips}
          </motion.span>
        </AnimatePresence>
      </div>

      {streak > 1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5"
        >
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-black font-mono text-orange-500">
            {streak}
          </span>
        </motion.div>
      )}
    </div>
  )
}
