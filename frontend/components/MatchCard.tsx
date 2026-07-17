import Link from "next/link"
import { Match } from "@/lib/types"
import { formatDate, CATEGORY_LABELS } from "@/lib/utils"

function teamSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-")
}

export default function MatchCard({ match, highlight }: { match: Match; highlight?: string }) {
  const isPlayed = match.status === "played"

  const hl = (name: string) => {
    if (!highlight) return name
    const idx = name.toLowerCase().indexOf(highlight.toLowerCase())
    if (idx === -1) return name
    return (
      <>
        {name.slice(0, idx)}
        <mark className="bg-yellow-200 rounded px-0.5">{name.slice(idx, idx + highlight.length)}</mark>
        {name.slice(idx + highlight.length)}
      </>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          {CATEGORY_LABELS[match.category] ?? match.category}
        </span>
        <span className="text-xs text-gray-400">
          {match.round ? `Fecha ${match.round}` : ""} · {formatDate(match.date)} · {match.time}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/equipo/${teamSlug(match.home_team)}?cat=${match.category}`}
          className="flex-1 text-right font-semibold text-gray-800 text-sm hover:text-green-700 transition-colors"
        >
          {hl(match.home_team)}
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          {isPlayed ? (
            <span className="text-xl font-bold text-gray-900 tabular-nums w-16 text-center">
              {match.home_score} – {match.away_score}
            </span>
          ) : (
            <span className="text-sm text-gray-400 w-16 text-center">vs</span>
          )}
        </div>

        <Link
          href={`/equipo/${teamSlug(match.away_team)}?cat=${match.category}`}
          className="flex-1 font-semibold text-gray-800 text-sm hover:text-green-700 transition-colors"
        >
          {hl(match.away_team)}
        </Link>
      </div>

      <p className="mt-2 text-center text-xs text-gray-400 truncate">{match.stadium}</p>
    </div>
  )
}
