import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Appointment } from "@/utils/types"

interface AppointmentDetailsProps {
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void
}

export function AppointmentDetails({ appointment, isOpen, onClose }: AppointmentDetailsProps) {
  if (!appointment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <strong>Nome:</strong> {appointment.nome}
          </div>
          <div>
            <strong>CPF:</strong> {appointment.cpf}
          </div>
          <div>
            <strong>Data de Nascimento:</strong> {appointment.dataNascimento}
          </div>
          <div>
            <strong>Telefone:</strong> {appointment.telefone}
          </div>
          <div>
            <strong>E-mail:</strong> {appointment.email}
          </div>
          <div>
            <strong>Data do Agendamento:</strong> {new Date(appointment.dataAgendamento).toLocaleDateString()}
          </div>
          <div>
            <strong>Horário:</strong> {appointment.horario}
          </div>
          <div>
            <strong>Status:</strong> {appointment.status}
          </div>
          <div>
            <strong>Certidão:</strong>
            <a
              href={appointment.certidaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Visualizar Certidão
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

