export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
const BREVO_LIST_ID = 6

function getCategoryFromBirthYear(birthYear: number): string {
  const season = new Date().getFullYear()
  const age = season - birthYear
  if (age <= 11) return "sub-11"
  if (age === 12) return "sub-12"
  if (age === 13) return "sub-13"
  if (age === 14) return "sub-14"
  if (age === 15) return "sub-15"
  if (age === 16) return "sub-16"
  if (age <= 18) return "sub-18"
  return "sub-20"
}

export async function POST(req: NextRequest) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY
  if (!BREVO_API_KEY) return NextResponse.json({ error: "API key no configurada" }, { status: 500 })

  const { parentName, email, childName, birthYear, team } = await req.json()

  if (!parentName || !email || !childName || !birthYear || !team) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 })
  }

  const category = getCategoryFromBirthYear(Number(birthYear))

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      attributes: {
        FIRSTNAME: parentName,
        CHILD_NAME: childName,
        BIRTH_YEAR: Number(birthYear),
        TEAM: team,
        CATEGORY: category,
      },
      listIds: [BREVO_LIST_ID],
      updateEnabled: true,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: "Brevo: " + (err.message ?? res.status) }, { status: 500 })
  }

  return NextResponse.json({ ok: true, category })
}
