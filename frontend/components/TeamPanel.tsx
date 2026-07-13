import { Match, StandingRow } from "@/lib/types"
import { formatDate, CATEGORY_LABELS, getStandings } from "@/lib/utils"

interface Props {
  team: string
  matches: Match[]
  allMatches: Match[]
}

export default function TeamPanel({ team, matches, allMatches }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const played = matches.filter(m => m.status === "played")
  const upcoming = matches
    .filter(m => m.status === "pending" && m.date && m.date >= today)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
  const next = upcoming[0] ?? null

  const categories = [...new Set(matches.map(m => m.category))].sort()

  const standings: { category: string; position: number; total: number }[] = categories.map(cat => {
    const table = getStandings(allMatches, cat)
    const pos = table.findIndex(r => r.team === team) + 1
    return { category: cat, position: pos, total: table.length }
  })

  const wins = played.filter(m =>
    (m.home_team === team && (m.home_score ?? 0) > (m.away_score ?? 0)) ||
    (m.away_team === team && (m.away_score ?? 0) > (m.home_score ?? 0))
  ).length
  const draws = played.filter(m => m.home_score === m.away_score).length
  const losses = played.length - wins - draws

  return (
    <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-2xl text-white p-5 shadow-lg">
      <h2 className="text-xl font-bold mb-1">{team}</h2>
      <p className="text-green-200 text-sm mb-4">
        {categories.map(c => CATEGORY_LABELS[c] ?? c).join(" · ")}
      </p>

      {/* Posición en tabla */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {standings.map(s => (
          <div key={s.category} className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-green-200 mb-1">{CATEGORY_LABELS[s.category] ?? s.category}</p>
            <p className="text-2xl font-bold">{s.position > 0 ? `${s.position}°` : "—"}</p>
            <p className="text-xs text-green-300">de {s.total} equipos</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-center mb-4">
        <div className="flex-1">
          <p className="text-2xl font-bold text-green-300">{wins}</p>
          <p className="text-xs text-green-200">Victorias</p>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-yellow-300">{draws}</p>
          <p className="text-xs text-green-200">Empates</p>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-red-300">{losses}</p>
          <p className="text-xs text-green-200">Derrotas</p>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold">{upcoming.length}</p>
          <p className="text-xs text-green-200">Fechas rest.</p>
        </div>
      </div>

      {/* Próximo partido */}
      {next && (
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-xs text-green-200 mb-1 uppercase tracking-wide">Próximo partido</p>
          <p className="font-semibold text-sm">{next.home_team} vs {next.away_team}</p>
          <p className="text-xs text-green-300 mt-0.5">
            {formatDate(next.date)} · {next.time}
          </p>
          {next.stadium && <p className="text-xs text-green-300 truncate">{next.stadium}</p>}
        </div>
      )}

      {!next && (
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <p className="text-sm text-green-200">Sin próximos partidos programados</p>
        </div>
      )}
    </div>
  )
}
