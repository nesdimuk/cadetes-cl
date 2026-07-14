import { NextResponse } from "next/server"
export async function GET() {
  const key = process.env.BREVO_API_KEY
  return NextResponse.json({
    hasKey: !!key,
    keyLength: key?.length ?? 0,
  })
}
