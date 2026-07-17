"use client"
import Link from "next/link"
import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { StandingEntry, StandingsData, Match, MatchData } from "@/lib/types"
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/utils"
import SubscribeModal from "@/components/SubscribeModal"

type FormResult = "W" | "D" | "L"

function getForm(matches: Match[], team: string, category: string): FormResult[] {
  const played = matches
    .filter(m =>
      m.category === category &&
      m.status === "played" &&
      m.home_score !== null &&
      (m.home_team === team || m.away_team === team)
    )
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 5)

  return played.map(m => {
    const isHome = m.home_team === team
    const myScore = isHome ? m.home_score! : m.away_score!
    const theirScore = isHome ? m.away_score! : m.home_score!
    if (myScore > theirScore) return "W"
    if (myScore < theirScore) return "L"
    return "D"
  }).reverse()
}

function FormDots({ form }: { form: FormResult[] }) {
  const colors: Record<FormResult, string> = {
    W: "bg-green-500",
    D: "bg-yellow-400",
    L: "bg-red-400",
  }
  const labels: Record<FormResult, string> = { W: "Victoria", D: "Empate", L: "Derrota" }

  return (
    <div className="flex gap-0.5 items-center">
      {form.map((r, i) => (
        <span
          key={i}
          title={labels[r]}
          className={`w-2 h-2 rounded-full ${colors[r]}`}
        />
      ))}
      {form.length === 0 && <span className="text-gray-300 text-xs">—</span>}
    </div>
  )
}

function TablaInner() {
  const searchParams = useSearchParams()
  const [standingsData, setStandingsData] = useState<StandingsData | null>(null)
  const [matchesData, setMatchesData] = useState<MatchData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("cat") ?? "sub-14")
  const [showSubscribe, setShowSubscribe] = useState(false)

  useEffect(() => {
    fetch("/data/standings.json").then(r => r.json()).then(setStandingsData)
    fetch("/data/matches.json").then(r => r.json()).then(setMatchesData)
  }, [])

  const groups = useMemo(() => {
    if (!standingsData) return {}
    const catRows = standingsData.standings.filter(s => s.category === selectedCategory)
    const grouped: Record<string, StandingEntry[]> = {}
    for (const row of catRows) {
      if (!grouped[row.group]) grouped[row.group] = []
      grouped[row.group].push(row)
    }
    for (const g of Object.keys(grouped)) {
      grouped[g].sort((a, b) => a.rank - b.rank)
    }
    return grouped
  }, [standingsData, selectedCategory])

  const allMatches = matchesData?.matches ?? []

  const updatedAt = standingsData?.updated_at
    ? new Date(standingsData.updated_at).toLocaleDateString("es-CL", {
        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
      })
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white px-4 py-4 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-green-200 hover:text-white text-sm">← Inicio</Link>
            <span className="text-green-400">|</span>
            <h1 className="font-bold text-lg">⚽ Tabla de posiciones</h1>
          </div>
          <div className="flex gap-3 items-center">
            <Link href="/partidos" className="text-green-200 hover:text-white text-sm hidden sm:block">Partidos</Link>
            <button
              onClick={() => setShowSubscribe(true)}
              className="bg-white text-green-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
            >
              Seguir mi equipo
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Selector de categoría */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                selectedCategory === cat
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-green-400"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Grupos */}
        {!standingsData ? (
          <div className="text-center py-16 text-gray-400">Cargando tablas...</div>
        ) : Object.keys(groups).length === 0 ? (
          <div className="text-center py-16 text-gray-400">Sin datos para esta categoría.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(groups).map(([groupName, rows]) => (
              <div key={groupName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-green-700 px-4 py-3">
                  <h2 className="text-white font-bold text-sm">{groupName}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs">
                        <th className="text-left px-3 py-2 font-semibold w-6">#</th>
                        <th className="text-left px-3 py-2 font-semibold">Club</th>
                        <th className="text-center px-2 py-2 font-semibold" title="Partidos jugados">PJ</th>
                        <th className="text-center px-2 py-2 font-semibold hidden sm:table-cell" title="Victorias">V</th>
                        <th className="text-center px-2 py-2 font-semibold hidden sm:table-cell" title="Empates">E</th>
                        <th className="text-center px-2 py-2 font-semibold hidden sm:table-cell" title="Derrotas">D</th>
                        <th className="text-center px-2 py-2 font-semibold hidden sm:table-cell" title="Diferencia de goles">DG</th>
                        <th className="text-center px-2 py-2 font-semibold text-green-700">PT</th>
                        <th className="text-left px-2 py-2 font-semibold hidden md:table-cell" title="Últimos 5 partidos">Forma</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map((row, idx) => {
                        const form = allMatches.length > 0
                          ? getForm(allMatches, row.team, selectedCategory)
                          : []
                        return (
                          <tr
                            key={row.team}
                            className={`transition-colors ${idx === 0 ? "bg-green-50" : "hover:bg-gray-50"}`}
                          >
                            <td className="px-3 py-2.5 text-gray-400 font-bold text-xs">{row.rank}</td>
                            <td className="px-3 py-2.5">
                              <Link
                                href={`/equipo/${encodeURIComponent(row.team.toLowerCase().replace(/\s+/g, "-"))}?cat=${selectedCategory}`}
                                className="font-semibold text-gray-800 hover:text-green-700 transition-colors"
                              >
                                {row.team}
                              </Link>
                            </td>
                            <td className="text-center px-2 py-2.5 text-gray-600">{row.played}</td>
                            <td className="text-center px-2 py-2.5 text-gray-600 hidden sm:table-cell">{row.won}</td>
                            <td className="text-center px-2 py-2.5 text-gray-600 hidden sm:table-cell">{row.drawn}</td>
                            <td className="text-center px-2 py-2.5 text-gray-600 hidden sm:table-cell">{row.lost}</td>
                            <td className={`text-center px-2 py-2.5 hidden sm:table-cell font-medium ${
                              row.gd > 0 ? "text-green-600" : row.gd < 0 ? "text-red-500" : "text-gray-400"
                            }`}>
                              {row.gd > 0 ? `+${row.gd}` : row.gd}
                            </td>
                            <td className="text-center px-2 py-2.5 font-bold text-green-700">{row.pts}</td>
                            <td className="px-2 py-2.5 hidden md:table-cell">
                              <FormDots form={form} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leyenda forma */}
        {allMatches.length > 0 && (
          <div className="flex gap-4 justify-center mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Victoria</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Empate</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Derrota</span>
            <span className="text-gray-300">· últimos 5 partidos →</span>
          </div>
        )}

        {updatedAt && (
          <p className="text-center text-gray-400 text-xs mt-6">
            Datos de{" "}
            <a href="https://www.campeonatochileno.cl" target="_blank" rel="noopener noreferrer" className="hover:underline">
              campeonatochileno.cl
            </a>{" "}
            · Actualizado el {updatedAt}
          </p>
        )}
      </div>

      {showSubscribe && <SubscribeModal onClose={() => setShowSubscribe(false)} />}
    </div>
  )
}

export default function Tabla() {
  return (
    <Suspense>
      <TablaInner />
    </Suspense>
  )
}
