import type { GroupStanding } from "./simulation"

// ─── FIFA Annex C: Third-place slot assignments ──────────────────────
// Official 495-combination lookup table (C(12,8) = 495).
// Source: FIFA World Cup 26 Regulations, Annex C, pp. 80-97.
//   https://digitalhub.fifa.com/m/636f5c9c6f29771f/original/FWC2026_regulations_EN.pdf

const ANNEX_C_WINNERS = ["A","B","D","E","G","I","K","L"] as const

const ANNEX_C_ROWS = [
  "EJIFHGLK","HGIDJFLK","EJIDHGLK","EJIDHFLK","EGIDJFLK","EGJDHFLK","EGIDHFLK","EGJDHFLI","EGJDHFIK",
  "HGICJFLK","EJICHGLK","EJICHFLK","EGICJFLK","EGJCHFLK","EGICHFLK","EGJCHFLI","EGJCHFIK","HGICJDLK",
  "CJIDHFLK","CGIDJFLK","CGJDHFLK","CGIDHFLK","CGJDHFLI","CGJDHFIK","EJICHDLK","EGICJDLK","EGJCHDLK",
  "EGICHDLK","EGJCHDLI","EGJCHDIK","CJEDIFLK","CJEDHFLK","CEIDHFLK","CJEDHFLI","CJEDHFIK","CGEDJFLK",
  "CGEDIFLK","CGEDJFLI","CGEDJFIK","CGEDHFLK","CGJDHFLE","CGJDHFEK","CGEDHFLI","CGEDHFIK","CGJDHFEI",
  "HJBFIGLK","EJIBHGLK","EJBFIHLK","EJBFIGLK","EJBFHGLK","EGBFIHLK","EJBFHGLI","EJBFHGIK","HJBDIGLK",
  "HJBDIFLK","IGBDJFLK","HGBDJFLK","HGBDIFLK","HGBDJFLI","HGBDJFIK","EJBDIHLK","EJBDIGLK","EJBDHGLK",
  "EGBDIHLK","EJBDHGLI","EJBDHGIK","EJBDIFLK","EJBDHFLK","EIBDHFLK","EJBDHFLI","EJBDHFIK","EGBDJFLK",
  "EGBDIFLK","EGBDJFLI","EGBDJFIK","EGBDHFLK","HGBDJFLE","HGBDJFEK","EGBDHFLI","EGBDHFIK","HGBDJFEI",
  "HJBCIGLK","HJBCIFLK","IGBCJFLK","HGBCJFLK","HGBCIFLK","HGBCJFLI","HGBCJFIK","EJBCIHLK","EJBCIGLK",
  "EJBCHGLK","EGBCIHLK","EJBCHGLI","EJBCHGIK","EJBCIFLK","EJBCHFLK","EIBCHFLK","EJBCHFLI","EJBCHFIK",
  "EGBCJFLK","EGBCIFLK","EGBCJFLI","EGBCJFIK","EGBCHFLK","HGBCJFLE","HGBCJFEK","EGBCHFLI","EGBCHFIK",
  "HGBCJFEI","HJBCIDLK","IGBCJDLK","HGBCJDLK","HGBCIDLK","HGBCJDLI","HGBCJDIK","CJBDIFLK","CJBDHFLK",
  "CIBDHFLK","CJBDHFLI","CJBDHFIK","CGBDJFLK","CGBDIFLK","CGBDJFLI","CGBDJFIK","CGBDHFLK","CGBDHFLJ",
  "HGBCJFDK","CGBDHFLI","CGBDHFIK","HGBCJFDI","EJBCIDLK","EJBCHDLK","EIBCHDLK","EJBCHDLI","EJBCHDIK",
  "EGBCJDLK","EGBCIDLK","EGBCJDLI","EGBCJDIK","EGBCHDLK","HGBCJDLE","HGBCJDEK","EGBCHDLI","EGBCHDIK",
  "HGBCJDEI","CJBDEFLK","CEBDIFLK","CJBDEFLI","CJBDEFIK","CEBDHFLK","CJBDHFLE","CJBDHFEK","CEBDHFLI",
  "CEBDHFIK","CJBDHFEI","CGBDEFLK","CGBDJFLE","CGBDJFEK","CGBDEFLI","CGBDEFIK","CGBDJFEI","CGBDHFLE",
  "CGBDHFEK","HGBCJFDE","CGBDHFEI","HJIFAGLK","EJIAHGLK","EJIFAHLK","EJIFAGLK","EGJFAHLK","EGIFAHLK",
  "EGJFAHLI","EGJFAHIK","HJIDAGLK","HJIDAFLK","IGJDAFLK","HGJDAFLK","HGIDAFLK","HGJDAFLI","HGJDAFIK",
  "EJIDAHLK","EJIDAGLK","EGJDAHLK","EGIDAHLK","EGJDAHLI","EGJDAHIK","EJIDAFLK","HJEDAFLK","HEIDAFLK",
  "HJEDAFLI","HJEDAFIK","EGJDAFLK","EGIDAFLK","EGJDAFLI","EGJDAFIK","HGEDAFLK","HGJDAFLE","HGJDAFEK",
  "HGEDAFLI","HGEDAFIK","HGJDAFEI","HJICAGLK","HJICAFLK","IGJCAFLK","HGJCAFLK","HGICAFLK","HGJCAFLI",
  "HGJCAFIK","EJICAHLK","EJICAGLK","EGJCAHLK","EGICAHLK","EGJCAHLI","EGJCAHIK","EJICAFLK","HJECAFLK",
  "HEICAFLK","HJECAFLI","HJECAFIK","EGJCAFLK","EGICAFLK","EGJCAFLI","EGJCAFIK","HGECAFLK","HGJCAFLE",
  "HGJCAFEK","HGECAFLI","HGECAFIK","HGJCAFEI","HJICADLK","IGJCADLK","HGJCADLK","HGICADLK","HGJCADLI",
  "HGJCADIK","CJIDAFLK","HJFCADLK","HFICADLK","HJFCADLI","HJFCADIK","CGJDAFLK","CGIDAFLK","CGJDAFLI",
  "CGJDAFIK","HGFCADLK","CGJDAFLH","HGJCAFDK","HGFCADLI","HGFCADIK","HGJCAFDI","EJICADLK","HJECADLK",
  "HEICADLK","HJECADLI","HJECADIK","EGJCADLK","EGICADLK","EGJCADLI","EGJCADIK","HGECADLK","HGJCADLE",
  "HGJCADEK","HGECADLI","HGECADIK","HGJCADEI","CJEDAFLK","CEIDAFLK","CJEDAFLI","CJEDAFIK","HEFCADLK",
  "HJFCADLE","HJECAFDK","HEFCADLI","HEFCADIK","HJECAFDI","CGEDAFLK","CGJDAFLE","CGJDAFEK","CGEDAFLI",
  "CGEDAFIK","CGJDAFEI","HGFCADLE","HGECAFDK","HGJCAFDE","HGECAFDI","HJBAIGLK","HJBAIFLK","IJBFAGLK",
  "HJBFAGLK","HGBAIFLK","HJBFAGLI","HJBFAGIK","EJBAIHLK","EJBAIGLK","EJBAHGLK","EGBAIHLK","EJBAHGLI",
  "EJBAHGIK","EJBAIFLK","EJBFAHLK","EIBFAHLK","EJBFAHLI","EJBFAHIK","EJBFAGLK","EGBAIFLK","EJBFAGLI",
  "EJBFAGIK","EGBFAHLK","HJBFAGLE","HJBFAGEK","EGBFAHLI","EGBFAHIK","HJBFAGEI","IJBDAHLK","IJBDAGLK",
  "HJBDAGLK","IGBDAHLK","HJBDAGLI","HJBDAGIK","IJBDAFLK","HJBDAFLK","HIBDAFLK","HJBDAFLI","HJBDAFIK",
  "FJBDAGLK","IGBDAFLK","FJBDAGLI","FJBDAGIK","HGBDAFLK","HGBDAFLJ","HGBDAFJK","HGBDAFLI","HGBDAFIK",
  "HGBDAFIJ","EJBAIDLK","EJBDAHLK","EIBDAHLK","EJBDAHLI","EJBDAHIK","EJBDAGLK","EGBAIDLK","EJBDAGLI",
  "EJBDAGIK","EGBDAHLK","HJBDAGLE","HJBDAGEK","EGBDAHLI","EGBDAHIK","HJBDAGEI","EJBDAFLK","EIBDAFLK",
  "EJBDAFLI","EJBDAFIK","HEBDAFLK","HJBDAFLE","HJBDAFEK","HEBDAFLI","HEBDAFIK","HJBDAFEI","EGBDAFLK",
  "EGBDAFLJ","EGBDAFJK","EGBDAFLI","EGBDAFIK","EGBDAFIJ","HGBDAFLE","HGBDAFEK","HGBDAFEJ","HGBDAFEI",
  "IJBCAHLK","IJBCAGLK","HJBCAGLK","IGBCAHLK","HJBCAGLI","HJBCAGIK","IJBCAFLK","HJBCAFLK","HIBCAFLK",
  "HJBCAFLI","HJBCAFIK","CJBFAGLK","IGBCAFLK","CJBFAGLI","CJBFAGIK","HGBCAFLK","HGBCAFLJ","HGBCAFJK",
  "HGBCAFLI","HGBCAFIK","HGBCAFIJ","EJBAICLK","EJBCAHLK","EIBCAHLK","EJBCAHLI","EJBCAHIK","EJBCAGLK",
  "EGBAICLK","EJBCAGLI","EJBCAGIK","EGBCAHLK","HJBCAGLE","HJBCAGEK","EGBCAHLI","EGBCAHIK","HJBCAGEI",
  "EJBCAFLK","EIBCAFLK","EJBCAFLI","EJBCAFIK","HEBCAFLK","HJBCAFLE","HJBCAFEK","HEBCAFLI","HEBCAFIK",
  "HJBCAFEI","EGBCAFLK","EGBCAFLJ","EGBCAFJK","EGBCAFLI","EGBCAFIK","EGBCAFIJ","HGBCAFLE","HGBCAFEK",
  "HGBCAFEJ","HGBCAFEI","IJBCADLK","HJBCADLK","HIBCADLK","HJBCADLI","HJBCADIK","CJBDAGLK","IGBCADLK",
  "CJBDAGLI","CJBDAGIK","HGBCADLK","HGBCADLJ","HGBCADJK","HGBCADLI","HGBCADIK","HGBCADIJ","CJBDAFLK",
  "CIBDAFLK","CJBDAFLI","CJBDAFIK","HFBCADLK","CJBDAFLH","HJBCAFDK","HFBCADLI","HFBCADIK","HJBCAFDI",
  "CGBDAFLK","CGBDAFLJ","CGBDAFJK","CGBDAFLI","CGBDAFIK","CGBDAFIJ","CGBDAFLH","HGBCAFDK","HGBCAFDJ",
  "HGBCAFDI","EJBCADLK","EIBCADLK","EJBCADLI","EJBCADIK","HEBCADLK","HJBCADLE","HJBCADEK","HEBCADLI",
  "HEBCADIK","HJBCADEI","EGBCADLK","EGBCADLJ","EGBCADJK","EGBCADLI","EGBCADIK","EGBCADIJ","HGBCADLE",
  "HGBCADEK","HGBCADEJ","HGBCADEI","CEBDAFLK","CJBDAFLE","CJBDAFEK","CEBDAFLI","CEBDAFIK","CJBDAFEI",
  "HFBCADLE","HEBCAFDK","HJBCAFDE","HEBCAFDI","CGBDAFLE","CGBDAFEK","CGBDAFEJ","CGBDAFEI","HGBCAFDE",
]

// ─── Bracket Match Slots ──────────────────────────────────────────────

export interface BracketSlot {
  matchId: number
  round: string
  label: string
  sourceA: TeamSource
  sourceB: TeamSource
}

export type TeamSource =
  | { type: "group_winner"; group: string }
  | { type: "group_runner_up"; group: string }
  | { type: "third_place"; group: string }
  | { type: "third_place_dependent"; groupPool: string[] }
  | { type: "winner_of"; matchId: number }
  | { type: "loser_of"; matchId: number }

// ─── Round of 32 Match Definitions ────────────────────────────────────

export interface ThirdPlaceSlot {
  slotId: string
  winnerGroup: string
  pool: string[]
}

export const THIRD_PLACE_SLOTS: ThirdPlaceSlot[] = [
  { slotId: "1A", winnerGroup: "A", pool: ["C", "E", "F", "H", "I"] },
  { slotId: "1B", winnerGroup: "B", pool: ["E", "F", "G", "I", "J"] },
  { slotId: "1D", winnerGroup: "D", pool: ["B", "E", "F", "I", "J"] },
  { slotId: "1E", winnerGroup: "E", pool: ["A", "B", "C", "D", "F"] },
  { slotId: "1G", winnerGroup: "G", pool: ["A", "E", "H", "I", "J"] },
  { slotId: "1I", winnerGroup: "I", pool: ["C", "D", "F", "G", "H"] },
  { slotId: "1K", winnerGroup: "K", pool: ["D", "E", "I", "J", "L"] },
  { slotId: "1L", winnerGroup: "L", pool: ["E", "H", "I", "J", "K"] },
]

// The 16 Round of 32 matches (matchId 73-88 as per FIFA)
export const R32_MATCHES: BracketSlot[] = [
  {
    matchId: 73, round: "Round of 32", label: "M73",
    sourceA: { type: "group_runner_up", group: "A" },
    sourceB: { type: "group_runner_up", group: "B" },
  },
  {
    matchId: 74, round: "Round of 32", label: "M74",
    sourceA: { type: "group_winner", group: "E" },
    sourceB: { type: "third_place_dependent", groupPool: ["A", "B", "C", "D", "F"] },
  },
  {
    matchId: 75, round: "Round of 32", label: "M75",
    sourceA: { type: "group_winner", group: "F" },
    sourceB: { type: "group_runner_up", group: "C" },
  },
  {
    matchId: 76, round: "Round of 32", label: "M76",
    sourceA: { type: "group_winner", group: "C" },
    sourceB: { type: "group_runner_up", group: "F" },
  },
  {
    matchId: 77, round: "Round of 32", label: "M77",
    sourceA: { type: "group_winner", group: "I" },
    sourceB: { type: "third_place_dependent", groupPool: ["C", "D", "F", "G", "H"] },
  },
  {
    matchId: 78, round: "Round of 32", label: "M78",
    sourceA: { type: "group_runner_up", group: "E" },
    sourceB: { type: "group_runner_up", group: "I" },
  },
  {
    matchId: 79, round: "Round of 32", label: "M79",
    sourceA: { type: "group_winner", group: "A" },
    sourceB: { type: "third_place_dependent", groupPool: ["C", "E", "F", "H", "I"] },
  },
  {
    matchId: 80, round: "Round of 32", label: "M80",
    sourceA: { type: "group_winner", group: "L" },
    sourceB: { type: "third_place_dependent", groupPool: ["E", "H", "I", "J", "K"] },
  },
  {
    matchId: 81, round: "Round of 32", label: "M81",
    sourceA: { type: "group_winner", group: "D" },
    sourceB: { type: "third_place_dependent", groupPool: ["B", "E", "F", "I", "J"] },
  },
  {
    matchId: 82, round: "Round of 32", label: "M82",
    sourceA: { type: "group_winner", group: "G" },
    sourceB: { type: "third_place_dependent", groupPool: ["A", "E", "H", "I", "J"] },
  },
  {
    matchId: 83, round: "Round of 32", label: "M83",
    sourceA: { type: "group_runner_up", group: "K" },
    sourceB: { type: "group_runner_up", group: "L" },
  },
  {
    matchId: 84, round: "Round of 32", label: "M84",
    sourceA: { type: "group_winner", group: "H" },
    sourceB: { type: "group_runner_up", group: "J" },
  },
  {
    matchId: 85, round: "Round of 32", label: "M85",
    sourceA: { type: "group_winner", group: "B" },
    sourceB: { type: "third_place_dependent", groupPool: ["E", "F", "G", "I", "J"] },
  },
  {
    matchId: 86, round: "Round of 32", label: "M86",
    sourceA: { type: "group_winner", group: "J" },
    sourceB: { type: "group_runner_up", group: "H" },
  },
  {
    matchId: 87, round: "Round of 32", label: "M87",
    sourceA: { type: "group_winner", group: "K" },
    sourceB: { type: "third_place_dependent", groupPool: ["D", "E", "I", "J", "L"] },
  },
  {
    matchId: 88, round: "Round of 32", label: "M88",
    sourceA: { type: "group_runner_up", group: "D" },
    sourceB: { type: "group_runner_up", group: "G" },
  },
]

// ─── Round of 16 Match Definitions ────────────────────────────────────

export const R16_MATCHES: BracketSlot[] = [
  { matchId: 89, round: "Round of 16", label: "M89", sourceA: { type: "winner_of", matchId: 74 }, sourceB: { type: "winner_of", matchId: 77 } },
  { matchId: 90, round: "Round of 16", label: "M90", sourceA: { type: "winner_of", matchId: 73 }, sourceB: { type: "winner_of", matchId: 75 } },
  { matchId: 91, round: "Round of 16", label: "M91", sourceA: { type: "winner_of", matchId: 76 }, sourceB: { type: "winner_of", matchId: 78 } },
  { matchId: 92, round: "Round of 16", label: "M92", sourceA: { type: "winner_of", matchId: 79 }, sourceB: { type: "winner_of", matchId: 80 } },
  { matchId: 93, round: "Round of 16", label: "M93", sourceA: { type: "winner_of", matchId: 83 }, sourceB: { type: "winner_of", matchId: 84 } },
  { matchId: 94, round: "Round of 16", label: "M94", sourceA: { type: "winner_of", matchId: 81 }, sourceB: { type: "winner_of", matchId: 82 } },
  { matchId: 95, round: "Round of 16", label: "M95", sourceA: { type: "winner_of", matchId: 86 }, sourceB: { type: "winner_of", matchId: 88 } },
  { matchId: 96, round: "Round of 16", label: "M96", sourceA: { type: "winner_of", matchId: 85 }, sourceB: { type: "winner_of", matchId: 87 } },
]

// ─── Quarter-Final Definitions ────────────────────────────────────────

export const QF_MATCHES: BracketSlot[] = [
  { matchId: 97, round: "Quarter-Finals", label: "QF1", sourceA: { type: "winner_of", matchId: 89 }, sourceB: { type: "winner_of", matchId: 90 } },
  { matchId: 98, round: "Quarter-Finals", label: "QF2", sourceA: { type: "winner_of", matchId: 91 }, sourceB: { type: "winner_of", matchId: 92 } },
  { matchId: 99, round: "Quarter-Finals", label: "QF3", sourceA: { type: "winner_of", matchId: 93 }, sourceB: { type: "winner_of", matchId: 94 } },
  { matchId: 100, round: "Quarter-Finals", label: "QF4", sourceA: { type: "winner_of", matchId: 95 }, sourceB: { type: "winner_of", matchId: 96 } },
]

// ─── Semi-Final Definitions ───────────────────────────────────────────

export const SF_MATCHES: BracketSlot[] = [
  { matchId: 101, round: "Semi-Finals", label: "SF1", sourceA: { type: "winner_of", matchId: 97 }, sourceB: { type: "winner_of", matchId: 98 } },
  { matchId: 102, round: "Semi-Finals", label: "SF2", sourceA: { type: "winner_of", matchId: 99 }, sourceB: { type: "winner_of", matchId: 100 } },
]

// ─── Final Definitions ───────────────────────────────────────────────

export const FINAL_MATCH: BracketSlot = {
  matchId: 104, round: "Final", label: "Final",
  sourceA: { type: "winner_of", matchId: 101 },
  sourceB: { type: "winner_of", matchId: 102 },
}

export const THIRD_PLACE_MATCH: BracketSlot = {
  matchId: 103, round: "Third Place", label: "3rd",
  sourceA: { type: "loser_of", matchId: 101 },
  sourceB: { type: "loser_of", matchId: 102 },
}

// All bracket rounds in order
export const ALL_BRACKET_MATCHES: BracketSlot[] = [
  ...R32_MATCHES,
  ...R16_MATCHES,
  ...QF_MATCHES,
  ...SF_MATCHES,
  FINAL_MATCH,
  THIRD_PLACE_MATCH,
]

// ─── Bracket Edge Graph (for visualization) ───────────────────────────

export interface BracketEdge {
  parentMatchId: number  // the later round match
  childMatchId: number   // the earlier round match
  childSide: "A" | "B"  // which slot of the parent match this feeds into
}

export function buildBracketEdges(): BracketEdge[] {
  const edges: BracketEdge[] = []
  const allSlots = [FINAL_MATCH, ...SF_MATCHES, ...QF_MATCHES, ...R16_MATCHES]

  for (const slot of allSlots) {
    const extract = (source: TeamSource, side: "A" | "B") => {
      if (source.type === "winner_of") {
        edges.push({ parentMatchId: slot.matchId, childMatchId: source.matchId, childSide: side })
      }
    }
    extract(slot.sourceA, "A")
    extract(slot.sourceB, "B")
  }

  return edges
}

// ─── Third-Place Assignment (Annex C) ─────────────────────────────────

export interface ThirdPlaceResult {
  group: string
  teamId: string
  rank: number
  slot: string  // e.g. "1A", "1B"
}

/**
 * Assigns the 8 advancing third-placed teams to their R32 slots
 * using the official FIFA Annex C combination table (495 entries).
 *
 * @param advancingThirdPlaced - Array of { group, teamId } for the 8 best third-place teams,
 *   in order of best rank first.
 */
export function assignThirdPlacedToSlots(
  advancingThirdPlaced: { group: string; teamId: string }[]
): ThirdPlaceResult[] {
  const key = advancingThirdPlaced.map(t => t.group).sort().join("")

  const row = ANNEX_C_ROWS.find(
    r => r.split("").sort().join("") === key
  )

  if (!row) {
    console.warn(`[Annex C] No mapping found for combination "${key}". Falling back to DFS.`)
    return fallbackAssignThirdPlaced(advancingThirdPlaced)
  }

  const groupToTeamId: Record<string, string> = {}
  for (const t of advancingThirdPlaced) {
    groupToTeamId[t.group] = t.teamId
  }

  // Rank each third-place team (best = 1)
  const rankMap: Record<string, number> = {}
  advancingThirdPlaced.forEach((t, i) => { rankMap[t.group] = i + 1 })

  return ANNEX_C_WINNERS.map((winnerGroup, i) => {
    const sourceGroup = row[i]
    return {
      group: sourceGroup,
      teamId: groupToTeamId[sourceGroup] ?? "",
      rank: rankMap[sourceGroup] ?? 99,
      slot: `1${winnerGroup}`,
    }
  })
}

/**
 * Fallback: DFS-based assignment when the combination is not in Annex C.
 */
function fallbackAssignThirdPlaced(
  advancingThirdPlaced: { group: string; teamId: string }[]
): ThirdPlaceResult[] {
  const groups = advancingThirdPlaced.map(t => t.group)
  const usedSlots = new Set<string>()
  const assignment = new Map<string, string>()

  function dfs(groupIdx: number): boolean {
    if (groupIdx >= groups.length) return true
    const group = groups[groupIdx]

    const eligibleSlots = THIRD_PLACE_SLOTS
      .filter(s => s.pool.includes(group) && !usedSlots.has(s.slotId))
      .sort((a, b) => a.slotId.localeCompare(b.slotId))

    for (const slot of eligibleSlots) {
      assignment.set(group, slot.slotId)
      usedSlots.add(slot.slotId)
      if (dfs(groupIdx + 1)) return true
      assignment.delete(group)
      usedSlots.delete(slot.slotId)
    }
    return false
  }

  dfs(0)

  return groups.map((group, i) => ({
    group,
    teamId: advancingThirdPlaced[i].teamId,
    rank: i + 1,
    slot: assignment.get(group) ?? "",
  }))
}

// ─── Main Bracket Builder ─────────────────────────────────────────────

export interface BracketTeamSlot {
  matchId: number
  round: string
  teamA: string | null
  teamB: string | null
}

/**
 * Builds the complete bracket seeding from group standings.
 */
export function buildBracketSeeding(
  standings: Record<string, GroupStanding[]>,
  advancingIds: string[],
  thirdPlaceAssignments: ThirdPlaceResult[]
): BracketTeamSlot[] {
  // Build lookup: group → winner teamId
  const groupWinners: Record<string, string> = {}
  const groupRunnersUp: Record<string, string> = {}
  const groupThirdPlaced: Record<string, string> = {}

  for (const [group, groupStandings] of Object.entries(standings)) {
    groupWinners[group] = groupStandings[0]?.teamId ?? ""
    groupRunnersUp[group] = groupStandings[1]?.teamId ?? ""
    groupThirdPlaced[group] = groupStandings[2]?.teamId ?? ""
  }

  // Build lookup: slotId → third-place teamId
  const thirdPlaceSlotMap: Record<string, string> = {}
  for (const tpr of thirdPlaceAssignments) {
    thirdPlaceSlotMap[tpr.slot] = tpr.teamId
  }

  function poolMatch(a: string[], b: string[]): boolean {
    return a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",")
  }

  function resolveSource(source: TeamSource): string | null {
    switch (source.type) {
      case "group_winner":
        return groupWinners[source.group] || null
      case "group_runner_up":
        return groupRunnersUp[source.group] || null
      case "third_place":
        return groupThirdPlaced[source.group] || null
      case "third_place_dependent": {
        const tpSlot = THIRD_PLACE_SLOTS.find(s => poolMatch(s.pool, source.groupPool))
        return tpSlot ? (thirdPlaceSlotMap[tpSlot.slotId] || null) : null
      }
      case "winner_of":
      case "loser_of":
        return null // resolved during simulation
    }
  }

  const result: BracketTeamSlot[] = []

  // Only R32 matches can be resolved here; later rounds resolved during simulation
  for (const match of R32_MATCHES) {
    result.push({
      matchId: match.matchId,
      round: match.round,
      teamA: resolveSource(match.sourceA),
      teamB: resolveSource(match.sourceB),
    })
  }

  // Add placeholder slots for later rounds (resolved during simulation)
  for (const match of R16_MATCHES) {
    result.push({ matchId: match.matchId, round: match.round, teamA: null, teamB: null })
  }
  for (const match of QF_MATCHES) {
    result.push({ matchId: match.matchId, round: match.round, teamA: null, teamB: null })
  }
  for (const match of SF_MATCHES) {
    result.push({ matchId: match.matchId, round: match.round, teamA: null, teamB: null })
  }
  result.push({ matchId: FINAL_MATCH.matchId, round: FINAL_MATCH.round, teamA: null, teamB: null })

  return result
}

// ─── Simulation Helpers ─────────────────────────────────────────────────

export function getKnockoutRoundDefs(is32TeamFormat: boolean): BracketSlot[][] {
  return is32TeamFormat
    ? [R16_MATCHES, QF_MATCHES, SF_MATCHES, [FINAL_MATCH]]
    : [R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, [FINAL_MATCH]]
}

export function getKnockoutRoundNames(is32TeamFormat: boolean): string[] {
  return is32TeamFormat
    ? ["Round of 16", "Quarter-Finals", "Semi-Finals", "Final"]
    : ["Round of 32", "Round of 16", "Quarter-Finals", "Semi-Finals", "Final"]
}

export function getKnockoutResultKeys(is32TeamFormat: boolean): string[] {
  return is32TeamFormat
    ? ["quarterFinal", "semiFinal", "final", "champion"]
    : ["roundOf16", "quarterFinal", "semiFinal", "final", "champion"]
}

/**
 * Resolve a TeamSource to a teamId using only match winners from previous rounds.
 * Used for R16+ rounds where teams come from prior matches.
 */
export function resolveSourceFromWinners(
  source: TeamSource,
  matchWinners: Record<number, string>
): string | null {
  if (source.type === "winner_of") return matchWinners[source.matchId] ?? null
  return null
}

/**
 * Extract the advancing third-place teams with their group letters,
 * sorted by performance (best first).
 */
export function computeThirdPlaceAdvancing(
  standings: Record<string, GroupStanding[]>
): { group: string; teamId: string }[] {
  const allThirdPlaced: { group: string; teamId: string; points: number; gd: number; gf: number }[] = []
  for (const [group, groupStandings] of Object.entries(standings)) {
    if (groupStandings[2]) {
      const t = groupStandings[2]
      allThirdPlaced.push({ group, teamId: t.teamId, points: t.points, gd: t.goalDifference, gf: t.goalsFor })
    }
  }
  allThirdPlaced.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    return b.gf - a.gf
  })
  return allThirdPlaced.slice(0, 8).map(t => ({ group: t.group, teamId: t.teamId }))
}

// ─── Get possible opponents for a team in each round ──────────────────

export interface CrossingPath {
  round: string
  possibleOpponents: string[]
  matchId: number
}

/**
 * For a given team, compute all possible opponents they could face in each round,
 * based on the bracket structure and which teams are in which slots.
 */
export function getTeamCrossings(
  teamId: string,
  bracketSlots: BracketTeamSlot[],
  advancingIds: string[]
): CrossingPath[] {
  // Find which R32 match this team is in
  const teamSlot = bracketSlots.find(
    s => s.teamA === teamId || s.teamB === teamId
  )
  if (!teamSlot) return []

  const paths: CrossingPath[] = []

  // Round of 32: opponent is the other team in the same match
  const opponent = teamSlot.teamA === teamId ? teamSlot.teamB : teamSlot.teamA
  if (opponent) {
    paths.push({
      round: "Round of 32",
      possibleOpponents: [opponent],
      matchId: teamSlot.matchId,
    })
  }

  // For later rounds, trace the bracket tree
  // Find the R16 match this team would feed into
  const edges = buildBracketEdges()
  const teamMatchId = teamSlot.matchId

  let currentMatchId = teamMatchId
  const allRounds = ["Round of 16", "Quarter-Finals", "Semi-Finals", "Final"]

  for (const roundName of allRounds) {
    // Find the parent edge
    const edge = edges.find(e => e.childMatchId === currentMatchId)
    if (!edge) break

    const parentSlot = bracketSlots.find(s => s.matchId === edge.parentMatchId)
    if (!parentSlot) break

    // The possible opponents come from the other side of the parent match
    // If our team feeds into side A, opponents come from side B's subtree
    const otherSide = edge.childSide === "A" ? "B" : "A"

    // Collect all teams that could reach this slot from the other side
    const possibleOpponents = collectPossibleOpponents(
      otherSide,
      edge.parentMatchId,
      bracketSlots,
      edges,
      advancingIds
    )

    if (possibleOpponents.length > 0) {
      paths.push({
        round: roundName,
        possibleOpponents,
        matchId: edge.parentMatchId,
      })
    }

    currentMatchId = edge.parentMatchId
  }

  return paths
}

function collectPossibleOpponents(
  side: "A" | "B",
  parentMatchId: number,
  bracketSlots: BracketTeamSlot[],
  edges: BracketEdge[],
  advancingIds: string[]
): string[] {
  // Find the child match that feeds into this side
  const childEdge = edges.find(
    e => e.parentMatchId === parentMatchId && e.childSide === side
  )
  if (!childEdge) return []

  const childSlot = bracketSlots.find(s => s.matchId === childEdge.childMatchId)
  if (!childSlot) return []

  // If teams are already assigned to this child slot, return them
  const candidates: string[] = []
  if (childSlot.teamA && advancingIds.includes(childSlot.teamA)) {
    candidates.push(childSlot.teamA)
  }
  if (childSlot.teamB && advancingIds.includes(childSlot.teamB)) {
    candidates.push(childSlot.teamB)
  }

  // If both teams are known, just return them
  if (candidates.length === 2) return candidates

  // Otherwise, recurse deeper to find all possible teams from this subtree
  const deeperA = collectPossibleOpponents(
    "A", childEdge.childMatchId, bracketSlots, edges, advancingIds
  )
  const deeperB = collectPossibleOpponents(
    "B", childEdge.childMatchId, bracketSlots, edges, advancingIds
  )

  return [...new Set([...deeperA, ...deeperB, ...candidates])]
}
