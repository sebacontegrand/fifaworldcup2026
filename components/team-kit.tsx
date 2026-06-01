import React from "react"
import { cn } from "@/lib/utils"
import teamsData from "@/data/teams.json"
import type { KitPattern } from "@/lib/simulation"

interface TeamKitProps {
    teamId: string
    primaryColor?: string
    secondaryColor?: string
    className?: string
}

interface TeamWithKit {
    id: string
    kit: { primary: string; secondary: string; pattern: KitPattern }
}

const teams = teamsData as TeamWithKit[]

export function TeamKit({ teamId, primaryColor, secondaryColor, className }: TeamKitProps) {
    const team = teams.find((t) => t.id === teamId.toLowerCase())
    const colors = team?.kit
    const primary = primaryColor || colors?.primary || "#FFFFFF"
    const secondary = secondaryColor || colors?.secondary || "#FFD700"
    const pattern = colors?.pattern || "solid"

    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full drop-shadow-2xl"
            >
                {/* Shirt Body */}
                <path
                    d="M25 20L35 15H65L75 20L85 35L75 45V85H25V45L15 35L25 20Z"
                    fill={primary}
                    stroke={secondary}
                    strokeWidth="2"
                />

                {/* Stripes pattern */}
                {pattern === "stripes" && (
                    <>
                        <rect x="38" y="15" width="8" height="70" fill={secondary} />
                        <rect x="54" y="15" width="8" height="70" fill={secondary} />
                    </>
                )}

                {/* Checkered pattern (Croatia) */}
                {pattern === "checkered" && (
                    <mask id="checker-mask">
                        <path d="M25 20L35 15H65L75 20L85 35L75 45V85H25V45L15 35L25 20Z" fill="white" />
                    </mask>
                )}
                {pattern === "checkered" && (
                    <g mask="url(#checker-mask)">
                        {Array.from({ length: 10 }).map((_, i) =>
                            Array.from({ length: 10 }).map((_, j) => (
                                (i + j) % 2 === 0 && (
                                    <rect key={`${i}-${j}`} x={i * 10} y={j * 10} width="10" height="10" fill={secondary} />
                                )
                            ))
                        )}
                    </g>
                )}

                {/* Collar */}
                <path
                    d="M40 15C40 15 45 22 50 22C55 22 60 15 60 15"
                    stroke={secondary}
                    strokeWidth="2"
                    strokeLinecap="round"
                />

                {/* Sleeves detail */}
                <path d="M25 20L15 35L25 45" stroke={secondary} strokeWidth="2" />
                <path d="M75 20L85 35L75 45" stroke={secondary} strokeWidth="2" />
            </svg>

            {/* Decorative glow */}
            <div
                className="absolute inset-0 -z-10 blur-2xl opacity-20"
                style={{ backgroundColor: primary }}
            />
        </div>
    )
}
