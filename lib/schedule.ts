import scheduleData from "@/data/fifa_2026_group_stage.json"
import teamsData from "@/data/teams.json"

export interface KnockoutFixture {
  id: string
  round: string
  matchOrder: number
  teamAId: string | null
  teamBId: string | null
  teamAName: string | null
  teamBName: string | null
  date: string
  timeUTC: string
  venue: string
  scoreA: number | null
  scoreB: number | null
  isFact: boolean
  guess: { scoreA: number; scoreB: number } | null
}

export interface ScheduleMatch {
  matchNumber: number
  date: string
  time: string
  kickoffUTC: Date | null
  groupId: string
  stadium: string
  homeTeam: string
  awayTeam: string
  homeTeamId: string | null
  awayTeamId: string | null
  homeTeamFlag: string | null
  awayTeamFlag: string | null
  mapped: boolean
  timeArt: string | null
  tvArgentina: string[] | null
}

export interface DaySchedule {
  date: string
  label: string
  matches: ScheduleMatch[]
}

const nameNormalization: Record<string, string | null> = {
  Czechia: "Czech Republic",
  USA: "United States",
  Turkiye: "Turkey",
}

const spanishToEnglish: Record<string, string | null> = {
  Alemania: "Germany",
  "Arabia Saudí": "Saudi Arabia",
  Argelia: "Algeria",
  Bosnia: "Bosnia and Herzegovina",
  Brasil: "Brazil",
  Bélgica: "Belgium",
  "Cabo Verde": "Cape Verde",
  Canadá: "Canada",
  Catar: "Qatar",
  "Costa de Marfil": "Ivory Coast",
  Croacia: "Croatia",
  Curazao: "Curacao",
  Egipto: "Egypt",
  Escocia: "Scotland",
  España: "Spain",
  "Estados Unidos": "United States",
  Francia: "France",
  Haití: "Haiti",
  Inglaterra: "England",
  Irak: "Iraq",
  Irán: "Iran",
  Japón: "Japan",
  Jordania: "Jordan",
  Marruecos: "Morocco",
  México: "Mexico",
  Noruega: "Norway",
  "Nueva Zelanda": "New Zealand",
  Panamá: "Panama",
  "Países Bajos": "Netherlands",
  "RD de Congo": "DR Congo",
  "República Checa": "Czech Republic",
  "República de Corea": "South Korea",
  Sudáfrica: "South Africa",
  Suecia: "Sweden",
  Suiza: "Switzerland",
  Turquía: "Turkey",
  Túnez: "Tunisia",
  Uzbekistán: "Uzbekistan",
}

const teamsByName: Record<string, { id: string; name: string; flag: string }> = {}
for (const t of teamsData as { id: string; name: string; flag: string }[]) {
  teamsByName[t.name.toLowerCase()] = t
}

function toEnglish(name: string): string | null {
  const normalized = nameNormalization[name]
  if (normalized !== undefined) return normalized
  const mapped = spanishToEnglish[name]
  if (mapped === undefined) return name
  return mapped
}

function lookupTeam(name: string): { id: string; name: string; flag: string } | null {
  const en = toEnglish(name)
  if (!en) return null
  return teamsByName[en.toLowerCase()] ?? null
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function parseUTCFromSchedule(dateStr: string, timeUTC: string | undefined): Date | null {
  if (!timeUTC) return null

  const cleaned = timeUTC.replace(/\./g, "").trim()

  const dateOverride = cleaned.match(/\(([A-Z][a-z]+)\s+(\d+)\)/)
  let effectiveDate = dateStr
  if (dateOverride) {
    const months: Record<string, string> = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
      Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    }
    const m = months[dateOverride[1]]
    const d = dateOverride[2].padStart(2, "0")
    if (m) {
      const y = dateStr.split("-")[0]
      effectiveDate = `${y}-${m}-${d}`
    }
  }

  const timeMatch = cleaned.match(/(\d+):(\d+)\s*UTC/)
  if (!timeMatch) return null

  const hours = parseInt(timeMatch[1])
  const minutes = parseInt(timeMatch[2])

  return new Date(`${effectiveDate}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00Z`)
}

export function getScheduleByDay(): DaySchedule[] {
  const matches: ScheduleMatch[] = scheduleData.matches.map((m: any) => {
    const home = lookupTeam(m.home_team)
    const away = lookupTeam(m.away_team)
    return {
      matchNumber: m.match_number,
      date: m.date,
      time: m.time_local || m.time,
      kickoffUTC: parseUTCFromSchedule(m.date, m.time_utc),
      groupId: m.group,
      stadium: m.stadium,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      homeTeamId: home?.id ?? null,
      awayTeamId: away?.id ?? null,
      homeTeamFlag: home?.flag ?? null,
      awayTeamFlag: away?.flag ?? null,
      mapped: !!home && !!away,
      timeArt: m.time_art ?? null,
      tvArgentina: m.tv_argentina ?? null,
    }
  })

  const days: Record<string, ScheduleMatch[]> = {}
  for (const m of matches) {
    if (!days[m.date]) days[m.date] = []
    days[m.date].push(m)
  }

  return Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayMatches]) => ({
      date,
      label: formatDateLabel(date),
      matches: dayMatches.sort((a, b) => a.matchNumber - b.matchNumber),
    }))
}

export function getDayLabels(): { date: string; label: string }[] {
  return getScheduleByDay().map((d) => ({ date: d.date, label: d.label }))
}

function parseTimeToDate(dateStr: string, timeStr: string): Date {
  const cleaned = timeStr.replace(/\./g, "").trim().toLowerCase()
  let hours = 0
  let minutes = 0
  const match = cleaned.match(/(\d+):?(\d*)?\s*(a\.?m\.?|p\.?m\.?|m\.?)?/)
  if (!match) return new Date(dateStr + "T12:00:00")
  hours = parseInt(match[1])
  minutes = parseInt(match[2]) || 0
  const meridian = (match[3] || "").replace(/\./g, "").trim()
  if (meridian === "p" && hours !== 12) hours += 12
  if (meridian === "a" && hours === 12) hours = 0
  if (meridian === "m") hours = 12
  const iso = `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
  return new Date(iso)
}

export function getMatchKickoff(match: ScheduleMatch): Date {
  return match.kickoffUTC ?? parseTimeToDate(match.date, match.time)
}

export function isMatchLocked(match: ScheduleMatch): boolean {
  return getMatchKickoff(match) <= new Date()
}

export function getCountdown(date: Date): string {
  const diff = date.getTime() - Date.now()
  if (diff <= 0) return "Locked"
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
