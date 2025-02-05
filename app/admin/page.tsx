"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchAndFilter } from "@/components/SearchAndFilter"
import { AppointmentTable } from "@/components/AppointmentTable"
import { ReportGenerator } from "@/components/ReportGenerator"
import { AdminScheduleForm } from "@/components/AdminScheduleForm"
import { Dashboard } from "@/components/Dashboard"
import { supabase } from "@/lib/supabase"
import type { Appointment } from "@/utils/types"
import { useNotification } from "@/contexts/NotificationContext"
import { Calendar as CalendarIcon, LayoutDashboard, Calendar, CalendarPlus, FileBarChart, ClipboardList } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AppointmentList } from "@/components/AppointmentList"

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
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)
    
    const filtered = appointmentsToFilter.filter(app => {
      const appDate = new Date(app.data_agendamento)
      appDate.setHours(0, 0, 0, 0)
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
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <div className="max-w-7xl mx-auto">
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
              Painel Administrativo
            </CardTitle>
            <CardDescription className="text-gray-600">
              Gerencie agendamentos, visualize relatórios e mais
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full max-w-2xl mx-auto mb-6 grid grid-cols-4 h-auto p-1 bg-gray-100/80 rounded-lg border">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="agendamentos" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger 
              value="lista" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger 
              value="relatorios" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <FileBarChart className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <Dashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agendamentos" className="mt-0">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <AdminScheduleForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lista" className="mt-0">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <AppointmentList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relatorios" className="mt-0">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <ReportGenerator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

