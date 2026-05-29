import { PoolDashboard } from "@/components/pool-dashboard"

export default function PoolPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-yellow-500">
            Confidence Pool
          </span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
          Betting <span className="text-yellow-500">Pool</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
          Wager chips on match predictions. The closer you predict, the more you win.
          Use power-up cards to boost your payouts.
        </p>
      </div>
      <PoolDashboard />
    </div>
  )
}
