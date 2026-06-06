"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSimulation } from "@/lib/hooks/use-simulation"
import { RefreshCw, Menu, ChevronDown, Globe, Cpu, Gamepad2, Settings } from "lucide-react"
import { useSession } from "next-auth/react"
import { CafecitoButton } from "@/components/cafecito-button"
import { motion, AnimatePresence } from "motion/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState, useEffect, useRef } from "react"

const groups = [
  {
    label: "World Cup Data",
    icon: <Globe className="h-3 w-3" />,
    links: [
      { href: "/teams", label: "Teams" },
      { href: "/players", label: "Players" },
      { href: "/groups", label: "Groups" },
      { href: "/bracket", label: "Brackets" },
    ],
  },
  {
    label: "Simulation",
    icon: <Cpu className="h-3 w-3" />,
    links: [
      { href: "/simulate", label: "Simulate Lab" },
      { href: "/analysis", label: "Analysis" },
      { href: "/methodology", label: "How It Works" },
    ],
  },
  {
    label: "Games",
    icon: <Gamepad2 className="h-3 w-3" />,
    links: [
      { href: "/games", label: "Games Hub" },
      { href: "/connection", label: "Connections" },
      { href: "/timeline/live", label: "Live Results" },
      { href: "/pool", label: "Confidence Pool" },
      { href: "/ranking", label: "Rankings" },
      { href: "/my-team", label: "My Team" },
    ],
  },
]

function DropdownMenu({
  group,
  pathname,
  isOpen,
  onToggle,
  onClose,
}: {
  group: (typeof groups)[number]
  pathname: string
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  const anyActive = group.links.some(
    (l) => l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
  )

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 border cursor-pointer",
          anyActive
            ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)]"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground border-transparent"
        )}
      >
        {group.icon}
        <span>{group.label}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute top-[calc(100%+8px)] left-0 min-w-[200px] p-1.5 rounded-2xl border border-white/10 bg-card/85 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 gradient-border"
          >
            {group.links.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center px-3.5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all duration-200 border",
                    isActive
                      ? "bg-primary/10 text-primary border-primary/10"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground border-transparent"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function NavBar() {
  const pathname = usePathname()
  const { simulate, isRunning } = useSimulation()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-md shadow-[0_1px_30px_rgba(0,0,0,0.2)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-accent via-primary to-cyan p-[1px] shadow-lg transition-transform duration-300 group-hover:scale-105">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-background/90 backdrop-blur-sm">
              <span className="text-xs font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-tr from-primary to-accent">
                WC
              </span>
            </div>
            <div className="absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-tr from-accent to-primary opacity-30 blur-sm group-hover:opacity-60 transition-opacity duration-300" />
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-widest text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
              World Cup 2026
            </span>
            <span className="text-[8px] font-medium uppercase tracking-[0.25em] text-muted-foreground/80">
              Sim & Predictor
            </span>
          </div>
        </Link>

        {isDesktop ? (
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="flex items-center gap-1.5">
              <Link
                href="/"
                className={cn(
                  "rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap border cursor-pointer",
                  pathname === "/"
                    ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border-transparent"
                )}
              >
                Dashboard
              </Link>

              {groups.map((g) => (
                <DropdownMenu
                  key={g.label}
                  group={g}
                  pathname={pathname}
                  isOpen={dropdownOpen === g.label}
                  onToggle={() => setDropdownOpen(dropdownOpen === g.label ? null : g.label)}
                  onClose={() => setDropdownOpen(null)}
                />
              ))}
            </div>

            <CafecitoButton />

            <Link
              href="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 transition-all duration-200"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="sr-only">Settings</span>
            </Link>

            <div className="h-4 w-px bg-white/10 shrink-0" />

            <button
              onClick={simulate}
              disabled={isRunning}
              className={cn(
                "group relative flex items-center gap-2 rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 overflow-hidden shrink-0 cursor-pointer shadow-lg",
                isRunning 
                  ? "bg-secondary text-muted-foreground border border-border/50 cursor-not-allowed" 
                  : "bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 text-primary border border-primary/35 hover:scale-[1.03] hover:shadow-[0_0_20px_oklch(0.85_0.22_155_/_0.2)]"
              )}
            >
              {!isRunning && (
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              )}
              
              <RefreshCw className={cn("h-3.5 w-3.5 transition-transform duration-500", isRunning ? "animate-spin" : "group-hover:rotate-180")} />
              <span>{isRunning ? "Simulating..." : "Run Sim"}</span>
              
              {isRunning && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary animate-pulse-neon" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={simulate}
              disabled={isRunning}
              className={cn(
                "group relative flex items-center gap-2 rounded-full px-4 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 overflow-hidden cursor-pointer",
                isRunning 
                  ? "bg-secondary text-muted-foreground border border-border/50 cursor-not-allowed" 
                  : "bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 text-primary border border-primary/35 hover:scale-[1.02] hover:shadow-[0_0_15px_oklch(0.85_0.22_155_/_0.15)]"
              )}
            >
              <RefreshCw className={cn("h-3.5 w-3.5 transition-transform duration-500", isRunning ? "animate-spin" : "group-hover:rotate-180")} />
              <span className="hidden sm:inline-block">{isRunning ? "Simulating..." : "Run Sim"}</span>
              <span className="sm:hidden">{isRunning ? "Sim..." : "Sim"}</span>
              
              {isRunning && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary animate-pulse-neon" />
              )}
            </button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors duration-200 text-foreground cursor-pointer">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle navigation menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] border-l border-white/10 bg-background/90 backdrop-blur-2xl p-6 flex flex-col justify-between">
                <div>
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-left text-xs font-black uppercase tracking-widest text-muted-foreground">
                      Tournament Menu
                    </SheetTitle>
                  </SheetHeader>
                  <div className="space-y-5">
                    <Link
                      href="/"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 border cursor-pointer",
                        pathname === "/"
                          ? "bg-primary/10 text-primary border-primary/25 shadow-[0_0_15px_rgba(var(--primary),0.05)]"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground border-transparent"
                      )}
                    >
                      Dashboard
                    </Link>

                    {groups.map((g) => (
                      <div key={g.label} className="space-y-1.5">
                        <div className="flex items-center gap-2 px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                          {g.icon}
                          {g.label}
                        </div>
                        <div className="space-y-1">
                          {g.links.map((link) => {
                            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
                            return (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                  "block rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 border cursor-pointer",
                                  isActive
                                    ? "bg-primary/10 text-primary border-primary/15"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border-transparent"
                                )}
                              >
                                {link.label}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                  <div className="flex justify-center">
                    <CafecitoButton />
                  </div>
                  {session?.user && (
                    <>
                      <Link
                        href="/settings"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200"
                      >
                        <Settings className="h-3 w-3" />
                        Settings
                      </Link>
                      <div className="text-[10px] text-center text-muted-foreground font-mono">
                        Logged in as <span className="text-foreground text-glow-neon">{session.user.name || session.user.email}</span>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </nav>
    </header>
  )
}
