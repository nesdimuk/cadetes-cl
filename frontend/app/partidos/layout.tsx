import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Partidos",
  description: "Resultados y calendario del fútbol formativo chileno Sub-11 a Sub-20. Filtra por categoría, club o fecha.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
