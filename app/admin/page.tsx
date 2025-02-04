"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchAndFilter } from "@/components/SearchAndFilter"
import { AppointmentTable } from "@/components/AppointmentTable"
import { ReportGenerator } from "@/components/ReportGenerator"
import { AdminScheduleForm } from "@/components/AdminScheduleForm"
import { Dashboard } from "@/components/Dashboard"
import { supabase } from "@/lib/supabase"
import type { Appointment } from "@/utils/types"
import { useNotification } from "@/contexts/NotificationContext"
import { Calendar as CalendarIcon, LayoutDashboard, Calendar, CalendarPlus, FileBarChart } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const { showNotification } = useNotification()

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .order("data_agendamento", { ascending: true })

      if (error) {
        throw error
      }

      if (data) {
        setAppointments(data)
        // Filtra inicialmente para mostrar apenas os agendamentos do dia
        filterAppointmentsByDate(data, selectedDate)
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error)
      showNotification("Erro ao carregar agendamentos. Por favor, tente novamente.", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showNotification, selectedDate])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const filterAppointmentsByDate = (appointmentsToFilter: Appointment[], date: Date) => {
    // Ajusta a data selecionada para meia-noite no fuso horário local
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)
    
    const filtered = appointmentsToFilter.filter(app => {
      // Converte a data do agendamento para objeto Date e ajusta para meia-noite
      const appDate = new Date(app.data_agendamento)
      appDate.setHours(0, 0, 0, 0)
      
      // Compara as datas ajustadas
      return appDate.getTime() === selectedDate.getTime()
    })
    setFilteredAppointments(filtered)
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      filterAppointmentsByDate(appointments, date)
    }
  }

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      filterAppointmentsByDate(appointments, selectedDate)
      return
    }

    const filtered = filteredAppointments.filter(
      (app) => 
        app.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        app.cpf.includes(searchTerm)
    )
    setFilteredAppointments(filtered)
  }

  const handleFilter = (status: string, type: string) => {
    // Ajusta a data selecionada para meia-noite no fuso horário local
    const selectedDateMidnight = new Date(selectedDate)
    selectedDateMidnight.setHours(0, 0, 0, 0)
    
    let filtered = appointments.filter(app => {
      const appDate = new Date(app.data_agendamento)
      appDate.setHours(0, 0, 0, 0)
      return appDate.getTime() === selectedDateMidnight.getTime()
    })
    
    if (status && status !== "all") {
      filtered = filtered.filter((app) => app.status === status)
    }
    
    if (type && type !== "all") {
      filtered = filtered.filter((app) => app.tipo.toLowerCase() === type.toLowerCase())
    }
    
    setFilteredAppointments(filtered)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Painel de Administração</h1>

      <Tabs defaultValue="appointments" className="space-y-8">
        <TabsList className="flex justify-start w-full bg-white p-1 rounded-lg gap-2 shadow-lg border">
          <TabsTrigger 
            value="dashboard" 
            className="flex-1 px-6 py-3 rounded-md text-sm font-medium transition-all
            data-[state=active]:bg-green-700 data-[state=active]:text-white
            data-[state=active]:shadow-md hover:bg-gray-100
            flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="appointments"
            className="flex-1 px-6 py-3 rounded-md text-sm font-medium transition-all
            data-[state=active]:bg-green-700 data-[state=active]:text-white
            data-[state=active]:shadow-md hover:bg-gray-100
            flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger 
            value="schedule"
            className="flex-1 px-6 py-3 rounded-md text-sm font-medium transition-all
            data-[state=active]:bg-green-700 data-[state=active]:text-white
            data-[state=active]:shadow-md hover:bg-gray-100
            flex items-center justify-center gap-2"
          >
            <CalendarPlus className="w-4 h-4" />
            Agendar
          </TabsTrigger>
          <TabsTrigger 
            value="reports"
            className="flex-1 px-6 py-3 rounded-md text-sm font-medium transition-all
            data-[state=active]:bg-green-700 data-[state=active]:text-white
            data-[state=active]:shadow-md hover:bg-gray-100
            flex items-center justify-center gap-2"
          >
            <FileBarChart className="w-4 h-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <Dashboard appointments={appointments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Gerenciar Agendamentos</h2>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex items-center gap-2 min-w-[240px]">
                    <CalendarIcon className="w-5 h-5 text-gray-500" />
                    <DatePicker
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      locale={ptBR}
                      disabled={(date) => date.getDay() === 0 || date.getDay() === 6}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <SearchAndFilter onSearch={handleSearch} onFilter={handleFilter} />
                  </div>
                </div>
                <div className="mt-4">
                  {filteredAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum agendamento encontrado para {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  ) : (
                    <AppointmentTable
                      appointments={filteredAppointments}
                      onStatusChange={fetchAppointments}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <AdminScheduleForm onSchedule={fetchAppointments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <ReportGenerator appointments={appointments} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

