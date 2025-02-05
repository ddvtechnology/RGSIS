import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Agendamento Online - RG São Bento do Una",
  description: "Faça seu agendamento online para emissão de RG em São Bento do Una"
}

export default function AgendamentoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 