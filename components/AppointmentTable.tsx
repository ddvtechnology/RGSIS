"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Appointment, AppointmentStatus } from "@/utils/types"
import { supabase } from "@/lib/supabase"
import { useNotification } from "@/contexts/NotificationContext"
import { MoreHorizontal, CheckCircle, XCircle, Clock, Ban } from "lucide-react"

const statusConfig = {
  "Agendado": { label: "Agendado", color: "bg-blue-500", Icon: Clock },
  "Concluído": { label: "Concluído", color: "bg-green-500", Icon: CheckCircle },
  "Não Compareceu": { label: "Não Compareceu", color: "bg-yellow-500", Icon: XCircle },
  "Cancelado": { label: "Cancelado", color: "bg-red-500", Icon: Ban },
}

interface AppointmentTableProps {
  appointments: Appointment[]
  onStatusChange: (appointmentId: string, newStatus: string) => void
}

export function AppointmentTable({ appointments, onStatusChange }: AppointmentTableProps) {
  const { showNotification } = useNotification()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    if (isUpdating) return
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: newStatus })
        .eq("id", id)

      if (error) throw error

      showNotification("Status atualizado com sucesso!", "success")
      onStatusChange(id, newStatus)
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      showNotification("Erro ao atualizar status. Tente novamente.", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px] lg:w-[300px] font-bold">Nome</TableHead>
              <TableHead className="min-w-[120px] lg:w-[150px] font-bold">CPF</TableHead>
              <TableHead className="min-w-[150px] lg:w-[200px] font-bold">Data</TableHead>
              <TableHead className="min-w-[100px] lg:w-[100px] font-bold">Horário</TableHead>
              <TableHead className="min-w-[120px] lg:w-[150px] font-bold">Tipo</TableHead>
              <TableHead className="min-w-[120px] lg:w-[150px] font-bold">Status</TableHead>
              <TableHead className="w-[100px] font-bold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => {
              const StatusIcon = statusConfig[appointment.status as keyof typeof statusConfig].Icon
              return (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">{appointment.nome}</TableCell>
                  <TableCell>{appointment.cpf}</TableCell>
                  <TableCell>
                    {format(new Date(`${appointment.data_agendamento}T12:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{appointment.horario}</TableCell>
                  <TableCell className="capitalize">{appointment.tipo}</TableCell>
                  <TableCell>
                    <Badge 
                      className={`${statusConfig[appointment.status as keyof typeof statusConfig].color} text-white flex items-center gap-1`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      {appointment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Object.entries(statusConfig).map(([status, config]) => {
                          const MenuIcon = config.Icon
                          return (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => handleStatusChange(appointment.id, status as AppointmentStatus)}
                              disabled={appointment.status === status || isUpdating}
                              className="gap-2"
                            >
                              <MenuIcon className="w-4 h-4" />
                              <span>Marcar como {status}</span>
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

