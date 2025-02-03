import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { NotificationProvider } from "@/contexts/NotificationContext"
import type React from "react" // Added import for React

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Agendamento de RG",
  description: "Gerencie agendamentos de RG de forma eficiente",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <NotificationProvider>
          <div className="min-h-screen flex flex-col">
            <header className="bg-blue-600 text-white p-4">
              <div className="container mx-auto">
                <h1 className="text-2xl font-bold">Sistema de Agendamento de RG</h1>
              </div>
            </header>
            <main className="flex-grow container mx-auto p-4">{children}</main>
            <footer className="bg-gray-200 text-gray-600 p-4">
              <div className="container mx-auto text-center">
                <p>&copy; 2023 Sistema de Agendamento de RG. Todos os direitos reservados.</p>
              </div>
            </footer>
          </div>
        </NotificationProvider>
      </body>
    </html>
  )
}

