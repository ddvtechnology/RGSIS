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
            <header className="bg-red-800 text-white py-3 md:py-4 px-4 shadow-lg">
              <div className="container mx-auto max-w-7xl">
                {/* Layout para Desktop */}
                <div className="hidden md:flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative w-[160px] h-[42px] lg:w-[180px] lg:h-[48px]">
                      <Image
                        src="/sbu.png"
                        alt="Prefeitura de São Bento do Una"
                        fill
                        priority
                        className="object-contain"
                      />
                    </div>
                    <div className="h-8 w-px bg-white/20" />
                    <h1 className="text-xl lg:text-2xl font-bold">Sistema de Agendamento de RG</h1>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-sm lg:text-base font-semibold">PREFEITURA MUNICIPAL</div>
                      <div className="text-sm lg:text-base">SÃO BENTO DO UNA</div>
                    </div>
                    <LogoutButton />
                  </div>
                </div>

                {/* Layout para Mobile */}
                <div className="flex flex-col gap-3 md:hidden">
                  <div className="flex items-center justify-between">
                    <div className="relative w-[140px] h-[36px]">
                      <Image
                        src="/sbu.png"
                        alt="Prefeitura de São Bento do Una"
                        fill
                        priority
                        className="object-contain"
                      />
                    </div>
                    <LogoutButton />
                  </div>
                  <div className="text-center">
                    <h1 className="text-lg font-bold mb-1">Sistema de Agendamento de RG</h1>
                    <div className="text-sm">
                      <div className="font-semibold">PREFEITURA MUNICIPAL</div>
                      <div>SÃO BENTO DO UNA</div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-grow container mx-auto max-w-7xl px-4 py-6 md:py-8">
              {children}
            </main>

            <footer className="bg-gray-200 text-gray-600 py-4 px-4 mt-auto">
              <div className="container mx-auto max-w-7xl text-center text-sm">
                <p>&copy; 2025 DDV Technology. Todos os direitos reservados.</p>
              </div>
            </footer>
          </div>
        </NotificationProvider>
      </body>
    </html>
  )
}

