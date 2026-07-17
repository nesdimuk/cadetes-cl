"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { MatchData } from "@/lib/types"
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/utils"
import SubscribeModal from "@/components/SubscribeModal"

const RESOURCES = [
  {
    emoji: "🥗",
    title: "Nutrición para jóvenes futbolistas",
    desc: "Qué comer antes y después de los partidos. Claves para el rendimiento y la recuperación.",
    tag: "Nutrición",
  },
  {
    emoji: "🧠",
    title: "La presión de ganar: cómo acompañar a tu hijo",
    desc: "Herramientas para padres que quieren apoyar sin presionar. El rol del entorno en la formación.",
    tag: "Psicología",
  },
  {
    emoji: "⚽",
    title: "Entendiendo el sistema formativo chileno",
    desc: "Sub-11 a Sub-20: qué se trabaja en cada etapa y qué esperar del proceso.",
    tag: "Formativo",
  },
  {
    emoji: "🚗",
    title: "Organización familiar en la semana de competencia",
    desc: "Tips para coordinar traslados, alimentación y descanso sin que el fútbol consuma a la familia.",
    tag: "Familia",
  },
]

const GUIDES = [
  {
    emoji: "📋",
    title: "Guía del padre presente",
    desc: "Cómo ser un apoyo real sin convertirte en el entrenador de la tribuna.",
    color: "from-green-600 to-green-800",
  },
  {
    emoji: "🍎",
    title: "Plan de alimentación semanal",
    desc: "7 días de menús pensados para jóvenes deportistas en etapa de formación.",
    color: "from-emerald-500 to-teal-700",
  },
  {
    emoji: "🗓️",
    title: "Checklist día de partido",
    desc: "Todo lo que tu hijo necesita llevar, comer y hacer antes de competir.",
    color: "from-teal-600 to-cyan-800",
  },
]

const CAT_ICONS: Record<string, string> = {
  "sub-11": "🌱", "sub-12": "⚡", "sub-13": "🔥", "sub-14": "🎯",
  "sub-15": "💪", "sub-16": "🏆", "sub-18": "⭐", "sub-20": "🦁",
}

export default function Landing() {
  const [data, setData] = useState<MatchData | null>(null)
  const [showSubscribe, setShowSubscribe] = useState(false)

  useEffect(() => {
    fetch("/data/matches.json").then(r => r.json()).then(setData)
  }, [])

  const totalTeams = data
    ? new Set([...data.matches.map(m => m.home_team), ...data.matches.map(m => m.away_team)]).size
    : null

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = data
    ? data.matches.filter(m => m.status === "pending" && m.date && m.date >= today).length
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-emerald-900 text-white"
        style={{ minHeight: "92vh" }}
      >
        {/* Cancha decorativa */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, white 1px, transparent 1px),
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px, 80px 80px, 80px 80px",
          }}
        />
        {/* Círculo central cancha */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-white/20 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-20 flex flex-col items-center text-center">
          <span className="text-6xl mb-6">⚽</span>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-none mb-4">
            Cadetes.cl
          </h1>
          <p className="text-green-200 text-lg sm:text-xl max-w-xl mb-8">
            El portal del fútbol formativo chileno.<br />
            Resultados, calendarios y recursos para padres de cadetes Sub-11 a Sub-20.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-14">
            <Link
              href="/partidos"
              className="bg-white text-green-800 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition-colors shadow-lg text-base"
            >
              Ver partidos →
            </Link>
            <Link
              href="/tabla"
              className="bg-white/15 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/25 transition-colors text-base border border-white/30"
            >
              Tabla de posiciones →
            </Link>
            <button
              onClick={() => setShowSubscribe(true)}
              className="border-2 border-white/60 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              Seguir mi equipo
            </button>
          </div>

          {/* Stats */}
          {data && (
            <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
              <div className="text-center">
                <p className="text-3xl font-extrabold">{data.total.toLocaleString("es-CL")}</p>
                <p className="text-green-300 text-xs mt-0.5">partidos</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-3xl font-extrabold">{totalTeams}</p>
                <p className="text-green-300 text-xs mt-0.5">clubes</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold">{upcoming}</p>
                <p className="text-green-300 text-xs mt-0.5">por jugar</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CATEGORÍAS ── */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Explora por categoría</h2>
        <p className="text-gray-500 text-sm mb-6">Selecciona la división de tu hijo para ver resultados y tabla.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => {
            const count = data?.matches.filter(m => m.category === cat).length ?? 0
            return (
              <Link
                key={cat}
                href={`/partidos?cat=${cat}`}
                className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-green-400 hover:shadow-md transition-all group"
              >
                <p className="text-3xl mb-2">{CAT_ICONS[cat]}</p>
                <p className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                  {CATEGORY_LABELS[cat]}
                </p>
                {data && <p className="text-xs text-gray-400 mt-0.5">{count} partidos</p>}
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── RECURSOS ── */}
      <section className="bg-white py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Recursos para padres</h2>
              <p className="text-gray-500 text-sm">Todo lo que necesitas saber para acompañar a tu hijo en el fútbol formativo.</p>
            </div>
            <span className="text-xs text-green-600 font-semibold hidden sm:block">Próximamente más artículos →</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {RESOURCES.map(r => (
              <div key={r.title} className="border border-gray-100 rounded-2xl p-5 hover:border-green-200 hover:shadow-sm transition-all cursor-pointer">
                <span className="inline-block text-2xl mb-3">{r.emoji}</span>
                <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{r.tag}</span>
                <h3 className="font-bold text-gray-800 mt-2 mb-1">{r.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUÍAS DESCARGABLES ── */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Guías gratuitas</h2>
        <p className="text-gray-500 text-sm mb-6">Descarga recursos prácticos para acompañar mejor a tu hijo.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {GUIDES.map(g => (
            <div
              key={g.title}
              className={`bg-gradient-to-br ${g.color} text-white rounded-2xl p-5 cursor-pointer hover:scale-105 transition-transform`}
              onClick={() => setShowSubscribe(true)}
            >
              <p className="text-4xl mb-3">{g.emoji}</p>
              <h3 className="font-bold text-base mb-1">{g.title}</h3>
              <p className="text-sm text-white/80 leading-relaxed mb-4">{g.desc}</p>
              <span className="inline-block text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                Descargar gratis →
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <p className="text-4xl mb-4">📬</p>
          <h2 className="text-3xl font-extrabold mb-3">Mantente al día</h2>
          <p className="text-green-200 mb-8 text-base">
            Resultados de tu equipo cada semana, artículos para padres y acceso anticipado a guías y recursos.
          </p>
          <button
            onClick={() => setShowSubscribe(true)}
            className="bg-white text-green-800 font-bold px-10 py-3 rounded-xl hover:bg-green-50 transition-colors shadow-lg text-base"
          >
            Suscribirme gratis
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-xs">
        <p>© 2026 Cadetes.cl · Datos de <a href="https://campeonatochileno.cl" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">campeonatochileno.cl</a></p>
        <p className="mt-1">Hecho con ❤️ para los padres del fútbol formativo chileno</p>
      </footer>

      {showSubscribe && (
        <SubscribeModal onClose={() => setShowSubscribe(false)} defaultTeam="" />
      )}
    </div>
  )
}
