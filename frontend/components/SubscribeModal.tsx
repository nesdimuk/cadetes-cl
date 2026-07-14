"use client"
import { useState } from "react"

interface Props {
  onClose: () => void
  defaultTeam?: string
}

const CATEGORIES = [
  { key: "sub-11", label: "Sub 11" },
  { key: "sub-12", label: "Sub 12" },
  { key: "sub-13", label: "Sub 13" },
  { key: "sub-14", label: "Sub 14" },
  { key: "sub-15", label: "Sub 15" },
  { key: "sub-16", label: "Sub 16" },
  { key: "sub-18", label: "Sub 18" },
  { key: "sub-20", label: "Sub 20" },
]

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
]

const CURRENT_YEAR = new Date().getFullYear()

export default function SubscribeModal({ onClose, defaultTeam = "" }: Props) {
  const [parentName, setParentName] = useState("")
  const [email, setEmail] = useState("")
  const [childName, setChildName] = useState("")
  const [birthDay, setBirthDay] = useState("")
  const [birthMonth, setBirthMonth] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [team, setTeam] = useState(defaultTeam)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [suggestedCat, setSuggestedCat] = useState("")

  const toggleCat = (cat: string) => {
    setSelectedCats(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat)
      if (prev.length >= 2) return prev
      return [...prev, cat]
    })
  }

  const handleYearChange = (y: string) => {
    setBirthYear(y)
    setSuggestedCat("")
    setSelectedCats([])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCats.length === 0) { setError("Selecciona al menos una categoría"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName, email, childName,
          birthDay: birthDay ? Number(birthDay) : null,
          birthMonth: birthMonth ? Number(birthMonth) : null,
          birthYear: Number(birthYear),
          categories: selectedCats,
          team,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuggestedCat(data.suggestedCategory)
      setSent(true)
    } catch {
      setError("Hubo un error. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {sent ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">⚽</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">¡Listo, {parentName}!</h3>
            <p className="text-gray-500 text-sm mb-2">
              Cada viernes recibirás el resumen de <strong>{team}</strong> en{" "}
              <strong>{selectedCats.map(c => CATEGORIES.find(x => x.key === c)?.label).join(" y ")}</strong>.
            </p>
            {birthDay && birthMonth && (
              <p className="text-gray-400 text-xs mt-2">
                🎂 Le mandaremos un saludo especial a {childName} el día de su cumpleaños.
              </p>
            )}
            <p className="text-gray-400 text-xs mt-2">
              Puedes actualizar la categoría en cualquier momento desde el email.
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
            <p className="text-xs text-gray-400 mb-4">Resumen semanal · puedes cambiar la categoría cuando quieras</p>
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
                required placeholder="Nombre de tu hijo/a"
                value={childName} onChange={e => setChildName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
              />
              <input
                required placeholder="Club (ej: Colo Colo)"
                value={team} onChange={e => setTeam(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
              />

              {/* Fecha de nacimiento */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Fecha de nacimiento de tu hijo/a <span className="text-green-600">🎂</span></p>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={birthDay} onChange={e => setBirthDay(e.target.value)}
                    className="border border-gray-200 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-green-500 transition-colors text-gray-600"
                  >
                    <option value="">Día</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={birthMonth} onChange={e => setBirthMonth(e.target.value)}
                    className="border border-gray-200 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-green-500 transition-colors text-gray-600"
                  >
                    <option value="">Mes</option>
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    required value={birthYear} onChange={e => handleYearChange(e.target.value)}
                    className="border border-gray-200 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-green-500 transition-colors text-gray-600"
                  >
                    <option value="">Año</option>
                    {Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 11 - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Categorías */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">
                  Categoría(s) donde juega <span className="text-gray-400">(máximo 2)</span>
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => {
                    const selected = selectedCats.includes(cat.key)
                    const disabled = !selected && selectedCats.length >= 2
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => toggleCat(cat.key)}
                        disabled={disabled}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                          selected
                            ? "bg-green-600 text-white border-green-600"
                            : disabled
                            ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                            : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                        }`}
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

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
