"use client"
import { useState, useRef, useEffect } from "react"

interface Props {
  teams: string[]
  value: string
  onChange: (team: string) => void
}

export default function SearchBar({ teams, value, onChange }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.length >= 2
    ? teams.filter(t => t.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const select = (team: string) => {
    setQuery(team)
    onChange(team)
    setOpen(false)
  }

  const clear = () => {
    setQuery("")
    onChange("")
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="flex items-center bg-white border-2 border-green-600 rounded-xl px-4 py-2.5 gap-2 shadow-sm">
        <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent text-sm"
          placeholder="Busca tu club (ej: Coquimbo, Colo Colo...)"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange("") }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button onClick={clear} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {filtered.map(team => (
            <li key={team}>
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 text-gray-800 transition-colors"
                onClick={() => select(team)}
              >
                {team}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
