import { SensitivityAnalysis } from "@/components/sensitivity-analysis"

export default function AnalysisPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
                    Sensitivity Analysis
                </h1>
                <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
                    Visualize how simulation input variables affect tournament outcomes.
                    Each chart sweeps one parameter while holding others at their defaults.
                </p>
            </div>
            <SensitivityAnalysis />
        </div>
    )
}
