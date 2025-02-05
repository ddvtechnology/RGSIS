import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Administração - RG São Bento do Una",
  description: "Painel administrativo do sistema de agendamento de RG"
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 