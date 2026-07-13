import { Match, StandingRow } from "./types"

export const CATEGORIES = [
  "sub-11", "sub-12", "sub-13", "sub-14",
  "sub-15", "sub-16", "sub-18", "sub-20",
]

export const CATEGORY_LABELS: Record<string, string> = {
  "sub-11": "Sub 11", "sub-12": "Sub 12", "sub-13": "Sub 13",
  "sub-14": "Sub 14", "sub-15": "Sub 15", "sub-16": "Sub 16",
  "sub-18": "Sub 18", "sub-20": "Sub 20",
}

export function getAllTeams(matches: Match[]): string[] {
  const teams = new Set<string>()
  for (const m of matches) {
    teams.add(m.home_team)
    teams.add(m.away_team)
  }
  return Array.from(teams).sort()
}

export function getStandings(matches: Match[], category: string): StandingRow[] {
  const rows: Record<string, StandingRow> = {}

  const ensure = (team: string) => {
    if (!rows[team]) rows[team] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
  }

  for (const m of matches) {
    if (m.category !== category || m.status !== "played" || m.home_score === null || m.away_score === null) continue
    ensure(m.home_team)
    ensure(m.away_team)

    const h = rows[m.home_team]
    const a = rows[m.away_team]
    h.played++; a.played++
    h.gf += m.home_score; h.ga += m.away_score
    a.gf += m.away_score; a.ga += m.home_score

    if (m.home_score > m.away_score) { h.won++; h.points += 3; a.lost++ }
    else if (m.home_score < m.away_score) { a.won++; a.points += 3; h.lost++ }
    else { h.drawn++; h.points++; a.drawn++; a.points++ }
  }

  return Object.values(rows)
    .map(r => ({ ...r, gd: r.gf - r.ga }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
}

export function getTeamSummary(matches: Match[], team: string) {
  const teamMatches = matches.filter(m => m.home_team === team || m.away_team === team)
  const played = teamMatches.filter(m => m.status === "played")
  const upcoming = teamMatches.filter(m => m.status === "pending" && m.date)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))

  const next = upcoming[0] ?? null
  const remaining = upcoming.length

  const categories = [...new Set(teamMatches.map(m => m.category))]

  return { teamMatches, played, next, remaining, categories }
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Por confirmar"
  const [year, month, day] = dateStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })
}

export function getMaxRound(matches: Match[], category: string): number {
  return Math.max(0, ...matches.filter(m => m.category === category && m.round !== null).map(m => m.round!))
}
