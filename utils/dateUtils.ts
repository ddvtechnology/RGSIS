export function generateTimeSlots(date: Date) {
  // Verifica se é sexta-feira (5)
  const isSexta = date.getDay() === 5

  // Define os horários base
  const horarios = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30"
  ]

  // Se for sexta, retorna apenas os horários até 13:00
  if (isSexta) {
    return horarios.filter(horario => {
      const hora = parseInt(horario.split(":")[0])
      return hora < 13
    })
  }

  return horarios
}

export function generateAvailableDates(startDate: Date, numberOfDays: number) {
  const dates = []
  const currentDate = new Date(startDate)

  for (let i = 0; i < numberOfDays; i++) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      // Excluir sábados e domingos
      dates.push(new Date(currentDate))
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

export function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

