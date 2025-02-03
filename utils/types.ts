export type AppointmentStatus = "Agendado" | "Confirmado" | "Cancelado" | "Não Compareceu" | "Concluído"

export interface Appointment {
  id: number
  nome: string
  cpf: string
  dataNascimento: string
  telefone: string
  email: string
  dataAgendamento: Date
  horario: string
  certidaoUrl: string
  status: AppointmentStatus
}

