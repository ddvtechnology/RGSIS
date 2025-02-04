import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, CartesianGrid } from "recharts"
import type { Appointment } from "@/utils/types"
import * as XLSX from 'xlsx'

interface ReportGeneratorProps {
  appointments: Appointment[]
}

const STATUS_COLORS = {
  "Agendado": "#3b82f6", // Azul
  "Confirmado": "#10b981", // Verde
  "Cancelado": "#ef4444", // Vermelho
  "Não Compareceu": "#f59e0b", // Amarelo
  "Concluído": "#6366f1", // Índigo
}

const STATUS_ORDER = ["Agendado", "Confirmado", "Cancelado", "Não Compareceu", "Concluído"]

const BUTTON_COLORS = {
  dailyAttendance: "bg-blue-500 hover:bg-blue-600 text-white",
  monthlyUtilization: "bg-green-500 hover:bg-green-600 text-white",
  statusDistribution: "bg-purple-500 hover:bg-purple-600 text-white",
}

export function ReportGenerator({ appointments }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<string>("")

  const exportToExcel = () => {
    if (!reportType) return

    let dataToExport = []
    let fileName = "relatorio"

    switch (reportType) {
      case "dailyAttendance":
        const today = new Date()
        const todayAppointments = appointments.filter(
          (app) => new Date(app.data_agendamento).toDateString() === today.toDateString()
        )
        dataToExport = todayAppointments.map(app => ({
          Nome: app.nome,
          CPF: app.cpf,
          'Data de Nascimento': app.data_nascimento,
          Telefone: app.telefone,
          Email: app.email,
          'Data do Agendamento': new Date(app.data_agendamento).toLocaleDateString(),
          Horário: app.horario,
          Status: app.status,
          Tipo: app.tipo
        }))
        fileName = `relatorio_diario_${today.toISOString().split('T')[0]}`
        break

      case "monthlyUtilization":
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthAppointments = appointments.filter((app) => {
          const appDate = new Date(app.data_agendamento)
          return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear
        })
        dataToExport = monthAppointments.map(app => ({
          Nome: app.nome,
          CPF: app.cpf,
          'Data de Nascimento': app.data_nascimento,
          Telefone: app.telefone,
          Email: app.email,
          'Data do Agendamento': new Date(app.data_agendamento).toLocaleDateString(),
          Horário: app.horario,
          Status: app.status,
          Tipo: app.tipo
        }))
        fileName = `relatorio_mensal_${new Date().getFullYear()}_${currentMonth + 1}`
        break

      case "statusDistribution":
        const statusData = STATUS_ORDER.map(status => {
          const count = appointments.filter(app => app.status === status).length
          return {
            Status: status,
            Quantidade: count,
            'Porcentagem': ((count / appointments.length) * 100).toFixed(2) + '%'
          }
        })
        dataToExport = statusData
        fileName = `relatorio_status_${new Date().toISOString().split('T')[0]}`
        break

      default:
        return
    }

    try {
      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Relatório")
      XLSX.writeFile(wb, `${fileName}.xlsx`)
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      alert("Erro ao exportar relatório. Por favor, tente novamente.")
    }
  }

  const generateDailyAttendanceReport = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Ajusta para considerar a data sem o horário
    const todayAppointments = appointments.filter((app) => {
      const appDate = new Date(app.data_agendamento)
      appDate.setHours(0, 0, 0, 0)
      return appDate.getTime() === today.getTime()
    })

    const statusData = STATUS_ORDER.map(status => ({
      name: status,
      value: todayAppointments.filter(app => app.status === status).length
    }))

    const total = todayAppointments.length
    const concluded = todayAppointments.filter(app => app.status === "Concluído").length
    const noShow = todayAppointments.filter(app => app.status === "Não Compareceu").length
    const canceled = todayAppointments.filter(app => app.status === "Cancelado").length
    const scheduled = todayAppointments.filter(app => app.status === "Agendado").length

    return (
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle>Relatório de Atendimentos - {today.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}
                cursor={{ fill: 'rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-muted/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg border-b pb-2">Resumo do Dia</h3>
              <p className="flex justify-between">
                <span>Total de agendamentos:</span>
                <span className="font-medium">{total}</span>
              </p>
              <p className="flex justify-between">
                <span>Agendados:</span>
                <span className="font-medium text-blue-600">{scheduled}</span>
              </p>
              <p className="flex justify-between">
                <span>Concluídos:</span>
                <span className="font-medium text-indigo-600">{concluded}</span>
              </p>
              <p className="flex justify-between">
                <span>Não compareceram:</span>
                <span className="font-medium text-amber-600">{noShow}</span>
              </p>
              <p className="flex justify-between">
                <span>Cancelados:</span>
                <span className="font-medium text-red-600">{canceled}</span>
              </p>
            </div>
            <div className="space-y-3 bg-muted/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg border-b pb-2">Estatísticas</h3>
              <p className="flex justify-between">
                <span>Taxa de comparecimento:</span>
                <span className="font-medium">{total > 0 ? ((concluded / total) * 100).toFixed(2) : 0}%</span>
              </p>
              <p className="flex justify-between">
                <span>Taxa de ausência:</span>
                <span className="font-medium">{total > 0 ? ((noShow / total) * 100).toFixed(2) : 0}%</span>
              </p>
              <p className="flex justify-between">
                <span>Taxa de cancelamento:</span>
                <span className="font-medium">{total > 0 ? ((canceled / total) * 100).toFixed(2) : 0}%</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const generateMonthlyUtilizationReport = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthAppointments = appointments.filter((app) => {
      const appDate = new Date(app.data_agendamento)
      return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear
    })

    const statusData = STATUS_ORDER.map(status => ({
      name: status,
      value: monthAppointments.filter(app => app.status === status).length
    }))

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const workingDays = Array.from({ length: daysInMonth }, (_, i) => new Date(currentYear, currentMonth, i + 1))
      .filter(date => date.getDay() !== 0 && date.getDay() !== 6).length
    
    const totalSlots = 20 * workingDays // 20 slots por dia útil
    const utilizationRate = (monthAppointments.length / totalSlots) * 100

    const concluded = monthAppointments.filter(app => app.status === "Concluído").length
    const noShow = monthAppointments.filter(app => app.status === "Não Compareceu").length
    const canceled = monthAppointments.filter(app => app.status === "Cancelado").length

    return (
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle>Relatório Mensal - {new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'long'
          })}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}
                cursor={{ fill: 'rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-muted/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg border-b pb-2">Resumo do Mês</h3>
              <p className="flex justify-between">
                <span>Total de agendamentos:</span>
                <span className="font-medium">{monthAppointments.length}</span>
              </p>
              <p className="flex justify-between">
                <span>Dias úteis no mês:</span>
                <span className="font-medium">{workingDays}</span>
              </p>
              <p className="flex justify-between">
                <span>Capacidade total:</span>
                <span className="font-medium">{totalSlots} atendimentos</span>
              </p>
              <p className="flex justify-between">
                <span>Taxa de utilização:</span>
                <span className="font-medium">{utilizationRate.toFixed(2)}%</span>
              </p>
            </div>
            <div className="space-y-3 bg-muted/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg border-b pb-2">Estatísticas</h3>
              <p className="flex justify-between">
                <span>Média diária:</span>
                <span className="font-medium">{(monthAppointments.length / workingDays).toFixed(1)} agendamentos</span>
              </p>
              <p className="flex justify-between">
                <span>Taxa de conclusão:</span>
                <span className="font-medium">{monthAppointments.length > 0 ? ((concluded / monthAppointments.length) * 100).toFixed(2) : 0}%</span>
              </p>
              <p className="flex justify-between">
                <span>Taxa de ausência:</span>
                <span className="font-medium">{monthAppointments.length > 0 ? ((noShow / monthAppointments.length) * 100).toFixed(2) : 0}%</span>
              </p>
              <p className="flex justify-between">
                <span>Taxa de cancelamento:</span>
                <span className="font-medium">{monthAppointments.length > 0 ? ((canceled / monthAppointments.length) * 100).toFixed(2) : 0}%</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const generateStatusDistributionReport = () => {
    const statusData = STATUS_ORDER.map(status => ({
      name: status,
      value: appointments.filter(app => app.status === status).length
    }))

    const total = appointments.length
    const byType = {
      online: appointments.filter(app => app.tipo === "online").length,
      presencial: appointments.filter(app => app.tipo === "presencial").length
    }

    return (
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle>Distribuição Geral de Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}
                cursor={{ fill: 'rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-muted/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg border-b pb-2">Resumo Geral</h3>
              <p className="flex justify-between">
                <span>Total de agendamentos:</span>
                <span className="font-medium">{total}</span>
              </p>
              {STATUS_ORDER.map(status => {
                const count = statusData.find(d => d.name === status)?.value || 0
                return (
                  <p key={status} className="flex justify-between items-center">
                    <span>{status}:</span>
                    <span className="font-medium">
                      {count} ({total > 0 ? ((count / total) * 100).toFixed(2) : 0}%)
                    </span>
                  </p>
                )
              })}
            </div>
            <div className="space-y-3 bg-muted/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg border-b pb-2">Distribuição por Tipo</h3>
              <p className="flex justify-between">
                <span>Atendimentos Online:</span>
                <span className="font-medium">{byType.online} ({total > 0 ? ((byType.online / total) * 100).toFixed(2) : 0}%)</span>
              </p>
              <p className="flex justify-between">
                <span>Atendimentos Presenciais:</span>
                <span className="font-medium">{byType.presencial} ({total > 0 ? ((byType.presencial / total) * 100).toFixed(2) : 0}%)</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const generateReport = () => {
    switch (reportType) {
      case "dailyAttendance":
        return generateDailyAttendanceReport()
      case "monthlyUtilization":
        return generateMonthlyUtilizationReport()
      case "statusDistribution":
        return generateStatusDistributionReport()
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Selecione um tipo de relatório para visualizar
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center bg-muted/20 p-4 rounded-lg">
        <div className="flex gap-4">
          {["dailyAttendance", "monthlyUtilization", "statusDistribution"].map((type) => (
            <Button
              key={type}
              onClick={() => setReportType(type)}
              className={`${
                reportType === type
                  ? BUTTON_COLORS[type as keyof typeof BUTTON_COLORS]
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              } transition-all duration-200 min-w-[160px] font-medium`}
            >
              {type === "dailyAttendance" && "Relatório Diário"}
              {type === "monthlyUtilization" && "Relatório Mensal"}
              {type === "statusDistribution" && "Distribuição"}
            </Button>
          ))}
        </div>
        {reportType && (
          <Button 
            onClick={exportToExcel}
            className="bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200 ml-auto"
          >
            Exportar Excel
          </Button>
        )}
      </div>

      <div>{generateReport()}</div>
    </div>
  )
}

