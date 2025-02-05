"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, Clock, Users } from "lucide-react"
import { getAvailableTimeSlots } from "@/utils/dateUtils"

export function Dashboard() {
  const [todayAppointments, setTodayAppointments] = useState(0)
  const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null)
  const [nextAvailableTime, setNextAvailableTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Buscar agendamentos de hoje
      const { data: todayData, error: todayError } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("data_agendamento", today.toISOString().split("T")[0])
        .in("status", ["Agendado", "Confirmado"])

      if (todayError) throw todayError
      setTodayAppointments(todayData?.length || 0)

      // Encontrar próxima data e horário disponível
      let nextDate = new Date(today)
      let foundAvailable = false
      let attempts = 0
      const maxAttempts = 30 // Procurar nos próximos 30 dias

      while (!foundAvailable && attempts < maxAttempts) {
        // Pular finais de semana
        if (nextDate.getDay() !== 0 && nextDate.getDay() !== 6) {
          const availableSlots = await getAvailableTimeSlots(nextDate)
          
          if (availableSlots.length > 0) {
            setNextAvailableDate(nextDate)
            setNextAvailableTime(availableSlots[0])
            foundAvailable = true
            break
          }
        }
        
        nextDate = new Date(nextDate.setDate(nextDate.getDate() + 1))
        attempts++
      }

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Agendamentos Hoje</p>
              <h3 className="text-2xl font-bold text-blue-700">{todayAppointments}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Próxima Data Disponível</p>
              <h3 className="text-xl font-bold text-green-700">
                {nextAvailableDate
                  ? format(nextAvailableDate, "dd 'de' MMMM", { locale: ptBR })
                  : "Não disponível"}
              </h3>
            </div>
            <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Próximo Horário</p>
              <h3 className="text-2xl font-bold text-purple-700">
                {nextAvailableTime || "Não disponível"}
              </h3>
            </div>
            <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

