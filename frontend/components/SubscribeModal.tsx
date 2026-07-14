"use client"
import { useState } from "react"

interface Props {
  onClose: () => void
  defaultTeam?: string
}

const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEARS = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR - 20 - i + 15)
  .filter(y => y >= CURRENT_YEAR - 20 && y <= CURRENT_YEAR - 11)

export default function SubscribeModal({ onClose, defaultTeam = "" }: Props) {
  const [parentName, setParentName] = useState("")
  const [email, setEmail] = useState("")
  const [childName, setChildName] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [team, setTeam] = useState(defaultTeam)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [detectedCategory, setDetectedCategory] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentName, email, childName, birthYear: Number(birthYear), team }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDetectedCategory(data.category)
      setSent(true)
    } catch {
      setError("Hubo un error. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const categoryLabel: Record<string, string> = {
    "sub-11": "Sub 11", "sub-12": "Sub 12", "sub-13": "Sub 13", "sub-14": "Sub 14",
    "sub-15": "Sub 15", "sub-16": "Sub 16", "sub-18": "Sub 18", "sub-20": "Sub 20",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        {sent ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">⚽</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">¡Listo, {parentName}!</h3>
            <p className="text-gray-500 text-sm mb-2">
              Cada viernes te llega el resumen de <strong>{team}</strong>{" "}
              {detectedCategory && <span>en <strong>{categoryLabel[detectedCategory]}</strong></span>}.
            </p>
            <p className="text-gray-400 text-xs">
              La categoría de {childName} se actualiza automáticamente cada temporada.
            </p>
            <button onClick={onClose} className="mt-5 w-full bg-green-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-green-700 transition-colors">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-800">Seguir a tu equipo</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Resumen semanal personalizado · la categoría cambia sola cada año
            </p>
            <form onSubmit={submit} className="space-y-3">
              <input
                required placeholder="Tu nombre (ej: Carlos)"
                value={parentName} onChange={e => setParentName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
              />
              <input
                required type="email" placeholder="Tu email"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
              />
              <input
                required placeholder="Nombre de tu hijo/a (ej: Benjamín)"
                value={childName} onChange={e => setChildName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
              />
              <select
                required value={birthYear} onChange={e => setBirthYear(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors text-gray-600"
              >
                <option value="">Año de nacimiento de tu hijo/a</option>
                {Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 11 - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <input
                required placeholder="Club (ej: Colo Colo, Universidad de Chile)"
                value={team} onChange={e => setTeam(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit" disabled={loading}
                className="w-full bg-green-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Suscribirme gratis →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
