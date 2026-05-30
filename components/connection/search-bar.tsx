"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { getGraphInstance } from "@/lib/connection/graph"
import type { Player } from "@/lib/connection/types"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  onSelect: (player: Player) => void
  disabled?: boolean
  placeholder?: string
}

export function SearchBar({ onSelect, disabled, placeholder = "Search players..." }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Player[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (value.length < 1) {
      setResults([])
      setIsOpen(false)
      return
    }
    const graph = getGraphInstance()
    const matches = graph.searchPlayers(value)
    setResults(matches.slice(0, 8))
    setIsOpen(matches.length > 0)
  }

  function handleSelect(player: Player) {
    onSelect(player)
    setQuery("")
    setResults([])
    setIsOpen(false)
  }

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-8 h-10 text-sm bg-secondary/50 border-border/50 focus-visible:ring-primary"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setResults([])
              setIsOpen(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-border/50 bg-card shadow-2xl backdrop-blur-xl overflow-hidden">
          {results.map((player) => (
            <button
              key={player.id}
              onClick={() => handleSelect(player)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
                {player.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{player.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {player.nationality} — {player.teams.map((t) => t.teamName).join(", ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
