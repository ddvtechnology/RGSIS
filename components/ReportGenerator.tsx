import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Appointment } from "@/utils/types"

interface ReportGeneratorProps {
  appointments: Appointment[]
}

export function ReportGenerator({ appointments }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<string>("")

  const generateReport = () => {
    switch (reportType) {
      case "dailyAttendance":
        return generateDailyAttendanceReport()
      case "monthlyUtilization":
        return generateMonthlyUtilizationReport()
      case "appointmentTypes":
        return generateAppointmentTypesReport()
      default:
        return "Selecione um tipo de relatório"
    }
  }

  const generateDailyAttendanceReport = () => {
    const today = new Date()
    const todayAppointments = appointments.filter((app) => app.data.toDateString() === today.toDateString())
    const attended = todayAppointments.filter((app) => app.status === "Concluído").length
    const noShow = todayAppointments.filter((app) => app.status === "Não Compareceu").length

    return `
      Relatório de Comparecimento Diário (${today.toLocaleDateString()}):
      Total de agendamentos: ${todayAppointments.length}
      Atendidos: ${attended}
      Não compareceram: ${noShow}
      Taxa de comparecimento: ${((attended / todayAppointments.length) * 100).toFixed(2)}%
    `
  }

  const generateMonthlyUtilizationReport = () => {
    const currentMonth = new Date().getMonth()
    const monthAppointments = appointments.filter((app) => app.data.getMonth() === currentMonth)
    const totalSlots = 20 * 22 // Assumindo 20 slots por dia e 22 dias úteis no mês
    const utilizationRate = (monthAppointments.length / totalSlots) * 100

    return `
      Relatório de Utilização Mensal:
      Total de agendamentos: ${monthAppointments.length}
      Capacidade total: ${totalSlots}
      Taxa de utilização: ${utilizationRate.toFixed(2)}%
    `
  }

  const generateAppointmentTypesReport = () => {
    const onlineAppointments = appointments.filter((app) => app.tipo === "Online").length
    const inPersonAppointments = appointments.filter((app) => app.tipo === "Presencial").length
    const total = appointments.length

    return `
      Relatório de Tipos de Agendamento:
      Total de agendamentos: ${total}
      Agendamentos online: ${onlineAppointments} (${((onlineAppointments / total) * 100).toFixed(2)}%)
      Agendamentos presenciais: ${inPersonAppointments} (${((inPersonAppointments / total) * 100).toFixed(2)}%)
    `
  }

  return (
    <div className="space-y-4">
      <Select value={reportType} onValueChange={setReportType}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o tipo de relatório" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dailyAttendance">Comparecimento Diário</SelectItem>
          <SelectItem value="monthlyUtilization">Utilização Mensal</SelectItem>
          <SelectItem value="appointmentTypes">Tipos de Agendamento</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={generateReport}>Gerar Relatório</Button>
      <pre className="mt-4 p-4 bg-gray-100 rounded-md whitespace-pre-wrap">
        {reportType ? generateReport() : "Selecione um tipo de relatório para gerar"}
      </pre>
    </div>
  )
}

