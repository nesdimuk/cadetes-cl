export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"

const BREVO_LIST_ID = 6

export async function POST(req: NextRequest) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY
  if (!BREVO_API_KEY) return NextResponse.json({ error: "API key no configurada" }, { status: 500 })

  const { parentName, email, childName, categories, team } = await req.json()

  if (!parentName || !email || !childName || !categories?.length || !team) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 })
  }

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      attributes: {
        FIRSTNAME: parentName,
        CHILD_NAME: childName,
        TEAM: team,
        CATEGORY: categories.join(","),
      },
      listIds: [BREVO_LIST_ID],
      updateEnabled: true,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: "Brevo: " + (err.message ?? res.status) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
