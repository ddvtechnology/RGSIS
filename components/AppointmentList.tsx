"use client"

import { useState, useEffect } from "react"
import { DatePicker } from "@/components/ui/date-picker"
import { SearchAndFilter } from "@/components/SearchAndFilter"
import { AppointmentTable } from "@/components/AppointmentTable"
import { supabase } from "@/lib/supabase"
import type { Appointment } from "@/utils/types"
import { useNotification } from "@/contexts/NotificationContext"

export function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const { showNotification } = useNotification()

  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .order("data_agendamento", { ascending: true })

      if (error) throw error

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
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const filterAppointmentsByDate = (appointmentsToFilter: Appointment[], date: Date) => {
    const selectedDateMidnight = new Date(date)
    selectedDateMidnight.setHours(12, 0, 0, 0)
    
    const filtered = appointmentsToFilter.filter(app => {
      const appDate = new Date(`${app.data_agendamento}T12:00:00`)
      return appDate.toDateString() === selectedDateMidnight.toDateString()
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
    let filtered = appointments.filter(app => {
      const appDate = new Date(app.data_agendamento)
      appDate.setHours(0, 0, 0, 0)
      const selectedDateMidnight = new Date(selectedDate)
      selectedDateMidnight.setHours(0, 0, 0, 0)
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

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      // Atualiza o estado local primeiro
      const updatedAppointments = appointments.map(app => 
        app.id === appointmentId ? { ...app, status: newStatus } : app
      )
      setAppointments(updatedAppointments)

      // Atualiza a lista filtrada
      const updatedFiltered = filteredAppointments.map(app => 
        app.id === appointmentId ? { ...app, status: newStatus } : app
      )
      setFilteredAppointments(updatedFiltered)

      // Atualiza no banco de dados em segundo plano
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: newStatus })
        .eq("id", appointmentId)

      if (error) throw error

      showNotification("Status atualizado com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      showNotification("Erro ao atualizar status. Tente novamente.", "error")
      
      // Reverte as mudanças em caso de erro
      fetchAppointments()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <DatePicker
          selected={selectedDate}
          onSelect={handleDateChange}
          className="w-full lg:w-auto"
        />
        <div className="flex-1 w-full lg:w-auto">
          <SearchAndFilter 
            onSearch={handleSearch} 
            onFilter={handleFilter}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredAppointments.length > 0 ? (
          <AppointmentTable 
            appointments={filteredAppointments}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nenhum agendamento encontrado para a data selecionada.
          </div>
        )}
      </div>
    </div>
  )
} 