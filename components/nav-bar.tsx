"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSimulation } from "@/lib/hooks/use-simulation"
import { RefreshCw, Menu, ChevronDown, Globe, Cpu, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
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
          "flex items-center gap-1 rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
          anyActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        {group.icon}
        {group.label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 rounded-xl border border-white/10 bg-card shadow-2xl backdrop-blur-xl overflow-hidden z-50">
          {group.links.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function NavBar() {
  const pathname = usePathname()
  const { simulate, isRunning } = useSimulation()
  const { data: session } = useSession()
  const isAdmin = session?.user?.email?.toLowerCase() === "sebacontegrand@gmail.com"
  const [open, setOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-black text-primary-foreground">WC</span>
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

        {isDesktop ? (
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className={cn(
                  "rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                  pathname === "/"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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

              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                    pathname.startsWith("/admin")
                      ? "bg-red-500/20 text-red-400"
                      : "text-red-400/60 hover:bg-red-500/10 hover:text-red-400"
                  )}
                >
                  Admin
                </Link>
              )}
            </div>

            <div className="h-4 w-px bg-border shrink-0" />

            <button
              onClick={simulate}
              disabled={isRunning}
              className={cn(
                "group relative flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted border border-border/50 overflow-hidden shrink-0",
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
        ) : (
          <div className="flex items-center gap-2">
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
                <div className="py-6 space-y-4">
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-all",
                      pathname === "/"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    Dashboard
                  </Link>

                  {groups.map((g) => (
                    <div key={g.label}>
                      <div className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                        {g.icon}
                        {g.label}
                      </div>
                      <div className="ml-2 space-y-0.5">
                        {g.links.map((link) => {
                          const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "block rounded-md px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              )}
                            >
                              {link.label}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                      Admin
                    </Link>
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
