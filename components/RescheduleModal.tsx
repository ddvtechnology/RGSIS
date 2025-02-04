import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { CalendarIcon, Clock3Icon, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Appointment } from "@/utils/types"

interface RescheduleModalProps {
  appointment: Appointment
  isOpen: boolean
  onClose: () => void
  onConfirm: (newDate: Date, newTime: string) => void
}

const HORARIOS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00"
]

export function RescheduleModal({ appointment, isOpen, onClose, onConfirm }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAvailableDates()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedDate) {
      loadAvailableTimes(selectedDate)
    }
  }, [selectedDate])

  const loadAvailableDates = async () => {
    setIsLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: existingAppointments, error } = await supabase
        .from("agendamentos")
        .select("data_agendamento, horario")
        .gte("data_agendamento", today.toISOString())
        .neq("status", "Cancelado")

      if (error) throw error

      // Criar array com próximos 30 dias
      const dates: Date[] = []
      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(today.getDate() + i)
        date.setHours(0, 0, 0, 0)
        
        // Excluir sábados e domingos
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          dates.push(date)
        }
      }

      // Filtrar datas que já têm todos os horários ocupados
      const availableDates = dates.filter(date => {
        const appointmentsOnDate = existingAppointments?.filter(
          app => new Date(app.data_agendamento).toDateString() === date.toDateString()
        ) || []
        return appointmentsOnDate.length < HORARIOS.length
      })

      setAvailableDates(availableDates)
    } catch (error) {
      console.error("Erro ao carregar datas disponíveis:", error)
      alert("Erro ao carregar datas disponíveis. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableTimes = async (date: Date) => {
    setIsLoading(true)
    try {
      const { data: existingAppointments, error } = await supabase
        .from("agendamentos")
        .select("horario")
        .eq("data_agendamento", date.toISOString().split("T")[0])
        .neq("status", "Cancelado")

      if (error) throw error

      const bookedTimes = existingAppointments?.map(app => app.horario) || []
      const availableTimes = HORARIOS.filter(time => !bookedTimes.includes(time))

      setAvailableTimes(availableTimes)
    } catch (error) {
      console.error("Erro ao carregar horários disponíveis:", error)
      alert("Erro ao carregar horários disponíveis. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      alert("Por favor, selecione uma data e horário.")
      return
    }

    onConfirm(selectedDate, selectedTime)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Reagendar Consulta
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Agendamento atual: {format(new Date(appointment.data_agendamento), "dd/MM/yyyy")} às {appointment.horario}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              Selecione uma nova data
            </label>
            <div className="p-2 border rounded-lg bg-gray-50/50">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return (
                    !availableDates.some(d => d.toDateString() === date.toDateString()) ||
                    date < today
                  )
                }}
                locale={ptBR}
                className="rounded-md border bg-white shadow-sm"
              />
            </div>
          </div>

          {selectedDate && (
            <div className="grid gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock3Icon className="w-4 h-4 text-blue-600" />
                Selecione um novo horário
              </label>
              <Select
                value={selectedTime}
                onValueChange={setSelectedTime}
                disabled={isLoading || availableTimes.length === 0}
              >
                <SelectTrigger className="bg-white shadow-sm hover:bg-gray-50">
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-gray-200 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime || isLoading}
              className={cn(
                "bg-blue-600 hover:bg-blue-700 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

