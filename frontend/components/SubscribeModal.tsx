"use client"
import { useState } from "react"
import { CATEGORY_LABELS } from "@/lib/utils"

interface Props {
  onClose: () => void
  defaultTeam?: string
}

export default function SubscribeModal({ onClose, defaultTeam = "" }: Props) {
  const [email, setEmail] = useState("")
  const [team, setTeam] = useState(defaultTeam)
  const [category, setCategory] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: integrar con Brevo API
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">⚽</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">¡Suscrito!</h3>
            <p className="text-gray-500 text-sm">Recibirás un resumen cada viernes con los resultados y próximos partidos.</p>
            <button onClick={onClose} className="mt-4 w-full bg-green-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-green-700 transition-colors">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Seguir a tu equipo</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Recibe cada viernes los resultados y el próximo partido de tu equipo.
            </p>
            <form onSubmit={submit} className="space-y-3">
              <input
                required type="email" placeholder="Tu email"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
              />
              <input
                placeholder="Nombre del club (ej: Coquimbo Unido)"
                value={team} onChange={e => setTeam(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
              />
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors text-gray-600"
              >
                <option value="">Todas las categorías</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                type="submit" disabled={loading}
                className="w-full bg-green-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Suscribirme gratis"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
