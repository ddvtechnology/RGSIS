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
  onStatusChange?: () => void
}

export function AppointmentTable({ appointments, onStatusChange }: AppointmentTableProps) {
  const { showNotification } = useNotification()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: newStatus })
        .eq("id", id)

      if (error) throw error

      showNotification("Status atualizado com sucesso!", "success")
      if (onStatusChange) {
        onStatusChange()
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      showNotification("Erro ao atualizar status. Tente novamente.", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px] font-bold">Nome</TableHead>
            <TableHead className="w-[150px] font-bold">CPF</TableHead>
            <TableHead className="w-[200px] font-bold">Data</TableHead>
            <TableHead className="w-[100px] font-bold">Horário</TableHead>
            <TableHead className="w-[150px] font-bold">Tipo</TableHead>
            <TableHead className="w-[150px] font-bold">Status</TableHead>
            <TableHead className="w-[100px] font-bold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appointment) => {
            const status = statusConfig[appointment.status as keyof typeof statusConfig]
            const Icon = status?.Icon || Clock

            return (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium text-lg">{appointment.nome}</TableCell>
                <TableCell>{appointment.cpf}</TableCell>
                <TableCell>
                  {format(new Date(appointment.data_agendamento), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>{appointment.horario}</TableCell>
                <TableCell>
                  <Badge 
                    className={`${
                      appointment.tipo.toLowerCase() === "online" 
                        ? "bg-purple-500" 
                        : "bg-blue-500"
                    } text-white`}
                  >
                    {appointment.tipo}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={`${status?.color || "bg-gray-500"} text-white flex items-center gap-1 w-fit`}
                  >
                    <Icon className="w-4 h-4" />
                    {status?.label || appointment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(appointment.id, "Agendado")}
                        disabled={isUpdating}
                        className="gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Agendado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(appointment.id, "Concluído")}
                        disabled={isUpdating}
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Concluído
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(appointment.id, "Não Compareceu")}
                        disabled={isUpdating}
                        className="gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Não Compareceu
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(appointment.id, "Cancelado")}
                        disabled={isUpdating}
                        className="gap-2 text-red-600"
                      >
                        <Ban className="w-4 h-4" />
                        Cancelar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

