import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-144px)]">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Bem-vindo ao Sistema de Agendamento de RG</h1>
        <p className="text-xl text-gray-600">Agende seu RG de forma rápida e fácil</p>
      </div>
      <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row">
        <Button asChild size="lg" className="px-8">
          <Link href="/agendamento">Agendar RG</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="px-8">
          <Link href="/login">Área Administrativa</Link>
        </Button>
      </div>
    </div>
  )
}

