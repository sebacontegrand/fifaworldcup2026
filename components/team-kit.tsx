import React from "react"
import { cn } from "@/lib/utils"

interface TeamKitProps {
    teamId: string
    primaryColor?: string
    secondaryColor?: string
    className?: string
}

const KIT_COLORS: Record<string, { primary: string; secondary: string }> = {
    arg: { primary: "#74ACDF", secondary: "#FFFFFF" },
    bra: { primary: "#fed100", secondary: "#009b3a" },
    mex: { primary: "#006847", secondary: "#FFFFFF" },
    usa: { primary: "#FFFFFF", secondary: "#002868" },
    can: { primary: "#FF0000", secondary: "#FFFFFF" },
    fra: { primary: "#002395", secondary: "#FFFFFF" },
    ger: { primary: "#FFFFFF", secondary: "#000000" },
    jpn: { primary: "#00008B", secondary: "#FFFFFF" },
    esp: { primary: "#AA151B", secondary: "#F1BF00" },
    ned: { primary: "#F36C21", secondary: "#FFFFFF" },
    eng: { primary: "#FFFFFF", secondary: "#000040" },
    ita: { primary: "#004BB3", secondary: "#FFFFFF" },
    uru: { primary: "#75AADB", secondary: "#000000" },
    por: { primary: "#E42518", secondary: "#006600" },
    bel: { primary: "#E4032E", secondary: "#000000" },
    cro: { primary: "#FFFFFF", secondary: "#FF0000" }, // Red/White checks
    mar: { primary: "#C1272D", secondary: "#006233" },
    sen: { primary: "#FFFFFF", secondary: "#00853F" },
    aus: { primary: "#FFCD00", secondary: "#008751" },
    kor: { primary: "#CC1631", secondary: "#000000" },
    irn: { primary: "#FFFFFF", secondary: "#DA291C" },
    egy: { primary: "#CE1126", secondary: "#FFFFFF" },
    nga: { primary: "#008751", secondary: "#FFFFFF" },
    civ: { primary: "#FF8200", secondary: "#FFFFFF" },
    rsa: { primary: "#007A4D", secondary: "#FFB81C" },
    tun: { primary: "#E70013", secondary: "#FFFFFF" },
    ksa: { primary: "#FFFFFF", secondary: "#006C35" },
    cmr: { primary: "#007A5E", secondary: "#FFCC33" },
    qat: { primary: "#8D1B3D", secondary: "#FFFFFF" },
    sui: { primary: "#E31620", secondary: "#FFFFFF" },
    hai: { primary: "#00209F", secondary: "#D21034" },
    sco: { primary: "#004B87", secondary: "#FFFFFF" },
    par: { primary: "#D52B1E", secondary: "#FFFFFF" },
    cur: { primary: "#00205B", secondary: "#FECC00" },
    ecu: { primary: "#FFD100", secondary: "#0033A0" },
    nzl: { primary: "#FFFFFF", secondary: "#000000" },
    cpv: { primary: "#003893", secondary: "#FFFFFF" },
    nor: { primary: "#EF2B2D", secondary: "#00205B" },
    alg: { primary: "#FFFFFF", secondary: "#006233" },
    aut: { primary: "#ED2939", secondary: "#FFFFFF" },
    jor: { primary: "#FFFFFF", secondary: "#CE1126" },
    uzb: { primary: "#003580", secondary: "#FFFFFF" },
    col: { primary: "#FCD116", secondary: "#003893" },
    gha: { primary: "#FFFFFF", secondary: "#000000" },
    pan: { primary: "#DA121A", secondary: "#00247D" },
}

export function TeamKit({ teamId, primaryColor, secondaryColor, className }: TeamKitProps) {
    const colors = KIT_COLORS[teamId.toLowerCase()] || {
        primary: primaryColor || "#FFFFFF", // Bright white default
        secondary: secondaryColor || "#FFD700" // Gold trim
    }

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
                    fill={colors.primary}
                    stroke={colors.secondary}
                    strokeWidth="2"
                />

                {/* Stripes or details for some specific teams */}
                {teamId.toLowerCase() === "arg" && (
                    <>
                        <rect x="38" y="15" width="8" height="70" fill={colors.secondary} />
                        <rect x="54" y="15" width="8" height="70" fill={colors.secondary} />
                    </>
                )}

                {teamId.toLowerCase() === "cro" && (
                    <mask id="checker-mask">
                        <path d="M25 20L35 15H65L75 20L85 35L75 45V85H25V45L15 35L25 20Z" fill="white" />
                    </mask>
                )}
                {teamId.toLowerCase() === "cro" && (
                    <g mask="url(#checker-mask)">
                        {Array.from({ length: 10 }).map((_, i) =>
                            Array.from({ length: 10 }).map((_, j) => (
                                (i + j) % 2 === 0 && (
                                    <rect key={`${i}-${j}`} x={i * 10} y={j * 10} width="10" height="10" fill={colors.secondary} />
                                )
                            ))
                        )}
                    </g>
                )}

                {/* Collar */}
                <path
                    d="M40 15C40 15 45 22 50 22C55 22 60 15 60 15"
                    stroke={colors.secondary}
                    strokeWidth="2"
                    strokeLinecap="round"
                />

                {/* Sleeves detail */}
                <path d="M25 20L15 35L25 45" stroke={colors.secondary} strokeWidth="2" />
                <path d="M75 20L85 35L75 45" stroke={colors.secondary} strokeWidth="2" />
            </svg>

            {/* Decorative glow */}
            <div
                className="absolute inset-0 -z-10 blur-2xl opacity-20"
                style={{ backgroundColor: colors.primary }}
            />
        </div>
    )
}
