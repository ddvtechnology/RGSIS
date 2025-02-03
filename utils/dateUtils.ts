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

export function generateTimeSlots() {
  const slots = []
  const startTime = 8 * 60 // 8:00 AM em minutos
  const endTime = 17 * 60 // 5:00 PM em minutos
  const lunchStart = 13 * 60 // 1:00 PM em minutos
  const lunchEnd = 14 * 60 // 2:00 PM em minutos
  const interval = 30 // 30 minutos

  for (let i = startTime; i < endTime; i += interval) {
    if (i >= lunchStart && i < lunchEnd) continue // Pular horário de almoço

    const hours = Math.floor(i / 60)
    const minutes = i % 60
    slots.push(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
  }

  return slots
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
}

