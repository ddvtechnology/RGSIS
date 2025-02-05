import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, CartesianGrid, Pie, PieChart as RechartsPieChart } from "recharts"
import type { Appointment } from "@/utils/types"
import * as XLSX from 'xlsx'
import { Calendar, BarChart as BarChartIcon, PieChart as PieChartIcon } from "lucide-react"
import { FileSpreadsheet } from "lucide-react"

interface ReportGeneratorProps {
  appointments: Appointment[]
}

const STATUS_COLORS = {
  "Agendado": "#2563eb",
  "Confirmado": "#16a34a",
  "Cancelado": "#dc2626",
  "Concluído": "#9333ea",
  "Não Compareceu": "#f59e0b"
}

const STATUS_ORDER = ["Agendado", "Confirmado", "Cancelado", "Não Compareceu", "Concluído"]

const BUTTON_COLORS = {
  dailyAttendance: "bg-blue-500 hover:bg-blue-600 text-white",
  monthlyUtilization: "bg-green-500 hover:bg-green-600 text-white",
  statusDistribution: "bg-purple-500 hover:bg-purple-600 text-white",
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function ReportGenerator({ appointments }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<string>("")

  const processAppointmentsForDaily = () => {
    const dailyCount = new Map<string, number>()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Agrupa por dia
    appointments.forEach(app => {
      const date = new Date(app.data_agendamento)
      date.setHours(0, 0, 0, 0)
      const dateStr = date.toLocaleDateString('pt-BR')
      dailyCount.set(dateStr, (dailyCount.get(dateStr) || 0) + 1)
    })

    // Converte para array e ordena por data
    return Array.from(dailyCount.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const processAppointmentsForMonthly = () => {
    const monthlyCount = new Map<string, number>()
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    // Agrupa por mês
    appointments.forEach(app => {
      const date = new Date(app.data_agendamento)
      const monthStr = months[date.getMonth()]
      monthlyCount.set(monthStr, (monthlyCount.get(monthStr) || 0) + 1)
    })

    // Converte para array e mantém ordem dos meses
    return months
      .filter(month => monthlyCount.has(month))
      .map(month => ({
        month,
        count: monthlyCount.get(month) || 0
      }))
  }

  const processAppointmentsForStatus = () => {
    const statusCount = new Map<string, number>()

    // Conta por status
    appointments.forEach(app => {
      const status = app.status // Não converte para minúsculo
      statusCount.set(status, (statusCount.get(status) || 0) + 1)
    })

    // Converte para array e ordena conforme STATUS_ORDER
    return STATUS_ORDER
      .map(status => ({
        name: status,
        value: statusCount.get(status) || 0
      }))
      .filter(item => item.value > 0) // Remove status sem agendamentos
  }

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
        const statusData = processAppointmentsForStatus()
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
    const dailyData = processAppointmentsForDaily()
    
    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[300px] h-[300px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#16a34a" name="Atendimentos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atendimentos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyData.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const generateMonthlyUtilizationReport = () => {
    const monthlyData = processAppointmentsForMonthly()
    
    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[300px] h-[300px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#2563eb" name="Agendamentos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agendamentos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.month}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const generateStatusDistributionReport = () => {
    const statusData = processAppointmentsForStatus()
    
    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[300px] h-[300px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentagem</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statusData.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] }} />
                      {item.name}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.value}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {((item.value / statusData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
      <div className="flex flex-col md:flex-row gap-4 items-center bg-muted/20 p-4 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {["dailyAttendance", "monthlyUtilization", "statusDistribution"].map((type) => (
            <Button
              key={type}
              onClick={() => setReportType(type)}
              className={`${
                reportType === type
                  ? BUTTON_COLORS[type as keyof typeof BUTTON_COLORS]
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              } transition-all duration-200 font-medium w-full text-sm md:text-base py-2 px-3 md:px-4`}
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
            className="bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200 w-full md:w-auto"
          >
            Exportar Excel
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {generateReport()}
        </div>
      </div>
    </div>
  )
}

