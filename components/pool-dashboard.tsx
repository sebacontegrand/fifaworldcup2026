"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Coins, Zap, Shield, EyeOff, TrendingUp, Activity, Gift,
  Loader2, CheckCircle2, AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchDTO {
  id: string
  round: string
  groupId: string | null
  matchOrder: number
  teamAId: string | null
  teamBId: string | null
  teamAName: string | null
  teamBName: string | null
  scoreA: number | null
  scoreB: number | null
  isFact: boolean
}

interface BetDTO {
  id: string
  matchId: string
  scoreA: number
  scoreB: number
  wagerAmount: number
  oddsMultiplier: number
  payout: number | null
  cardId: string | null
  createdAt: string
  match: {
    teamAName: string | null
    teamBName: string | null
    scoreA: number | null
    scoreB: number | null
    isFact: boolean
    round: string
  }
}

interface CardDTO {
  id: string
  name: string
  description: string
  effect: string
  rarity: string
  quantity: number
  cooldownHours: number
  multiplier: number | null
  lastUsedAt: string | null
}

interface PulseDTO {
  matchId: string
  label: string
  totalBets: number
  totalChips: number
}

const rarityColors: Record<string, string> = {
  common: "border-zinc-500 text-zinc-300",
  uncommon: "border-green-500 text-green-400",
  rare: "border-yellow-500 text-yellow-400",
}

const rarityIcons: Record<string, React.ReactNode> = {
  common: <Shield className="h-3 w-3" />,
  uncommon: <TrendingUp className="h-3 w-3" />,
  rare: <Zap className="h-3 w-3" />,
}

const cardEffects: Record<string, { label: string; icon: React.ReactNode }> = {
  double_down: { label: "2x Wager", icon: <Zap className="h-3 w-3" /> },
  hedge: { label: "50% Back", icon: <Shield className="h-3 w-3" /> },
  lock_in: { label: "Min 2x", icon: <Shield className="h-3 w-3" /> },
  scout: { label: "See Bets", icon: <EyeOff className="h-3 w-3" /> },
  insurance: { label: "+50 Chips", icon: <Coins className="h-3 w-3" /> },
  boost: { label: "1.5x Payout", icon: <TrendingUp className="h-3 w-3" /> },
}

export function PoolDashboard() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState<number | null>(null)
  const [dailyStreak, setDailyStreak] = useState(0)
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0)
  const [cards, setCards] = useState<CardDTO[]>([])
  const [bets, setBets] = useState<BetDTO[]>([])
  const [pulse, setPulse] = useState<PulseDTO[]>([])
  const [matches, setMatches] = useState<MatchDTO[]>([])
  const [claimed, setClaimed] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<MatchDTO | null>(null)
  const [betScoreA, setBetScoreA] = useState("")
  const [betScoreB, setBetScoreB] = useState("")
  const [betAmount, setBetAmount] = useState("50")
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<"bet" | "cards" | "history">("bet")

  const fetchAll = useCallback(async () => {
    const [balRes, cardRes, betRes, pulseRes, matchRes] = await Promise.all([
      fetch("/api/pool/balance"),
      fetch("/api/pool/cards"),
      fetch("/api/pool/bets"),
      fetch("/api/pool/pulse"),
      fetch("/api/matches"),
    ])
    const balData = await balRes.json()
    setBalance(balData.balance ?? 0)
    setDailyStreak(balData.dailyStreak ?? 0)
    setLifetimeEarnings(balData.lifetimeEarnings ?? 0)
    setCards(await cardRes.json())
    setBets(await betRes.json())
    setPulse(await pulseRes.json())
    const matchData = await matchRes.json()
    setMatches(matchData.filter((m: MatchDTO) => !m.isFact && m.teamAId && m.teamBId))
  }, [])

  useEffect(() => {
    if (session?.user) fetchAll()
  }, [session, fetchAll])

  const handleClaim = async () => {
    setClaiming(true)
    const res = await fetch("/api/pool/balance", { method: "POST" })
    if (res.ok) {
      const data = await res.json()
      setBalance(data.balance)
      setDailyStreak(data.dailyStreak)
      setClaimed(true)
      setMessage({ type: "success", text: `Claimed ${data.bonus} chips! 🔥` })
      setTimeout(() => setMessage(null), 3000)
    }
    setClaiming(false)
  }

  const handlePlaceBet = async () => {
    if (!selectedMatch) return
    const scoreA = parseInt(betScoreA)
    const scoreB = parseInt(betScoreB)
    const wager = parseInt(betAmount)
    if (isNaN(scoreA) || isNaN(scoreB) || isNaN(wager)) return

    setPlacing(true)
    setMessage(null)
    const res = await fetch("/api/pool/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: selectedMatch.id,
        scoreA, scoreB,
        wagerAmount: wager,
        cardId: selectedCard,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage({ type: "success", text: "Bet placed! 🎯" })
      setBalance(data.remainingBalance)
      setBetScoreA("")
      setBetScoreB("")
      setSelectedMatch(null)
      setSelectedCard(null)
      fetchAll()
    } else {
      setMessage({ type: "error", text: data.error ?? "Failed to place bet" })
    }
    setPlacing(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const totalChips = pulse.reduce((s, p) => s + p.totalChips, 0)

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Coins className="h-16 w-16 text-yellow-500/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign In to Play</h2>
        <p className="text-muted-foreground text-sm">Connect your account to join the Confidence Pool.</p>
      </div>
    )
  }

  const renderMatchRow = (m: MatchDTO) => {
    const existingBet = bets.find(b => b.matchId === m.id)
    const isSelected = selectedMatch?.id === m.id
    return (
      <div
        key={m.id}
        className={cn(
          "flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all cursor-pointer",
          isSelected
            ? "border-yellow-500/40 bg-yellow-500/5"
            : existingBet
              ? "border-green-500/20 bg-green-500/5"
              : "border-white/10 hover:border-white/20"
        )}
        onClick={() => !existingBet && setSelectedMatch(isSelected ? null : m)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold truncate">{m.teamAName}</span>
          <span className="text-[10px] text-white/30">vs</span>
          <span className="text-xs font-bold truncate">{m.teamBName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {existingBet ? (
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px]">
              {existingBet.payout != null
                ? `+${existingBet.payout}`
                : `${existingBet.scoreA}-${existingBet.scoreB} ${existingBet.wagerAmount}c`}
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[9px]">
              {m.round}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left column */}
      <div className="lg:col-span-8 space-y-6">
        {/* Balance bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-black tabular-nums text-yellow-500">{balance ?? "..."}</span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">chips</span>
            {dailyStreak > 0 && (
              <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px]">
                🔥 {dailyStreak} day streak
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleClaim}
              disabled={claiming || claimed}
              className="bg-yellow-600 hover:bg-yellow-500 text-[11px] h-8"
            >
              {claiming ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Gift className="h-3 w-3 mr-1" />}
              {claimed ? "Claimed" : "Daily Bonus"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-white/5 p-1 border border-white/10">
          {[
            { key: "bet", label: "Place Bet" },
            { key: "cards", label: `Cards (${cards.length})` },
            { key: "history", label: "History" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                activeTab === tab.key ? "bg-zinc-800 text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
            message.type === "success"
              ? "border-green-500/20 bg-green-500/10 text-green-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          )}>
            {message.type === "success" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {message.text}
          </div>
        )}

        {/* Bet Tab */}
        {activeTab === "bet" && (
          <div className="space-y-4">
            {/* Selected match betting panel */}
            {selectedMatch && (
              <Card className="border-yellow-500/20 bg-yellow-500/[0.02]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs">
                    Betting: {selectedMatch.teamAName} vs {selectedMatch.teamBName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">{selectedMatch.teamAName}</label>
                      <Input
                        type="number" min="0" placeholder="0"
                        value={betScoreA}
                        onChange={e => setBetScoreA(e.target.value)}
                        className="h-9 text-center font-bold bg-zinc-900 border-yellow-500/20 text-yellow-200/90"
                      />
                    </div>
                    <span className="text-white/20 font-black text-xs pt-5">:</span>
                    <div className="flex-1">
                      <label className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">{selectedMatch.teamBName}</label>
                      <Input
                        type="number" min="0" placeholder="0"
                        value={betScoreB}
                        onChange={e => setBetScoreB(e.target.value)}
                        className="h-9 text-center font-bold bg-zinc-900 border-yellow-500/20 text-yellow-200/90"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Wager (chips)</label>
                    <Input
                      type="number" min="10"
                      value={betAmount}
                      onChange={e => setBetAmount(e.target.value)}
                      className="h-9 font-bold bg-zinc-900 border-yellow-500/20 text-yellow-200/90"
                    />
                  </div>

                  {/* Card selection */}
                  <div>
                    <label className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1.5">Power-Up Card (optional)</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setSelectedCard(null)}
                        className={cn(
                          "px-2 py-1 rounded text-[9px] font-bold border transition-all",
                          !selectedCard
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-white/5 text-white/30 hover:border-white/20"
                        )}
                      >
                        None
                      </button>
                      {cards.filter(c => c.quantity > 0).map(card => (
                        <button
                          key={card.id}
                          onClick={() => setSelectedCard(card.id)}
                          className={cn(
                            "px-2 py-1 rounded text-[9px] font-bold border transition-all flex items-center gap-1",
                            selectedCard === card.id
                              ? cn("border-2", rarityColors[card.rarity])
                              : cn("border-white/10 text-white/50 hover:border-white/30")
                          )}
                        >
                          {cardEffects[card.effect]?.icon}
                          {card.name}
                          <span className="text-[8px] opacity-50">x{card.quantity}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handlePlaceBet}
                    disabled={placing || !betScoreA || !betScoreB}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-xs h-9 font-bold"
                  >
                    {placing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                    Place Bet
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Match list */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-1.5">
                {matches.filter(m => !bets.find(b => b.matchId === m.id)).length === 0 && !selectedMatch ? (
                  <div className="text-center py-10 text-white/30">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">No open matches</p>
                    <p className="text-[10px] mt-1">All matches have bets or have been played.</p>
                  </div>
                ) : null}
                {matches.map(renderMatchRow)}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Cards Tab */}
        {activeTab === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cards.length === 0 ? (
              <div className="col-span-full text-center py-10 text-white/30">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">No cards</p>
                <p className="text-[10px] mt-1">Keep playing to earn power-up cards.</p>
              </div>
            ) : cards.map(card => (
              <div key={card.id} className={cn(
                "rounded-xl border p-4",
                card.rarity === "common" ? "border-zinc-700 bg-zinc-900/50" :
                card.rarity === "uncommon" ? "border-green-500/20 bg-green-500/[0.02]" :
                "border-yellow-500/20 bg-yellow-500/[0.02]"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {rarityIcons[card.rarity]}
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider",
                      card.rarity === "common" ? "text-zinc-400" :
                      card.rarity === "uncommon" ? "text-green-400" :
                      "text-yellow-400"
                    )}>
                      {card.rarity}
                    </span>
                  </div>
                  <Badge className={cn(
                    "text-[9px] px-1.5 py-0",
                    card.rarity === "common" ? "bg-zinc-800 text-zinc-300 border-zinc-700" :
                    card.rarity === "uncommon" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  )}>
                    x{card.quantity}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-white mb-0.5">{card.name}</h3>
                <p className="text-[10px] text-muted-foreground">{card.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-1.5">
            {bets.length === 0 ? (
              <div className="text-center py-10 text-white/30">
                <Coins className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">No bets yet</p>
                <p className="text-[10px] mt-1">Place your first bet to get started.</p>
              </div>
            ) : bets.slice(0, 20).map(bet => (
              <div key={bet.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold truncate">{bet.match.teamAName}</span>
                  <span className="text-[10px] text-white/30">vs</span>
                  <span className="text-xs font-bold truncate">{bet.match.teamBName}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs tabular-nums">
                  <span className="text-white/50">{bet.scoreA}-{bet.scoreB}</span>
                  <span className="text-yellow-500">{bet.wagerAmount}c</span>
                  {bet.payout != null ? (
                    <span className={bet.payout > 0 ? "text-green-400 font-bold" : "text-red-400"}>
                      {bet.payout > 0 ? `+${bet.payout}` : "0"}
                    </span>
                  ) : (
                    <span className="text-white/30">pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
        {/* Pool Pulse */}
        <Card className="bg-card/50 backdrop-blur-md border-white/10">
          <CardHeader className="bg-white/5 border-b border-white/5 px-4 py-3">
            <CardTitle className="text-xs flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-yellow-400" />
              Pool Pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <div className="text-[10px] text-muted-foreground mb-2">
              <span className="font-bold text-yellow-400">{totalChips.toLocaleString()}</span> chips wagered across <span className="font-bold text-white/70">{pulse.length}</span> matches
            </div>
            {pulse.slice(0, 5).map(p => (
              <div key={p.matchId} className="flex items-center justify-between text-[10px]">
                <span className="text-white/70 truncate max-w-[150px]">{p.label}</span>
                <span className="text-yellow-500 font-bold tabular-nums">{p.totalChips}c</span>
              </div>
            ))}
            {pulse.length === 0 && (
              <p className="text-[10px] text-white/30 text-center py-4">No bets placed yet. Be the first!</p>
            )}
          </CardContent>
        </Card>

        {/* Lifetime earnings */}
        <Card className="bg-card/50 backdrop-blur-md border-white/10">
          <CardHeader className="bg-white/5 border-b border-white/5 px-4 py-3">
            <CardTitle className="text-xs flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-green-400" />
              Lifetime
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="text-2xl font-black text-green-400 tabular-nums">{lifetimeEarnings}</div>
            <div className="text-[10px] text-muted-foreground">total chips earned</div>
          </CardContent>
        </Card>

        {/* Quick rules */}
        <Card className="bg-card/50 backdrop-blur-md border-white/10">
          <CardHeader className="bg-white/5 border-b border-white/5 px-4 py-3">
            <CardTitle className="text-xs flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-blue-400" />
              Scoring
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-1.5 text-[10px]">
            <div className="flex justify-between"><span className="text-white/50">Exact score</span><span className="text-white font-bold">5x</span></div>
            <div className="flex justify-between"><span className="text-white/50">Correct margin</span><span className="text-white font-bold">3x</span></div>
            <div className="flex justify-between"><span className="text-white/50">Correct winner</span><span className="text-white font-bold">1.5x</span></div>
            <div className="flex justify-between"><span className="text-white/50">Wrong</span><span className="text-red-400 font-bold">0x</span></div>
            <div className="border-t border-white/5 pt-1.5 mt-1.5 flex justify-between">
              <span className="text-white/50">Odds multiplier</span>
              <span className="text-yellow-400 font-bold">0.5x – 3x</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
