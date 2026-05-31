"use client"

import { useState, useEffect } from "react"
import type { Player } from "@/lib/connection/types"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3"

const imageCache = new Map<string, string>()

async function fetchPlayerImage(name: string): Promise<string | null> {
  if (imageCache.has(name)) return imageCache.get(name) ?? null
  try {
    const res = await fetch(`${SPORTSDB_BASE}/searchplayers.php?p=${encodeURIComponent(name)}`)
    const data = await res.json()
    const cutout = (data as any)?.player?.[0]?.strCutout as string | undefined
    if (cutout) {
      imageCache.set(name, cutout)
      return cutout
    }
    imageCache.set(name, "")
    return null
  } catch {
    imageCache.set(name, "")
    return null
  }
}

interface PlayerCardProps {
  player: Player
  label?: string
  variant?: "start" | "end" | "chain"
  className?: string
}

export function PlayerCard({ player, label, variant = "chain", className }: PlayerCardProps) {
  const [imgSrc, setImgSrc] = useState(player.image || undefined)
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const borderColor =
    variant === "start"
      ? "border-neon/50 glow-neon"
      : variant === "end"
        ? "border-gold/50 glow-gold"
        : "border-border/50"

  useEffect(() => {
    if (!player.image) {
      fetchPlayerImage(player.name).then((url) => setImgSrc(url ?? undefined))
    }
  }, [player.name, player.image])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative flex flex-col items-center gap-3 rounded-xl border bg-card p-4 min-w-[180px] backdrop-blur-sm transition-all hover:scale-[1.02]",
        borderColor,
        className
      )}
    >
      {label && (
        <span className="absolute -top-2.5 left-3 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
          {label}
        </span>
      )}
      <Avatar className="h-16 w-16 ring-2 ring-border">
        <AvatarImage src={imgSrc} alt={player.name} />
        <AvatarFallback className="bg-secondary text-xs font-bold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-bold leading-tight text-foreground">{player.name}</span>
        <div className="flex items-center gap-1.5">
          {player.nationalityFlag && (
            <img src={player.nationalityFlag} alt="" className="h-3 w-4 rounded-sm object-cover" />
          )}
          <span className="text-[10px] font-medium text-muted-foreground">{player.nationality}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1">
          {player.teams.slice(0, 2).map((t) => (
            <Badge key={t.teamId} variant="secondary" className="text-[8px] px-1.5 py-0">
              {t.teamName}
            </Badge>
          ))}
          {player.teams.length > 2 && (
            <Badge variant="outline" className="text-[8px] px-1.5 py-0">
              +{player.teams.length - 2}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  )
}
