"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Calendar as CalendarIcon, Download, ChartPie, BarChart as BarChartIcon } from "lucide-react"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"
import { dbFormatToDate, formatDateToPtBR, getTodayDBFormat } from "@/utils/dateUtils"

const STATUS_COLORS = {
  "Agendado": "#3b82f6",
  "Concluído": "#22c55e",
  "Não Compareceu": "#eab308",
  "Cancelado": "#ef4444"
}

const STATUS_ORDER = ["Agendado", "Concluído", "Não Compareceu", "Cancelado"]

export function ReportGenerator() {
  // Define data inicial e final como hoje
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [startDate, setStartDate] = useState<string>(format(hoje, "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState<string>(format(hoje, "yyyy-MM-dd"))
  const [reportData, setReportData] = useState<any[]>([])
  const [dailyData, setDailyData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [totalAgendamentos, setTotalAgendamentos] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Só gera relatório se ambas as datas estiverem definidas
    if (startDate && endDate) {
      generateReport()
    }
  }, [startDate, endDate])

  const generateReport = async () => {
    try {
      setIsLoading(true)

      console.log("=== Gerando Relatório ===")
      console.log("Data Inicial (DB):", startDate)
      console.log("Data Final (DB):", endDate)

      // Validação das datas
      if (!startDate || !endDate) {
        await Swal.fire({
          title: "Atenção!",
          text: "Por favor, selecione as datas inicial e final.",
          icon: "warning",
          confirmButtonColor: "#15803d"
        })
        setIsLoading(false)
        return
      }

      // Busca TODOS os agendamentos no período (com paginação)
      let allData: any[] = []
      let hasMore = true
      let page = 0
      const pageSize = 1000

      while (hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1

        console.log(`Buscando página ${page + 1} (${from}-${to})...`)

        const { data, error } = await supabase
          .from("agendamentos")
          .select("*")
          .gte("data_agendamento", startDate)
          .lte("data_agendamento", endDate)
          .order("data_agendamento", { ascending: true })
          .order("horario", { ascending: true })
          .range(from, to)

        if (error) {
          console.error("Erro na query:", error)
          throw error
        }

        console.log(`Página ${page + 1}: ${data?.length || 0} registros`)

        if (data && data.length > 0) {
          allData = [...allData, ...data]
          if (data.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }

      const data = allData
      console.log(`✅ Total de agendamentos encontrados: ${data.length}`)
      console.log(`Período: ${startDate} até ${endDate}`)
      setTotalAgendamentos(data.length)

      // Se não houver dados, limpa os gráficos
      if (data.length === 0) {
        setReportData([])
        setDailyData([])
        setMonthlyData([])
        return
      }

      // ===== RELATÓRIO POR STATUS =====
      const statusCount: { [key: string]: number } = {}
      data.forEach((agendamento) => {
        const status = agendamento.status
        statusCount[status] = (statusCount[status] || 0) + 1
      })

      const chartData = STATUS_ORDER
        .filter(status => statusCount[status] > 0)
        .map(status => ({
          name: status,
          value: statusCount[status]
        }))

      setReportData(chartData)

      // ===== RELATÓRIO DIÁRIO =====
      const dailyCount: { [key: string]: number } = {}
      data.forEach((agendamento) => {
        try {
          const date = dbFormatToDate(agendamento.data_agendamento)
          const dateFormatted = formatDateToPtBR(date)
          dailyCount[dateFormatted] = (dailyCount[dateFormatted] || 0) + 1
        } catch (err) {
          console.error("Erro ao processar data:", agendamento.data_agendamento, err)
        }
      })

      const dailyChartData = Object.entries(dailyCount)
        .map(([date, count]) => ({
          date,
          quantidade: count
        }))
        .sort((a, b) => {
          const [diaA, mesA, anoA] = a.date.split("/").map(Number)
          const [diaB, mesB, anoB] = b.date.split("/").map(Number)
          const dateA = new Date(anoA, mesA - 1, diaA)
          const dateB = new Date(anoB, mesB - 1, diaB)
          return dateA.getTime() - dateB.getTime()
        })

      setDailyData(dailyChartData)

      // ===== RELATÓRIO MENSAL =====
      const monthlyCount: { [key: string]: number } = {}
      data.forEach((agendamento) => {
        try {
          const date = dbFormatToDate(agendamento.data_agendamento)
          const month = format(date, "MMMM/yyyy", { locale: ptBR })
          monthlyCount[month] = (monthlyCount[month] || 0) + 1
        } catch (err) {
          console.error("Erro ao processar mês:", agendamento.data_agendamento, err)
        }
      })

      const monthlyChartData = Object.entries(monthlyCount)
        .map(([month, count]) => ({
          month: month.charAt(0).toUpperCase() + month.slice(1), // Capitaliza primeira letra
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

  const exportToXLSX = async () => {
    try {
      console.log("=== Exportando Excel ===")
      console.log("Período:", startDate, "até", endDate)

      // Busca TODOS os agendamentos no período (com paginação)
      let allData: any[] = []
      let hasMore = true
      let page = 0
      const pageSize = 1000

      while (hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1

        const { data, error } = await supabase
          .from("agendamentos")
          .select("*")
          .gte("data_agendamento", startDate)
          .lte("data_agendamento", endDate)
          .order("data_agendamento", { ascending: true })
          .order("horario", { ascending: true })
          .range(from, to)

        if (error) {
          console.error("Erro ao buscar dados:", error)
          throw error
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data]
          if (data.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }

      const data = allData
      console.log(`Total de registros para Excel: ${data.length}`)

      // Monta os dados para a planilha
      const worksheetData = [
        ["📊 RELATÓRIO DE AGENDAMENTOS - RG SÃO BENTO DO UNA"],
        [`Período: ${formatDateToPtBR(dbFormatToDate(startDate))} até ${formatDateToPtBR(dbFormatToDate(endDate))}`],
        [`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
        [], // Linha vazia
        ["Data", "Horário", "Nome", "CPF", "Telefone", "Tipo", "Status"],
        ...data.map((appointment: any) => [
          formatDateToPtBR(dbFormatToDate(appointment.data_agendamento)),
          appointment.horario,
          appointment.nome,
          appointment.cpf,
          appointment.telefone,
          appointment.tipo,
          appointment.status
        ])
      ]

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      
      // Ajusta largura das colunas
      worksheet["!cols"] = [
        { wch: 12 },  // Data
        { wch: 10 },  // Horário
        { wch: 35 },  // Nome
        { wch: 16 },  // CPF
        { wch: 16 },  // Telefone
        { wch: 12 },  // Tipo
        { wch: 15 }   // Status
      ]

      // Mescla células do título
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Título
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Período
        { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }  // Data geração
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Agendamentos")

      // Adiciona aba de resumo
      const resumoData = [
        ["📈 RESUMO DO PERÍODO"],
        [],
        ["Total de Agendamentos", data.length],
        [],
        ["STATUS", "QUANTIDADE"],
        ...reportData.map(item => [item.name, item.value])
      ]

      const resumoWorksheet = XLSX.utils.aoa_to_sheet(resumoData)
      resumoWorksheet["!cols"] = [{ wch: 25 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(workbook, resumoWorksheet, "Resumo")

      const xlsxBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([xlsxBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `relatorio_agendamentos_${startDate}_ate_${endDate}.xlsx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      await Swal.fire({
        title: "Sucesso!",
        text: "Relatório Excel gerado com sucesso!",
        icon: "success",
        confirmButtonColor: "#15803d",
        timer: 2000
      })
    } catch (error) {
      console.error("Erro ao exportar relatório XLSX:", error)
      await Swal.fire({
        title: "Erro!",
        text: "Não foi possível exportar o relatório em Excel.",
        icon: "error",
        confirmButtonColor: "#15803d"
      })
    }
  }

  const exportToPDF = async () => {
    try {
      console.log("=== Exportando PDF ===")
      console.log("Período:", startDate, "até", endDate)

      // Busca TODOS os agendamentos no período (com paginação)
      let allData: any[] = []
      let hasMore = true
      let page = 0
      const pageSize = 1000

      while (hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1

        const { data, error } = await supabase
          .from("agendamentos")
          .select("*")
          .gte("data_agendamento", startDate)
          .lte("data_agendamento", endDate)
          .order("data_agendamento", { ascending: true })
          .order("horario", { ascending: true })
          .range(from, to)

        if (error) {
          console.error("Erro ao buscar dados:", error)
          throw error
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data]
          if (data.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }

      const data = allData
      console.log(`Total de registros para PDF: ${data.length}`)

      if (!data || data.length === 0) {
        await Swal.fire({
          title: "Atenção!",
          text: "Nenhum dado encontrado para gerar o PDF.",
          icon: "warning",
          confirmButtonColor: "#15803d"
        })
        return
      }

      // Importação dinâmica para evitar problemas de SSR
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default
      
      const doc = new jsPDF() as any
      
      // Título do relatório
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text("Relatório de Agendamentos - RG", 105, 15, { align: "center" })
      
      doc.setFontSize(14)
      doc.text("São Bento do Una", 105, 23, { align: "center" })
      
      // Período do relatório
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      const periodoTexto = `Período: ${formatDateToPtBR(dbFormatToDate(startDate))} até ${formatDateToPtBR(dbFormatToDate(endDate))}`
      doc.text(periodoTexto, 105, 32, { align: "center" })
      
      // Data de geração
      const now = new Date()
      const dataGeracao = format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
      doc.setFontSize(9)
      doc.text(`Gerado em: ${dataGeracao}`, 105, 38, { align: "center" })
      
      // Prepara dados da tabela
      const tableData = data.map((appointment: any) => [
        formatDateToPtBR(dbFormatToDate(appointment.data_agendamento)),
        appointment.horario,
        appointment.nome,
        appointment.cpf,
        appointment.telefone,
        appointment.tipo,
        appointment.status
      ])

      // Adiciona tabela usando autoTable
      autoTable(doc, {
        startY: 45,
        head: [['Data', 'Horário', 'Nome', 'CPF', 'Telefone', 'Tipo', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [22, 163, 74], // Verde
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 22 },  // Data
          1: { cellWidth: 18 },  // Horário
          2: { cellWidth: 45 },  // Nome
          3: { cellWidth: 28 },  // CPF
          4: { cellWidth: 28 },  // Telefone
          5: { cellWidth: 20 },  // Tipo
          6: { cellWidth: 25 }   // Status
        },
        margin: { left: 10, right: 10 },
      })
      
      // Adiciona resumo (SEM emojis para evitar corrupção)
      const finalY = doc.lastAutoTable.finalY || 45
      
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("RESUMO DO PERIODO", 14, finalY + 15)
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      let yPos = finalY + 23
      
      doc.text(`Total de Agendamentos: ${data.length}`, 14, yPos)
      yPos += 8
      
      doc.setFont("helvetica", "bold")
      doc.text("Por Status:", 14, yPos)
      yPos += 6
      
      doc.setFont("helvetica", "normal")
      reportData.forEach((item) => {
        doc.text(`  - ${item.name}: ${item.value}`, 14, yPos)
        yPos += 5
      })
      
      // Salva o PDF
      doc.save(`relatorio_agendamentos_${startDate}_ate_${endDate}.pdf`)
      
      await Swal.fire({
        title: "Sucesso!",
        text: "Relatório PDF gerado com sucesso!",
        icon: "success",
        confirmButtonColor: "#15803d",
        timer: 2000
      })
    } catch (error) {
      console.error("Erro ao exportar relatório PDF:", error)
      await Swal.fire({
        title: "Erro!",
        text: "Não foi possível exportar o relatório em PDF.",
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
            {/* Seleção de período */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-blue-900 mb-1">ℹ️ Filtro de Período</p>
                <p className="text-xs text-blue-700">
                  Por padrão, mostra os agendamentos de hoje. Altere as datas para ver outros períodos.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">📅 Data Inicial</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">📅 Data Final</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 font-medium"
                  />
                </div>
              </div>

              {/* Botões de atalho */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-gray-600">⚡ Atalhos:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const hoje = new Date()
                      hoje.setHours(0, 0, 0, 0)
                      const hojeFmt = format(hoje, "yyyy-MM-dd")
                      setStartDate(hojeFmt)
                      setEndDate(hojeFmt)
                    }}
                    className="text-xs"
                  >
                    Hoje
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const hoje = new Date()
                      const seteDias = new Date()
                      seteDias.setDate(hoje.getDate() - 7)
                      setStartDate(format(seteDias, "yyyy-MM-dd"))
                      setEndDate(format(hoje, "yyyy-MM-dd"))
                    }}
                    className="text-xs"
                  >
                    7 dias
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const hoje = new Date()
                      const trintaDias = new Date()
                      trintaDias.setDate(hoje.getDate() - 30)
                      setStartDate(format(trintaDias, "yyyy-MM-dd"))
                      setEndDate(format(hoje, "yyyy-MM-dd"))
                    }}
                    className="text-xs"
                  >
                    30 dias
                  </Button>
                </div>
              </div>

              {/* Resumo rápido */}
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">📊 Resumo do Período</p>
                <p className="text-2xl font-bold text-green-700">{totalAgendamentos}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {totalAgendamentos === 1 ? "agendamento encontrado" : "agendamentos encontrados"}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  De {startDate ? formatDateToPtBR(dbFormatToDate(startDate)) : '---'} até {endDate ? formatDateToPtBR(dbFormatToDate(endDate)) : '---'}
                </p>
              </div>
            </div>

            {/* Botões de exportação */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-3">📥 Exportar Relatório</p>
                
                <div className="space-y-2">
                  <Button
                    onClick={exportToXLSX}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                    disabled={isLoading || totalAgendamentos === 0}
                  >
                    <Download className="w-4 h-4" />
                    Exportar Excel (.xlsx)
                  </Button>
                  
                  <Button
                    onClick={exportToPDF}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                    disabled={isLoading || totalAgendamentos === 0}
                  >
                    <Download className="w-4 h-4" />
                    Exportar PDF (.pdf)
                  </Button>
                </div>
                
                {totalAgendamentos === 0 && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    ℹ️ Nenhum dado para exportar neste período
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
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

        {/* Gráfico de Status */}
        <TabsContent value="status">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Visualize quantos agendamentos existem em cada status</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full mr-2"></div>
                  Gerando relatório...
                </div>
              ) : reportData.length === 0 ? (
                <div className="text-center h-[300px] flex items-center justify-center text-gray-500">
                  📊 Nenhum dado disponível para o período selecionado
                </div>
              ) : (
                <>
                  {reportData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={reportData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={true}
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
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      📊 Selecione um período com dados para visualizar o gráfico
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
                    {reportData.map((item) => (
                      <div
                        key={item.name}
                        className="bg-white rounded-lg border-2 p-4 text-center hover:shadow-md transition-shadow"
                        style={{ borderColor: STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] }}
                      >
                        <div className="text-sm font-medium text-gray-600">{item.name}</div>
                        <div 
                          className="text-3xl font-bold mt-2" 
                          style={{ color: STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] }}
                        >
                          {item.value}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {((item.value / totalAgendamentos) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfico Diário */}
        <TabsContent value="diario">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Agendamentos por Dia</CardTitle>
              <CardDescription>Quantidade de agendamentos em cada data</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full mr-2"></div>
                  Gerando relatório...
                </div>
              ) : dailyData.length === 0 ? (
                <div className="text-center h-[300px] flex items-center justify-center text-gray-500">
                  📊 Nenhum dado disponível para o período selecionado
                </div>
              ) : (
                dailyData.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={11}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantidade" name="Quantidade" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfico Mensal */}
        <TabsContent value="mensal">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Agendamentos por Mês</CardTitle>
              <CardDescription>Quantidade de agendamentos em cada mês</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full mr-2"></div>
                  Gerando relatório...
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="text-center h-[300px] flex items-center justify-center text-gray-500">
                  📊 Nenhum dado disponível para o período selecionado
                </div>
              ) : (
                monthlyData.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantidade" name="Quantidade" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
