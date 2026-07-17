import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tabla de posiciones",
  description: "Tabla de posiciones del fútbol formativo chileno por grupo y categoría, Sub-11 a Sub-20.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
