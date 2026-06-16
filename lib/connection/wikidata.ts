import type { Player, TeamExperience } from "./types"

const WIKIDATA_API = "https://www.wikidata.org/w/api.php"
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

const countryCodeMap: Record<string, string> = {
  Q414: "ar", Q142: "fr", Q155: "br", Q16: "ca", Q30: "us",
  Q145: "gb", Q183: "de", Q38: "it", Q41: "gr", Q29: "es",
  Q55: "nl", Q39: "ch", Q40: "at", Q36: "pl", Q213: "cz",
  Q117: "gh", Q23: "se", Q34: "no", Q35: "dk", Q33: "fi",
  Q37: "hr", Q214: "si", Q215: "sk", Q28: "hu", Q218: "ro",
  Q219: "bg", Q220: "rs", Q221: "mk", Q222: "al", Q228: "mt",
  Q20: "no", Q102: "nl", Q822: "lb", Q233: "qa",
  Q865: "tw", Q148: "cn", Q17: "jp", Q884: "kr", Q96: "mx",
  Q79: "eg", Q115: "dz", Q258: "za",
  Q76: "us", Q252: "co", Q739: "ve", Q736: "ec",
  Q750: "bo", Q770: "uy", Q733: "py", Q754: "pe",
}

function getCountryCode(wikidataId: string): string {
  return countryCodeMap[wikidataId] ?? ""
}

async function sparqlQuery(query: string): Promise<any[]> {
  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: { "User-Agent": "2026FIFAWC/1.0", Accept: "application/sparql-results+json" },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.results?.bindings ?? []
}

export async function searchWikidataPlayers(query: string): Promise<{ id: string; label: string }[]> {
  const url = `/api/wikidata?action=search&query=${encodeURIComponent(query)}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return (data.search ?? []).filter(
    (e: any) => e.id && e.label && !e.id.startsWith("Q5")
  ).map((e: any) => ({ id: e.id, label: e.label }))
}

export async function fetchPlayerFromWikidata(wikidataId: string): Promise<Player | null> {
  const [infoRows, teamRows] = await Promise.all([
    sparqlQuery(`
      SELECT ?image ?nationality ?nationalityLabel ?position WHERE {
        wd:${wikidataId} wdt:P31 wd:Q5.
        OPTIONAL { wd:${wikidataId} wdt:P18 ?image. }
        OPTIONAL { wd:${wikidataId} wdt:P27 ?nationality. }
        OPTIONAL { wd:${wikidataId} wdt:P413 ?position. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
    `),
    sparqlQuery(`
      SELECT ?team ?teamLabel ?startYear ?endYear ?teamLogo WHERE {
        wd:${wikidataId} p:P54 ?statement.
        ?statement ps:P54 ?team.
        OPTIONAL { ?statement pq:P580 ?startYear. }
        OPTIONAL { ?statement pq:P582 ?endYear. }
        OPTIONAL { ?team wdt:P154 ?teamLogo. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
    `),
  ])

  const info = infoRows[0]
  if (!info) return null

  const nationalityLabel = info.nationalityLabel?.value ?? ""
  const nationalityId = info.nationality?.value?.split("/").pop() ?? ""

  const player: Player = {
    id: wikidataId,
    name: "",
    nationality: nationalityLabel,
    nationalityFlag: nationalityId ? `https://flagcdn.com/w80/${getCountryCode(nationalityId)}.png` : undefined,
    image: info.image?.value || undefined,
    position: info.position?.value || undefined,
    teams: teamRows
      .filter((r: any) => r.team?.value)
      .map((r: any) => ({
        teamId: r.team.value.split("/").pop(),
        teamName: r.teamLabel?.value ?? "Unknown",
        startYear: r.startYear?.value ? parseInt(r.startYear.value) : undefined,
        endYear: r.endYear?.value ? parseInt(r.endYear.value) : undefined,
        logo: r.teamLogo?.value || undefined,
      })),
  }

  return player
}

export async function resolveWikidataLabel(wikidataId: string): Promise<string | null> {
  const url = `/api/wikidata?action=label&id=${wikidataId}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.entities?.[wikidataId]?.labels?.en?.value ?? null
}

export async function fetchAndSetPlayerName(player: Player): Promise<Player> {
  if (player.name) return player
  const name = await resolveWikidataLabel(player.id)
  return { ...player, name: name ?? player.id }
}
