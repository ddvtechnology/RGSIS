"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Ban
} from "lucide-react"
import { getAvailableTimeSlots } from "@/utils/dateUtils"

interface DashboardStats {
  totalGeral: number
  agendadosHoje: number
  agendadosSemana: number
  agendadosMes: number
  statusCounts: {
    agendado: number
    concluido: number
    naoCompareceu: number
    cancelado: number
  }
  proximaDataDisponivel: Date | null
  proximoHorarioDisponivel: string | null
  taxaComparecimento: number
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalGeral: 0,
    agendadosHoje: 0,
    agendadosSemana: 0,
    agendadosMes: 0,
    statusCounts: {
      agendado: 0,
      concluido: 0,
      naoCompareceu: 0,
      cancelado: 0
    },
    proximaDataDisponivel: null,
    proximoHorarioDisponivel: null,
    taxaComparecimento: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Data atual (Brasil - UTC-3)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const hojeStr = format(hoje, "yyyy-MM-dd")
      
      // Início e fim da semana (domingo a sábado)
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 })
      const fimSemana = endOfWeek(hoje, { weekStartsOn: 0 })
      const inicioSemanaStr = format(inicioSemana, "yyyy-MM-dd")
      const fimSemanaStr = format(fimSemana, "yyyy-MM-dd")
      
      // Início e fim do mês
      const inicioMes = startOfMonth(hoje)
      const fimMes = endOfMonth(hoje)
      const inicioMesStr = format(inicioMes, "yyyy-MM-dd")
      const fimMesStr = format(fimMes, "yyyy-MM-dd")

      // 1. Contagem por status (todos os agendamentos - com paginação)
      let todosAgendamentos: any[] = []
      let hasMore = true
      let page = 0
      const pageSize = 1000

      while (hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1

        const { data, error: statusError } = await supabase
          .from("agendamentos")
          .select("status")
          .range(from, to)

        if (statusError) throw statusError

        if (data && data.length > 0) {
          todosAgendamentos = [...todosAgendamentos, ...data]
          if (data.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }

      const totalGeral = todosAgendamentos.length

      // 2. Agendamentos de hoje (todos, exceto cancelados)
      const { data: agendamentosHoje } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("data_agendamento", hojeStr)
        .neq("status", "Cancelado")

      // 3. Agendamentos da semana (todos, exceto cancelados)
      const { data: agendamentosSemana } = await supabase
        .from("agendamentos")
        .select("*")
        .gte("data_agendamento", inicioSemanaStr)
        .lte("data_agendamento", fimSemanaStr)
        .neq("status", "Cancelado")

      // 4. Agendamentos do mês (todos, exceto cancelados)
      const { data: agendamentosMes } = await supabase
        .from("agendamentos")
        .select("*")
        .gte("data_agendamento", inicioMesStr)
        .lte("data_agendamento", fimMesStr)
        .neq("status", "Cancelado")

      // 5. Contagem por status (já carregado acima)
      const statusCounts = {
        agendado: 0,
        concluido: 0,
        naoCompareceu: 0,
        cancelado: 0
      }

      todosAgendamentos.forEach(agendamento => {
        const status = agendamento.status.toLowerCase()
        if (status === "agendado") {
          statusCounts.agendado++
        } else if (status === "concluído") {
          statusCounts.concluido++
        } else if (status === "não compareceu") {
          statusCounts.naoCompareceu++
        } else if (status === "cancelado") {
          statusCounts.cancelado++
        }
      })

      // 6. Taxa de comparecimento (Concluídos / Total Geral - todos os status)
      const taxaComparecimento = totalGeral > 0 
        ? (statusCounts.concluido / totalGeral) * 100 
        : 0

      // 7. Encontrar próxima data e horário disponível
      let proximaData: Date | null = null
      let proximoHorario: string | null = null
      let encontrado = false
      let tentativas = 0
      const maxTentativas = 60 // 60 dias úteis
      let dataAtual = new Date(hoje)

      while (!encontrado && tentativas < maxTentativas) {
        // Pular finais de semana
        if (dataAtual.getDay() !== 0 && dataAtual.getDay() !== 6) {
          const horariosDisponiveis = await getAvailableTimeSlots(dataAtual)
          
          if (horariosDisponiveis.length > 0) {
            proximaData = new Date(dataAtual)
            proximoHorario = horariosDisponiveis[0]
            encontrado = true
            break
          }
        }
        
        dataAtual.setDate(dataAtual.getDate() + 1)
        tentativas++
      }

      setStats({
        totalGeral: totalGeral,
        agendadosHoje: agendamentosHoje?.length || 0,
        agendadosSemana: agendamentosSemana?.length || 0,
        agendadosMes: agendamentosMes?.length || 0,
        statusCounts,
        proximaDataDisponivel: proximaData,
        proximoHorarioDisponivel: proximoHorario,
        taxaComparecimento: Math.round(taxaComparecimento)
      })

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Seção 1: Estatísticas Principais */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Estatísticas Gerais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Geral */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Total Geral</p>
                  <h3 className="text-3xl font-bold text-purple-700">{stats.totalGeral}</h3>
                  <p className="text-xs text-purple-500 mt-1">Todos os status</p>
                </div>
                <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hoje */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Hoje</p>
                  <h3 className="text-3xl font-bold text-blue-700">{stats.agendadosHoje}</h3>
                  <p className="text-xs text-blue-500 mt-1">Exceto cancelados</p>
            </div>
            <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Esta Semana */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-50 to-cyan-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-600 mb-1">Esta Semana</p>
                  <h3 className="text-3xl font-bold text-cyan-700">{stats.agendadosSemana}</h3>
                  <p className="text-xs text-cyan-500 mt-1">Exceto cancelados</p>
                </div>
                <div className="h-12 w-12 bg-cyan-500 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Este Mês */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600 mb-1">Este Mês</p>
                  <h3 className="text-3xl font-bold text-indigo-700">{stats.agendadosMes}</h3>
                  <p className="text-xs text-indigo-500 mt-1">Exceto cancelados</p>
                </div>
                <div className="h-12 w-12 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção 2: Status dos Agendamentos */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Status dos Agendamentos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Agendados */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Agendados</p>
                  <h3 className="text-3xl font-bold text-blue-700">{stats.statusCounts.agendado}</h3>
                  <p className="text-xs text-blue-500 mt-1">Aguardando atendimento</p>
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Concluídos */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Concluídos</p>
                  <h3 className="text-3xl font-bold text-green-700">{stats.statusCounts.concluido}</h3>
                  <p className="text-xs text-green-500 mt-1">Atendimentos realizados</p>
                </div>
                <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Não Compareceu */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 mb-1">Não Compareceu</p>
                  <h3 className="text-3xl font-bold text-yellow-700">{stats.statusCounts.naoCompareceu}</h3>
                  <p className="text-xs text-yellow-500 mt-1">Ausências registradas</p>
                </div>
                <div className="h-12 w-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancelados */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">Cancelados</p>
                  <h3 className="text-3xl font-bold text-red-700">{stats.statusCounts.cancelado}</h3>
                  <p className="text-xs text-red-500 mt-1">Cancelamentos</p>
                </div>
                <div className="h-12 w-12 bg-red-500 rounded-full flex items-center justify-center">
                  <Ban className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção 3: Disponibilidade e Taxa de Comparecimento */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Disponibilidade e Desempenho
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Próxima Data Disponível */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
                  <p className="text-sm font-medium text-emerald-600 mb-1">Próxima Data</p>
                  <h3 className="text-xl font-bold text-emerald-700">
                    {stats.proximaDataDisponivel
                      ? format(stats.proximaDataDisponivel, "dd/MM/yyyy", { locale: ptBR })
                  : "Não disponível"}
              </h3>
                  <p className="text-xs text-emerald-500 mt-1">
                    {stats.proximaDataDisponivel
                      ? format(stats.proximaDataDisponivel, "EEEE", { locale: ptBR })
                      : "Nenhuma vaga livre"}
                  </p>
            </div>
                <div className="h-12 w-12 bg-emerald-500 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Próximo Horário */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-violet-100 hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
                  <p className="text-sm font-medium text-violet-600 mb-1">Próximo Horário</p>
                  <h3 className="text-3xl font-bold text-violet-700">
                    {stats.proximoHorarioDisponivel || "--:--"}
              </h3>
                  <p className="text-xs text-violet-500 mt-1">Primeiro horário livre</p>
            </div>
                <div className="h-12 w-12 bg-violet-500 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Taxa de Comparecimento */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 mb-1">Taxa de Comparecimento</p>
                  <h3 className="text-3xl font-bold text-amber-700">{stats.taxaComparecimento}%</h3>
                  <p className="text-xs text-amber-500 mt-1">
                    Concluídos: {stats.statusCounts.concluido} / {stats.totalGeral}
                  </p>
                </div>
                <div className="h-12 w-12 bg-amber-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
