"use client"
import Link from "next/link"
import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Match, MatchData } from "@/lib/types"
import { getAllTeams, CATEGORIES, CATEGORY_LABELS, getMaxRound } from "@/lib/utils"
import SearchBar from "@/components/SearchBar"
import MatchCard from "@/components/MatchCard"
import TeamPanel from "@/components/TeamPanel"
import SubscribeModal from "@/components/SubscribeModal"

function PartidosInner() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<MatchData | null>(null)
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("cat") ?? "")
  const [selectedRound, setSelectedRound] = useState<number | "">("")
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
  const [page, setPage] = useState(1)
  const PER_PAGE = 30

  useEffect(() => {
    fetch("/data/matches.json")
      .then(r => r.json())
      .then(setData)
  }, [])

  const allMatches = data?.matches ?? []
  const teams = useMemo(() => getAllTeams(allMatches), [allMatches])

  const maxRound = useMemo(() =>
    selectedCategory ? getMaxRound(allMatches, selectedCategory) : 0,
    [allMatches, selectedCategory]
  )

  const filtered = useMemo(() => {
    let ms = allMatches
    if (selectedTeam) ms = ms.filter(m => m.home_team === selectedTeam || m.away_team === selectedTeam)
    if (selectedCategory) ms = ms.filter(m => m.category === selectedCategory)
    if (selectedRound !== "") ms = ms.filter(m => m.round === selectedRound)
    return [...ms].sort((a, b) => {
      const da = a.date ?? ""
      const db = b.date ?? ""
      return sortOrder === "desc" ? db.localeCompare(da) : da.localeCompare(db)
    })
  }, [allMatches, selectedTeam, selectedCategory, selectedRound])

  const teamMatches = useMemo(() =>
    selectedTeam ? allMatches.filter(m =>
      (m.home_team === selectedTeam || m.away_team === selectedTeam) &&
      (!selectedCategory || m.category === selectedCategory)
    ) : [],
    [allMatches, selectedTeam, selectedCategory]
  )

  const paged = filtered.slice(0, page * PER_PAGE)
  const hasMore = paged.length < filtered.length

  const resetFilters = () => {
    setSelectedTeam("")
    setSelectedCategory("")
    setSelectedRound("")
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-700 text-white px-4 py-5 shadow-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-green-300 text-sm group-hover:text-white transition-colors">←</span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">⚽ Cadetes.cl</h1>
                <p className="text-green-200 text-xs mt-0.5">Fútbol formativo chileno Sub-11 a Sub-20</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/tabla" className="text-green-200 hover:text-white text-sm hidden sm:block transition-colors">
                Tabla →
              </Link>
              <button
                onClick={() => setShowSubscribe(true)}
                className="bg-white text-green-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-green-50 transition-colors shadow-sm"
              >
                Seguir equipo
              </button>
            </div>
          </div>
          <SearchBar teams={teams} value={selectedTeam} onChange={team => { setSelectedTeam(team); setPage(1) }} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Team Panel */}
        {selectedTeam && teamMatches.length > 0 && (
          <div className="mb-6">
            <TeamPanel team={selectedTeam} matches={teamMatches} allMatches={allMatches} />
          </div>
        )}

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => { setSelectedCategory(""); setSelectedRound(""); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              !selectedCategory ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-green-400"
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat === selectedCategory ? "" : cat); setSelectedRound(""); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-green-400"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Round filter */}
        {selectedCategory && maxRound > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="text-xs text-gray-500 self-center mr-1">Fecha:</span>
            {Array.from({ length: maxRound }, (_, i) => i + 1).map(r => (
              <button
                key={r}
                onClick={() => { setSelectedRound(selectedRound === r ? "" : r); setPage(1) }}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                  selectedRound === r ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-green-400"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Count + sort */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            {data ? `${filtered.length} partidos` : "Cargando..."}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden text-xs font-semibold">
              <button
                onClick={() => { setSortOrder("desc"); setPage(1) }}
                className={`px-3 py-1.5 transition-colors ${sortOrder === "desc" ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                Más reciente
              </button>
              <button
                onClick={() => { setSortOrder("asc"); setPage(1) }}
                className={`px-3 py-1.5 transition-colors ${sortOrder === "asc" ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                Más antigua
              </button>
            </div>
            {(selectedTeam || selectedCategory || selectedRound !== "") && (
              <button onClick={resetFilters} className="text-xs text-green-600 hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Skeleton */}
        {!data && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        )}

        {/* Empty */}
        {data && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">No se encontraron partidos</p>
            <p className="text-sm mt-1">Intenta con otro equipo o categoría</p>
          </div>
        )}

        {/* Match list */}
        <div className="space-y-3">
          {paged.map((match, i) => (
            <MatchCard key={i} match={match} highlight={selectedTeam} />
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="mt-6 w-full py-3 border-2 border-green-600 text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-colors text-sm"
          >
            Ver más partidos
          </button>
        )}

        {data && (
          <p className="text-center text-xs text-gray-300 mt-8">
            Actualizado: {new Date(data.updated_at).toLocaleDateString("es-CL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </main>

      {showSubscribe && (
        <SubscribeModal
          onClose={() => setShowSubscribe(false)}
          defaultTeam={selectedTeam}
        />
      )}
    </div>
  )
}

export default function Partidos() {
  return (
    <Suspense>
      <PartidosInner />
    </Suspense>
  )
}
