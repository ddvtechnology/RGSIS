import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { NotificationProvider } from "@/contexts/NotificationContext"
import Image from "next/image"
import { LogoutButton } from "@/components/LogoutButton"
import type React from "react"

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
            <header className="bg-red-800 text-white p-4">
              <div className="container mx-auto">
                {/* Layout para Desktop */}
                <div className="hidden md:flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <Image
                        src="/sbu.png"
                        alt="Prefeitura de São Bento do Una"
                        width={180}
                        height={48}
                        priority
                        className="h-12 w-auto"
                      />
                    </div>
                    <div className="h-8 w-px bg-white/20" />
                    <h1 className="text-2xl font-bold">Sistema de Agendamento de RG</h1>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right text-sm">
                      <div className="font-semibold">PREFEITURA MUNICIPAL</div>
                      <div>SÃO BENTO DO UNA</div>
                    </div>
                    <LogoutButton />
                  </div>
                </div>

                {/* Layout para Mobile */}
                <div className="flex flex-col gap-4 md:hidden">
                  <div className="flex items-center justify-between">
                    <Image
                      src="/sbu.png"
                      alt="Prefeitura de São Bento do Una"
                      width={140}
                      height={36}
                      priority
                      className="h-10 w-auto"
                    />
                    <LogoutButton />
                  </div>
                  <div className="text-center">
                    <h1 className="text-xl font-bold">Sistema de Agendamento de RG</h1>
                    <div className="text-sm mt-1">
                      <div className="font-semibold">PREFEITURA MUNICIPAL</div>
                      <div>SÃO BENTO DO UNA</div>
                    </div>
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-grow">{children}</main>
            <footer className="bg-gray-200 text-gray-600 p-4">
              <div className="container mx-auto text-center text-sm">
                <p>&copy; 2025 DDV Technology. Todos os direitos reservados.</p>
              </div>
            </footer>
          </div>
        </NotificationProvider>
      </body>
    </html>
  )
}

