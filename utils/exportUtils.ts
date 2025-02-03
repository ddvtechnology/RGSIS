import type { Appointment } from "@/utils/types"

export function exportToCSV(appointments: Appointment[], fileName: string) {
  const headers = ["ID", "Nome", "CPF", "Data", "Horário", "Status", "Tipo"]
  const csvContent = [
    headers.join(","),
    ...appointments.map((app) =>
      [app.id, app.nome, app.cpf, app.data.toLocaleDateString(), app.horario, app.status, app.tipo].join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

