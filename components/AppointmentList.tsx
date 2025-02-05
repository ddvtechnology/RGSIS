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
    selectedDateMidnight.setHours(0, 0, 0, 0)
    
    const filtered = appointmentsToFilter.filter(app => {
      const appDate = new Date(app.data_agendamento)
      appDate.setHours(0, 0, 0, 0)
      return appDate.getTime() === selectedDateMidnight.getTime()
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

  const handleStatusChange = () => {
    fetchAppointments()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <DatePicker
          selected={selectedDate}
          onSelect={handleDateChange}
          className="w-full md:w-auto"
        />
        <div className="flex-1">
          <SearchAndFilter 
            onSearch={handleSearch} 
            onFilter={handleFilter}
          />
        </div>
      </div>

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
  )
} 