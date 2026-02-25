"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSimulation } from "@/lib/hooks/use-simulation"
import { RefreshCw } from "lucide-react"

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/groups", label: "Groups" },
  { href: "/simulate", label: "Simulate" },
  { href: "/analysis", label: "Analysis" },
  { href: "/bracket", label: "Brackets" },
  { href: "/methodology", label: "How It Works" },
]

export function NavBar() {
  const pathname = usePathname()
  const { simulate, isRunning } = useSimulation()

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-black text-primary-foreground">
              WC
            </span>
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-sm font-bold uppercase tracking-wider text-foreground leading-none">
              World Cup 2026
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Predictor
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="h-4 w-px bg-border" />

          <button
            onClick={simulate}
            disabled={isRunning}
            className={cn(
              "group relative flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted border border-border/50 overflow-hidden",
              isRunning && "opacity-80"
            )}
          >
            <RefreshCw className={cn("h-3 w-3", isRunning && "animate-spin")} />
            <span>{isRunning ? "Simulating..." : "Run Sim"}</span>
            {isRunning && (
              <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary animate-progress-glow" />
            )}
          </button>
        </div>
      </nav>
    </header>
  )
}
