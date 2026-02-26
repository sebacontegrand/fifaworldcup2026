"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSimulation } from "@/lib/hooks/use-simulation"
import { RefreshCw, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"

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
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-black text-primary-foreground">
              WC
            </span>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-sm font-bold uppercase tracking-wider text-foreground leading-none">
              World Cup 2026
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Predictor
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 shrink-0">
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

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={simulate}
            disabled={isRunning}
            className={cn(
              "group relative flex items-center gap-1.5 rounded-lg bg-secondary px-2 py-1.5 text-[9px] sm:text-[10px] sm:px-3 font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted border border-border/50 overflow-hidden",
              isRunning && "opacity-80"
            )}
          >
            <RefreshCw className={cn("h-3 sm:h-3 w-3 sm:w-3", isRunning && "animate-spin")} />
            <span className="hidden sm:inline-block">{isRunning ? "Simulating..." : "Run Sim"}</span>
            <span className="sm:hidden">{isRunning ? "Sim..." : "Sim"}</span>
            {isRunning && (
              <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary animate-progress-glow" />
            )}
          </button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 px-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left">Navigation</SheetTitle>
              </SheetHeader>
              <div className="grid gap-2 py-6">
                {links.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all",
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
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
