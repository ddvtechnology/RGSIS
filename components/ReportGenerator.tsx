"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Calendar as CalendarIcon, Download, ChartPie, BarChart as BarChartIcon } from "lucide-react"
import { Calendar } from "./ui/calendar"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"

const STATUS_COLORS = {
  "Agendado": "#3b82f6",
  "Confirmado": "#22c55e",
  "Cancelado": "#ef4444",
  "Concluído": "#8b5cf6"
}

const STATUS_ORDER = ["Agendado", "Confirmado", "Cancelado", "Concluído"]

export function ReportGenerator() {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [reportData, setReportData] = useState<any[]>([])
  const [dailyData, setDailyData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    generateReport()
  }, [startDate, endDate])

  const generateReport = async () => {
    try {
      setIsLoading(true)
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .gte("data_agendamento", start.toISOString().split("T")[0])
        .lte("data_agendamento", end.toISOString().split("T")[0])

      if (error) throw error

      // Relatório por Status
      const statusCount = data.reduce((acc: { [key: string]: number }, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1
        return acc
      }, {})

      const chartData = STATUS_ORDER
        .filter(status => statusCount[status] > 0)
        .map(status => ({
          name: status,
          value: statusCount[status]
        }))

      setReportData(chartData)

      // Relatório Diário
      const dailyCount = data.reduce((acc: { [key: string]: number }, curr) => {
        const date = format(new Date(curr.data_agendamento), "dd/MM/yyyy")
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})

      const dailyChartData = Object.entries(dailyCount).map(([date, count]) => ({
        date,
        quantidade: count
      })).sort((a, b) => {
        const [diaA, mesA, anoA] = a.date.split("/")
        const [diaB, mesB, anoB] = b.date.split("/")
        return new Date(Number(anoA), Number(mesA) - 1, Number(diaA)).getTime() - 
               new Date(Number(anoB), Number(mesB) - 1, Number(diaB)).getTime()
      })

      setDailyData(dailyChartData)

      // Relatório Mensal
      const monthlyCount = data.reduce((acc: { [key: string]: number }, curr) => {
        const month = format(new Date(curr.data_agendamento), "MMMM/yyyy", { locale: ptBR })
        acc[month] = (acc[month] || 0) + 1
        return acc
      }, {})

      const monthlyChartData = Object.entries(monthlyCount).map(([month, count]) => ({
        month,
        quantidade: count
      }))

      setMonthlyData(monthlyChartData)

    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      await Swal.fire({
        title: "Erro!",
        text: "Não foi possível gerar o relatório.",
        icon: "error",
        confirmButtonColor: "#15803d"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = async () => {
    try {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .gte("data_agendamento", start.toISOString().split("T")[0])
        .lte("data_agendamento", end.toISOString().split("T")[0])
        .order("data_agendamento", { ascending: true })

      if (error) throw error

      const csvContent = [
        ["Data", "Horário", "Nome", "CPF", "Telefone", "Status"].join(","),
        ...data.map((appointment: any) => [
          format(new Date(appointment.data_agendamento), "dd/MM/yyyy"),
          appointment.horario,
          `"${appointment.nome}"`,
          appointment.cpf,
          appointment.telefone,
          appointment.status
        ].join(","))
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `relatorio_${format(start, "dd-MM-yyyy")}_a_${format(end, "dd-MM-yyyy")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
      await Swal.fire({
        title: "Erro!",
        text: "Não foi possível exportar o relatório.",
        icon: "error",
        confirmButtonColor: "#15803d"
      })
    }
  }

  const exportToXLSX = async () => {
    try {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .gte("data_agendamento", start.toISOString().split("T")[0])
        .lte("data_agendamento", end.toISOString().split("T")[0])
        .order("data_agendamento", { ascending: true })

      if (error) throw error

      // Monta os dados para a planilha
      const worksheetData = [
        ["Data", "Horário", "Nome", "CPF", "Telefone", "Status"],
        ...data.map((appointment: any) => [
          format(new Date(appointment.data_agendamento), "dd/MM/yyyy"),
          appointment.horario,
          appointment.nome,
          appointment.cpf,
          appointment.telefone,
          appointment.status
        ])
      ]

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      // Ajusta largura das colunas para melhor impressão
      worksheet["!cols"] = [
        { wch: 12 }, // Data
        { wch: 10 }, // Horário
        { wch: 30 }, // Nome
        { wch: 16 }, // CPF
        { wch: 16 }, // Telefone
        { wch: 12 }  // Status
      ]
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório")
      const xlsxBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([xlsxBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `relatorio_${format(start, "dd-MM-yyyy")}_a_${format(end, "dd-MM-yyyy")}.xlsx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao exportar relatório XLSX:", error)
      await Swal.fire({
        title: "Erro!",
        text: "Não foi possível exportar o relatório em XLSX.",
        icon: "error",
        confirmButtonColor: "#15803d"
      })
    }
  }

  const exportToPDF = async () => {
    try {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .gte("data_agendamento", start.toISOString().split("T")[0])
        .lte("data_agendamento", end.toISOString().split("T")[0])
        .order("data_agendamento", { ascending: true })

      if (error) throw error

      // Importação dinâmica para evitar problemas de SSR
      const { default: jsPDF } = await import('jspdf')
      await import('jspdf-autotable')
      
      const doc = new jsPDF()
      
      // Título do relatório
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Relatório de Agendamentos", 105, 20, { align: "center" })
      
      // Período do relatório
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Período: ${format(start, "dd/MM/yyyy")} a ${format(end, "dd/MM/yyyy")}`, 105, 30, { align: "center" })
      
      // Data de geração
      const now = new Date();
      const dataGeracao = `${format(now, "dd/MM/yyyy")} às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      doc.setFontSize(10)
      doc.text(`Gerado em: ${dataGeracao}`, 105, 40, { align: "center" })
      
      // Cabeçalho da tabela
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      // Ajuste das posições das colunas para margens menores
      const colData = 10;
      const colHorario = 35;
      const colNome = 60;
      const colCPF = 120;
      const colTelefone = 150;
      const colStatus = 180;
      doc.text("Data", colData, 60)
      doc.text("Horário", colHorario, 60)
      doc.text("Nome", colNome, 60)
      doc.text("CPF", colCPF, 60)
      doc.text("Telefone", colTelefone, 60)
      doc.text("Status", colStatus, 60)

      // Dados da tabela
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      let yPos = 70
      const nomeMaxWidth = colCPF - colNome - 2; // espaço disponível para o nome
      const lineHeight = 8;
      
      data.forEach((appointment: any, index: number) => {
        // Quebra o nome em múltiplas linhas se necessário
        const nomeLines = doc.splitTextToSize(appointment.nome, nomeMaxWidth);
        const rowHeight = Math.max(lineHeight, nomeLines.length * lineHeight);
        if (yPos + rowHeight > 280) {
          doc.addPage()
          yPos = 20
        }
        doc.text(format(new Date(appointment.data_agendamento), "dd/MM/yyyy"), colData, yPos)
        doc.text(appointment.horario, colHorario, yPos)
        doc.text(nomeLines, colNome, yPos)
        doc.text(appointment.cpf, colCPF, yPos)
        doc.text(appointment.telefone, colTelefone, yPos)
        doc.text(appointment.status, colStatus, yPos)
        yPos += rowHeight;
      })
      
      // Resumo no final
      const totalAgendamentos = data.length
      const statusCount = data.reduce((acc: { [key: string]: number }, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1
        return acc
      }, {})
      
      yPos += 10
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Resumo:", 20, yPos)
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      yPos += 10
      doc.text(`Total de agendamentos: ${totalAgendamentos}`, 20, yPos)
      
      Object.entries(statusCount).forEach(([status, count]) => {
        yPos += 7
        doc.text(`${status}: ${count}`, 20, yPos)
      })
      
      // Salva o PDF
      doc.save(`relatorio_${format(start, "dd-MM-yyyy")}_a_${format(end, "dd-MM-yyyy")}.pdf`)
      
      await Swal.fire({
        title: "Sucesso!",
        text: "Relatório PDF gerado com sucesso!",
        icon: "success",
        confirmButtonColor: "#15803d"
      })
    } catch (error) {
      console.error("Erro ao exportar relatório PDF:", error)
      await Swal.fire({
        title: "Erro!",
        text: "Não foi possível exportar o relatório em PDF. Verifique o console para mais detalhes.",
        icon: "error",
        confirmButtonColor: "#15803d"
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Data Inicial</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <Input
                    type="date"
                    value={startDate.toISOString().split("T")[0]}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Data Final</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <Input
                    type="date"
                    value={endDate.toISOString().split("T")[0]}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>
{/* 
              <Button
                onClick={exportToCSV}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading || reportData.length === 0}
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>  */}
              <Button
                onClick={exportToXLSX}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading || reportData.length === 0}
              >
                <Download className="w-4 h-4" />
                Exportar Excel
              </Button>
              <Button
                onClick={exportToPDF}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading || reportData.length === 0}
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="w-full max-w-md mx-auto mb-6 grid grid-cols-3 h-auto p-1 bg-gray-100/80 rounded-lg border">
          <TabsTrigger 
            value="status" 
            className="flex items-center gap-2 py-2 px-3 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <ChartPie className="w-4 h-4" />
            Por Status
          </TabsTrigger>
          <TabsTrigger 
            value="diario" 
            className="flex items-center gap-2 py-2 px-3 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <BarChartIcon className="w-4 h-4" />
            Diário
          </TabsTrigger>
          <TabsTrigger 
            value="mensal" 
            className="flex items-center gap-2 py-2 px-3 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <BarChartIcon className="w-4 h-4" />
            Mensal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full mr-2"></div>
                  Gerando relatório...
                </div>
              ) : reportData.length === 0 ? (
                <div className="text-center h-[300px] flex items-center justify-center text-gray-500">
                  Nenhum dado disponível para o período selecionado
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={reportData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {reportData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    {reportData.map((item) => (
                      <div
                        key={item.name}
                        className="bg-white rounded-lg border p-4 text-center"
                      >
                        <div className="text-sm font-medium text-gray-500">{item.name}</div>
                        <div className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diario">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full mr-2"></div>
                  Gerando relatório...
                </div>
              ) : dailyData.length === 0 ? (
                <div className="text-center h-[300px] flex items-center justify-center text-gray-500">
                  Nenhum dado disponível para o período selecionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantidade" name="Quantidade" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mensal">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full mr-2"></div>
                  Gerando relatório...
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="text-center h-[300px] flex items-center justify-center text-gray-500">
                  Nenhum dado disponível para o período selecionado
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantidade" name="Quantidade" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

