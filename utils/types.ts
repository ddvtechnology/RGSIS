export type AppointmentStatus = "Agendado" | "Confirmado" | "Cancelado" | "Não Compareceu" | "Concluído"

export interface Appointment {
  id: number
  nome: string
  cpf: string
  data_nascimento: string
  telefone: string
  email: string
  data_agendamento: string
  horario: string
  certidao_url: string
  status: AppointmentStatus
}

