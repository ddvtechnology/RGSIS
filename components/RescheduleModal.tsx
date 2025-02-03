import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { generateTimeSlots } from "@/utils/dateUtils"

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onReschedule: (newDate: Date, newTime: string) => void
  availableDates: Date[]
}

export function RescheduleModal({ isOpen, onClose, onReschedule, availableDates }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const timeSlots = generateTimeSlots()

  const handleReschedule = () => {
    if (selectedDate && selectedTime) {
      onReschedule(selectedDate, selectedTime)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reagendar Agendamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Nova Data</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) =>
                !availableDates.some((availableDate) => availableDate.toDateString() === date.toDateString())
              }
              className="rounded-md border"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="time">Novo Horário</Label>
            <Select onValueChange={setSelectedTime} disabled={!selectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleReschedule} disabled={!selectedDate || !selectedTime}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

