export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"

const BREVO_LIST_ID = 6

// GET: fetch current contact data by email
export async function GET(req: NextRequest) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY
  if (!BREVO_API_KEY) return NextResponse.json({ error: "API key no configurada" }, { status: 500 })

  const email = req.nextUrl.searchParams.get("email")
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 })

  const res = await fetch(
    `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
    { headers: { "api-key": BREVO_API_KEY } }
  )

  if (!res.ok) {
    if (res.status === 404) return NextResponse.json({ error: "Email no encontrado" }, { status: 404 })
    return NextResponse.json({ error: "Error al buscar contacto" }, { status: 500 })
  }

  const data = await res.json()
  const attrs = data.attributes ?? {}
  return NextResponse.json({
    email: data.email,
    parentName: attrs.FIRSTNAME ?? "",
    childName: attrs.CHILD_NAME ?? "",
    team: attrs.TEAM ?? "",
    category: attrs.CATEGORY ?? "",
  })
}

// POST: update category (and optionally team)
export async function POST(req: NextRequest) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY
  if (!BREVO_API_KEY) return NextResponse.json({ error: "API key no configurada" }, { status: 500 })

  const { email, categories, team } = await req.json()
  if (!email || !categories?.length) {
    return NextResponse.json({ error: "Email y categoría son requeridos" }, { status: 400 })
  }

  const attributes: Record<string, string> = {
    CATEGORY: categories.join(","),
  }
  if (team) attributes.TEAM = team

  const res = await fetch(
    `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
    {
      method: "PUT",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ attributes, listIds: [BREVO_LIST_ID], updateEnabled: true }),
    }
  )

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: "Brevo: " + (err.message ?? res.status) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
