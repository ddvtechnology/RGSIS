export type AppointmentStatus = "Agendado" | "Concluído" | "Não Compareceu" | "Cancelado"
export type AppointmentType = "Online" | "Presencial"

export interface Appointment {
  id: string
  nome: string
  cpf: string
  data_agendamento: string
  horario: string
  status: AppointmentStatus
  tipo: AppointmentType
  created_at: string
}

