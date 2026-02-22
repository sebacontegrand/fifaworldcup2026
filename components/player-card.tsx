import { cn } from "@/lib/utils"

interface Player {
  rank: number
  name: string
  nationality: string
  nationalTeamCode: string
  club: string
  position: string
  age: number
  goals2526: number
  assists2526: number
  competitionWins: string[]
  compositeScore: number
}

interface PlayerCardProps {
  player: Player
  className?: string
}

const positionColors: Record<string, string> = {
  FW: "bg-destructive/20 text-destructive",
  MF: "bg-primary/20 text-primary",
  DF: "bg-cyan/20 text-cyan",
  GK: "bg-gold/20 text-gold",
}

export function PlayerCard({ player, className }: PlayerCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30",
        className
      )}
    >
      <div className="h-1 w-full bg-gradient-to-r from-gold via-primary to-cyan" />

      <div className="flex flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-base font-bold text-card-foreground">
              {player.name}
            </span>
            <span className="text-xs text-muted-foreground">{player.club}</span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase",
                positionColors[player.position] || "bg-muted text-muted-foreground"
              )}
            >
              {player.position}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              Age {player.age}
            </span>
          </div>
        </div>

        {/* Score badge */}
        <div className="flex items-center justify-between border-t border-border/30 pt-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-lg font-black font-mono text-primary">
                {player.goals2526}
              </span>
              <span className="text-[9px] uppercase text-muted-foreground">
                Goals
              </span>
            </div>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-black font-mono text-cyan">
                {player.assists2526}
              </span>
              <span className="text-[9px] uppercase text-muted-foreground">
                Assists
              </span>
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 glow-gold">
            <span className="text-lg font-black font-mono text-gold">
              {player.compositeScore}
            </span>
          </div>
        </div>

        {/* Competition wins */}
        {player.competitionWins.length > 0 && (
          <div className="flex flex-wrap gap-1 border-t border-border/30 pt-2">
            {player.competitionWins.map((win) => (
              <span
                key={win}
                className="rounded-sm bg-gold/10 px-1.5 py-0.5 text-[9px] font-medium text-gold"
              >
                {win}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rank badge */}
      <div className="absolute left-3 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-black text-accent-foreground">
        {player.rank}
      </div>
    </div>
  )
}
