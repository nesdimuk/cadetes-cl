export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"

const BREVO_LIST_ID = 6

function suggestCategory(birthYear: number): string {
  const age = new Date().getFullYear() - birthYear
  if (age <= 11) return "sub-11"
  if (age === 12) return "sub-12"
  if (age === 13) return "sub-13"
  if (age === 14) return "sub-14"
  if (age === 15) return "sub-15"
  if (age === 16) return "sub-16"
  if (age <= 18) return "sub-18"
  return "sub-20"
}

async function ensureAttribute(key: string, apiKey: string, type: string) {
  await fetch(`https://api.brevo.com/v3/contacts/attributes/normal/${key}`, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  })
}

export async function POST(req: NextRequest) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY
  if (!BREVO_API_KEY) return NextResponse.json({ error: "API key no configurada" }, { status: 500 })

  const { parentName, email, childName, birthDay, birthMonth, birthYear, categories, team } = await req.json()

  if (!parentName || !email || !childName || !birthYear || !categories?.length || !team) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 })
  }

  // Asegurar que el atributo BIRTHDAY existe (ignora error si ya existe)
  if (birthDay && birthMonth) {
    await ensureAttribute("BIRTHDAY", BREVO_API_KEY, "date")
  }

  // Formato de fecha para Brevo: YYYY-MM-DD
  const birthday = birthDay && birthMonth
    ? `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`
    : null

  const attributes: Record<string, string | number> = {
    FIRSTNAME: parentName,
    CHILD_NAME: childName,
    BIRTH_YEAR: Number(birthYear),
    TEAM: team,
    CATEGORY: categories.join(","),
  }
  if (birthday) attributes.BIRTHDAY = birthday

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      attributes,
      listIds: [BREVO_LIST_ID],
      updateEnabled: true,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: "Brevo: " + (err.message ?? res.status) }, { status: 500 })
  }

  return NextResponse.json({ ok: true, suggestedCategory: suggestCategory(Number(birthYear)) })
}
