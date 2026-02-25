import { SimulationDashboard } from "@/components/simulation-dashboard"

export default function SimulatePage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-8 text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Simulation Lab
                    </span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
                    Simulation Controls
                </h1>
                <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
                    Configure every aspect of the tournament simulation. Adjust global model
                    parameters, customize individual team settings, and see live probability
                    previews before committing to a full 10,000-iteration run.
                </p>
            </div>
            <SimulationDashboard />
        </div>
    )
}
