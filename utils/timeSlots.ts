export function generateTimeSlots() {
  const slots = []
  const startTime = 8 * 60 // 8:00 AM in minutes
  const endTime = 17 * 60 // 5:00 PM in minutes
  const lunchStart = 13 * 60 // 1:00 PM in minutes
  const lunchEnd = 14 * 60 // 2:00 PM in minutes
  const interval = 30 // 30 minutes

  for (let i = startTime; i < endTime; i += interval) {
    if (i >= lunchStart && i < lunchEnd) continue // Skip lunch time

    const hours = Math.floor(i / 60)
    const minutes = i % 60
    slots.push(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
  }

  return slots
}

