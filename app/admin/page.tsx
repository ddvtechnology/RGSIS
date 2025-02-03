"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchAndFilter } from "@/components/SearchAndFilter"
import { RescheduleModal } from "@/components/RescheduleModal"
import { ReportGenerator } from "@/components/ReportGenerator"
import { WaitingList } from "@/components/WaitingList"
import { Dashboard } from "@/components/Dashboard"
import { supabase } from "@/lib/supabase"
import type { Appointment, AppointmentStatus } from "@/utils/types"
import { exportToCSV } from "@/utils/exportUtils"
import { useNotification } from "@/contexts/NotificationContext"
import { AppointmentDetails } from "@/components/AppointmentDetails"

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { showNotification } = useNotification()

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .order("dataAgendamento", { ascending: true })

      if (error) {
        throw error
      }

      if (data) {
        setAppointments(data)
        setFilteredAppointments(data)
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error)
      showNotification("Erro ao carregar agendamentos. Por favor, tente novamente.", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleSearch = (searchTerm: string) => {
    const filtered = appointments.filter(
      (app) => app.nome.toLowerCase().includes(searchTerm.toLowerCase()) || app.cpf.includes(searchTerm),
    )
    setFilteredAppointments(filtered)
  }

  const handleFilter = (status: AppointmentStatus | "", type: string) => {
    let filtered = [...appointments]
    if (status) {
      filtered = filtered.filter((app) => app.status === status)
    }
    setFilteredAppointments(filtered)
  }

  const handleStatusChange = async (appointmentId: number, newStatus: AppointmentStatus) => {
    try {
      const { error } = await supabase.from("agendamentos").update({ status: newStatus }).eq("id", appointmentId)

      if (error) {
        throw error
      }

      showNotification("Status atualizado com sucesso", "success")
      fetchAppointments()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      showNotification("Erro ao atualizar status. Por favor, tente novamente.", "error")
    }
  }

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsRescheduleModalOpen(true)
  }

  const handleRescheduleConfirm = async (newDate: Date, newTime: string) => {
    if (selectedAppointment) {
      try {
        const { error } = await supabase
          .from("agendamentos")
          .update({ dataAgendamento: newDate, horario: newTime })
          .eq("id", selectedAppointment.id)

        if (error) {
          throw error
        }

        showNotification("Agendamento remarcado com sucesso", "success")
        fetchAppointments()
      } catch (error) {
        console.error("Erro ao reagendar:", error)
        showNotification("Erro ao reagendar. Por favor, tente novamente.", "error")
      }
    }
    setIsRescheduleModalOpen(false)
  }

  const handleExport = () => {
    exportToCSV(filteredAppointments, "agendamentos.csv")
    showNotification("Dados exportados com sucesso", "success")
  }

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailsModalOpen(true)
  }

  if (isLoading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Painel de Administração</h1>

      <Dashboard />

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SearchAndFilter onSearch={handleSearch} onFilter={handleFilter} />
            <Button onClick={handleExport}>Exportar para CSV</Button>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.nome}</TableCell>
                    <TableCell>{appointment.cpf}</TableCell>
                    <TableCell>{new Date(appointment.dataAgendamento).toLocaleDateString()}</TableCell>
                    <TableCell>{appointment.horario}</TableCell>
                    <TableCell>
                      <Select
                        value={appointment.status}
                        onValueChange={(value) => handleStatusChange(appointment.id, value as AppointmentStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Agendado">Agendado</SelectItem>
                          <SelectItem value="Confirmado">Confirmado</SelectItem>
                          <SelectItem value="Cancelado">Cancelado</SelectItem>
                          <SelectItem value="Não Compareceu">Não Compareceu</SelectItem>
                          <SelectItem value="Concluído">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => handleReschedule(appointment)}>Remarcar</Button>
                      <Button onClick={() => handleViewDetails(appointment)} className="ml-2">
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportGenerator appointments={appointments} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Espera</CardTitle>
        </CardHeader>
        <CardContent>
          <WaitingList />
        </CardContent>
      </Card>

      {selectedAppointment && (
        <RescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          onReschedule={handleRescheduleConfirm}
          availableDates={[]} // Você precisa implementar a lógica para gerar datas disponíveis
        />
      )}
      <AppointmentDetails
        appointment={selectedAppointment}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </div>
  )
}

