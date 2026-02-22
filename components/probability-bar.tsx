import { cn } from "@/lib/utils"

interface ProbabilityBarProps {
  label: string
  value: number
  maxValue?: number
  color?: "neon" | "gold" | "cyan" | "destructive"
  showValue?: boolean
  className?: string
}

const colorMap = {
  neon: "bg-primary",
  gold: "bg-gold",
  cyan: "bg-cyan",
  destructive: "bg-destructive",
}

const textColorMap = {
  neon: "text-primary",
  gold: "text-gold",
  cyan: "text-cyan",
  destructive: "text-destructive",
}

export function ProbabilityBar({
  label,
  value,
  maxValue = 100,
  color = "neon",
  showValue = true,
  className,
}: ProbabilityBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100)

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {showValue && (
          <span className={cn("text-xs font-bold font-mono", textColorMap[color])}>
            {value}%
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            colorMap[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface MatchProbabilityBarProps {
  teamAName: string
  teamBName: string
  teamAFlag: string
  teamBFlag: string
  winA: number
  draw: number
  winB: number
  className?: string
}

export function MatchProbabilityBar({
  teamAName,
  teamBName,
  teamAFlag,
  teamBFlag,
  winA,
  draw,
  winB,
  className,
}: MatchProbabilityBarProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <span>{teamAFlag}</span>
          {teamAName}
        </span>
        <span className="text-xs text-muted-foreground">vs</span>
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          {teamBName}
          <span>{teamBFlag}</span>
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary transition-all"
          style={{ width: `${winA}%` }}
          title={`${teamAName}: ${winA}%`}
        />
        <div
          className="bg-muted-foreground/30 transition-all"
          style={{ width: `${draw}%` }}
          title={`Draw: ${draw}%`}
        />
        <div
          className="bg-cyan transition-all"
          style={{ width: `${winB}%` }}
          title={`${teamBName}: ${winB}%`}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-primary">{winA}%</span>
        <span className="text-muted-foreground">{draw}% draw</span>
        <span className="text-cyan">{winB}%</span>
      </div>
    </div>
  )
}
