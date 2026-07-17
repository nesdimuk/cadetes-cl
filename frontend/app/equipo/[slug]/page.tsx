"use client"
import Link from "next/link"
import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams, useParams } from "next/navigation"
import { Match, MatchData, StandingEntry, StandingsData } from "@/lib/types"
import { CATEGORY_LABELS, formatDate } from "@/lib/utils"
import SubscribeModal from "@/components/SubscribeModal"

function slugToTeam(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ")
}

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

type FormResult = "W" | "D" | "L"

function getResult(m: Match, team: string): FormResult {
  const isHome = normalize(m.home_team) === normalize(team)
  const myScore = isHome ? m.home_score! : m.away_score!
  const theirScore = isHome ? m.away_score! : m.home_score!
  if (myScore > theirScore) return "W"
  if (myScore < theirScore) return "L"
  return "D"
}

const RESULT_COLORS: Record<FormResult, string> = {
  W: "bg-green-500 text-white",
  D: "bg-yellow-400 text-white",
  L: "bg-red-400 text-white",
}
const RESULT_LABELS: Record<FormResult, string> = { W: "G", D: "E", L: "P" }

function EquipoInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const teamSlug = slugToTeam(slug)

  const [matchesData, setMatchesData] = useState<MatchData | null>(null)
  const [standingsData, setStandingsData] = useState<StandingsData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("cat") ?? "")
  const [showSubscribe, setShowSubscribe] = useState(false)

  useEffect(() => {
    fetch("/data/matches.json").then(r => r.json()).then(setMatchesData)
    fetch("/data/standings.json").then(r => r.json()).then(setStandingsData)
  }, [])

  const allMatches = matchesData?.matches ?? []

  // Busca el nombre real del equipo (puede diferir en capitalización)
  const teamName = useMemo(() => {
    for (const m of allMatches) {
      if (normalize(m.home_team) === normalize(teamSlug)) return m.home_team
      if (normalize(m.away_team) === normalize(teamSlug)) return m.away_team
    }
    return teamSlug
  }, [allMatches, teamSlug])

  // Categorías en las que juega
  const categories = useMemo(() => {
    const cats = new Set(
      allMatches
        .filter(m => normalize(m.home_team) === normalize(teamName) || normalize(m.away_team) === normalize(teamName))
        .map(m => m.category)
    )
    return Array.from(cats).sort()
  }, [allMatches, teamName])

  // Categoría activa
  const activeCat = selectedCategory || categories[0] || ""

  // Partidos del equipo en la categoría activa
  const teamMatches = useMemo(() =>
    allMatches
      .filter(m =>
        m.category === activeCat &&
        (normalize(m.home_team) === normalize(teamName) || normalize(m.away_team) === normalize(teamName))
      )
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
    [allMatches, teamName, activeCat]
  )

  const played = teamMatches.filter(m => m.status === "played")
  const upcoming = [...teamMatches.filter(m => m.status === "pending")].reverse()
  const form = played.slice(0, 5).map(m => getResult(m, teamName)).reverse()

  // Posición en tabla
  const standing = useMemo((): (StandingEntry & { group: string }) | null => {
    if (!standingsData) return null
    return standingsData.standings.find(
      s => s.category === activeCat && normalize(s.team) === normalize(teamName)
    ) ?? null
  }, [standingsData, teamName, activeCat])

  const today = new Date().toISOString().split("T")[0]
  const nextMatch = upcoming.find(m => m.date && m.date >= today)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-700 text-white px-4 py-4 shadow">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/tabla" className="text-green-200 hover:text-white text-sm">← Tabla</Link>
            <span className="text-green-400">|</span>
            <h1 className="font-bold text-lg truncate">⚽ {teamName}</h1>
          </div>
          <button
            onClick={() => setShowSubscribe(true)}
            className="bg-white text-green-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors shrink-0"
          >
            Seguir equipo
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Selector de categoría */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  activeCat === cat
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-green-400"
                }`}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        )}

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {standing && (
            <>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-3xl font-extrabold text-green-700">{standing.rank}°</p>
                <p className="text-xs text-gray-400 mt-1">{standing.group}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-3xl font-extrabold text-gray-800">{standing.pts}</p>
                <p className="text-xs text-gray-400 mt-1">puntos</p>
              </div>
            </>
          )}
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-3xl font-extrabold text-gray-800">{played.length}</p>
            <p className="text-xs text-gray-400 mt-1">jugados</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-3xl font-extrabold text-gray-800">{upcoming.length}</p>
            <p className="text-xs text-gray-400 mt-1">por jugar</p>
          </div>
        </div>

        {/* Forma reciente */}
        {form.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Forma reciente</p>
            <div className="flex gap-2">
              {form.map((r, i) => (
                <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${RESULT_COLORS[r]}`}>
                  {RESULT_LABELS[r]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Próximo partido */}
        {nextMatch && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-2">Próximo partido</p>
            <p className="font-bold text-gray-800">
              {nextMatch.home_team} <span className="text-gray-400 font-normal">vs</span> {nextMatch.away_team}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(nextMatch.date)}{nextMatch.time ? ` · ${nextMatch.time}` : ""}
              {nextMatch.stadium ? ` · ${nextMatch.stadium}` : ""}
            </p>
            <p className="text-xs text-gray-400 mt-1">Fecha {nextMatch.round}</p>
          </div>
        )}

        {/* Historial */}
        {played.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Resultados</p>
            </div>
            <div className="divide-y divide-gray-50">
              {played.map((m, i) => {
                const r = getResult(m, teamName)
                const isHome = normalize(m.home_team) === normalize(teamName)
                const rival = isHome ? m.away_team : m.home_team
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${RESULT_COLORS[r]}`}>
                      {RESULT_LABELS[r]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {m.home_team} {m.home_score} – {m.away_score} {m.away_team}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(m.date)} · F{m.round} · de {isHome ? "local" : "visita"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Próximos partidos */}
        {upcoming.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Calendario</p>
            </div>
            <div className="divide-y divide-gray-50">
              {upcoming.map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-6 h-6 rounded-full border-2 border-gray-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {m.home_team} vs {m.away_team}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(m.date)}{m.time ? ` · ${m.time}` : ""} · F{m.round}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs">
          Datos de{" "}
          <a href="https://www.campeonatochileno.cl" target="_blank" rel="noopener noreferrer" className="hover:underline">
            campeonatochileno.cl
          </a>
        </p>
      </div>

      {showSubscribe && <SubscribeModal onClose={() => setShowSubscribe(false)} defaultTeam={teamName} />}
    </div>
  )
}

export default function Equipo() {
  return (
    <Suspense>
      <EquipoInner />
    </Suspense>
  )
}
