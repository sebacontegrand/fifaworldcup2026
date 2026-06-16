import { NextRequest, NextResponse } from "next/server"

const WIKIDATA_API = "https://www.wikidata.org/w/api.php"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")

  if (action === "search") {
    const query = searchParams.get("query")
    if (!query || query.length < 1) return NextResponse.json({ search: [] })
    const url = `${WIKIDATA_API}?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&limit=8`
    const res = await fetch(url, { headers: { "User-Agent": "2026FIFAWC/1.0" } })
    const data = await res.json()
    return NextResponse.json(data)
  }

  if (action === "label") {
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const url = `${WIKIDATA_API}?action=wbsearchentities&search=&language=en&format=json&ids=${id}`
    const res = await fetch(url, { headers: { "User-Agent": "2026FIFAWC/1.0" } })
    const data = await res.json()
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
