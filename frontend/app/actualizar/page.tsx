"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

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

function ActualizarInner() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") ?? ""

  const [email, setEmail] = useState(emailParam)
  const [contact, setContact] = useState<{
    parentName: string; childName: string; team: string; category: string
  } | null>(null)
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [team, setTeam] = useState("")
  const [loading, setLoading] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (emailParam) fetchContact(emailParam)
  }, [emailParam])

  const fetchContact = async (e: string) => {
    setLoading(true)
    setError("")
    setLookupDone(false)
    try {
      const res = await fetch(`/api/actualizar?email=${encodeURIComponent(e)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setContact(data)
      setTeam(data.team)
      const cats = data.category ? data.category.split(",").map((c: string) => c.trim()).filter(Boolean) : []
      setSelectedCats(cats)
      setLookupDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No encontramos ese email en nuestra lista.")
      setLookupDone(false)
    } finally {
      setLoading(false)
    }
  }

  const toggleCat = (cat: string) => {
    setSelectedCats(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat)
      if (prev.length >= 2) return prev
      return [...prev, cat]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCats.length === 0) { setError("Selecciona al menos una categoría"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/actualizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, categories: selectedCats, team }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaved(true)
    } catch {
      setError("Hubo un error al guardar. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (saved) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">¡Categoría actualizada!</h2>
        <p className="text-gray-500 text-sm mb-1">
          Desde el próximo viernes recibirás el resumen de{" "}
          <strong>{team}</strong> en{" "}
          <strong>{selectedCats.map(c => CATEGORIES.find(x => x.key === c)?.label).join(" y ")}</strong>.
        </p>
        <Link href="/" className="mt-6 inline-block bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
          Volver al inicio →
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Actualizar categoría</h1>
      <p className="text-gray-500 text-sm mb-6">Cambia la categoría o club que seguirás cada semana.</p>

      {/* Email lookup */}
      {!lookupDone && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tu email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
              />
              <button
                onClick={() => fetchContact(email)}
                disabled={loading || !email}
                className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {loading ? "..." : "Buscar"}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <p className="text-gray-400 text-xs">
            ¿No estás suscrito?{" "}
            <Link href="/" className="text-green-600 hover:underline">Suscríbete gratis →</Link>
          </p>
        </div>
      )}

      {/* Edit form */}
      {lookupDone && contact && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-gray-700">
            Hola <strong>{contact.parentName}</strong> — actualizando datos de <strong>{contact.childName}</strong>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Club</label>
            <input
              value={team}
              onChange={e => setTeam(e.target.value)}
              placeholder="Nombre del club"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">
              Categoría(s) <span className="text-gray-400">(máximo 2)</span>
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

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar cambios →"}
            </button>
            <button
              type="button"
              onClick={() => { setLookupDone(false); setContact(null) }}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </>
  )
}

export default function Actualizar() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <Link href="/" className="text-green-600 text-sm hover:underline mb-6 inline-block">
          ← Volver a Cadetes.cl
        </Link>
        <Suspense>
          <ActualizarInner />
        </Suspense>
      </div>
    </div>
  )
}
