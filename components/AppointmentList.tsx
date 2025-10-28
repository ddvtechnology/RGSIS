"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search, Filter, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Appointment, AppointmentStatus } from "@/utils/types"
import { useNotification } from "@/contexts/NotificationContext"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MoreHorizontal, CheckCircle, XCircle, Clock, Ban } from "lucide-react"
import { dbFormatToDate, dateToDBFormat } from "@/utils/dateUtils"

const statusConfig = {
  "Agendado": { label: "Agendado", color: "bg-blue-500", Icon: Clock },
  "Concluído": { label: "Concluído", color: "bg-green-500", Icon: CheckCircle },
  "Não Compareceu": { label: "Não Compareceu", color: "bg-yellow-500", Icon: XCircle },
  "Cancelado": { label: "Cancelado", color: "bg-red-500", Icon: Ban },
}

// Função helper para obter data de hoje
const getToday = () => {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return format(hoje, "yyyy-MM-dd")
}

export function AppointmentList() {
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [displayAppointments, setDisplayAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filtros com valores padrão (data de hoje)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [dataInicial, setDataInicial] = useState(getToday)
  const [dataFinal, setDataFinal] = useState(getToday)
  const [showFilters, setShowFilters] = useState(true)
  
  const { showNotification } = useNotification()

  // Carregar agendamentos
  const loadAppointments = async () => {
    setIsLoading(true)
    try {
      // Busca TODOS os agendamentos sem limite (paginação automática)
      let allData: Appointment[] = []
      let hasMore = true
      let page = 0
      const pageSize = 1000 // Tamanho da página (limite do Supabase)

      while (hasMore) {
        const from = page * pageSize
        const to = from + pageSize - 1

        const { data, error } = await supabase
          .from("agendamentos")
          .select("*")
          .order("data_agendamento", { ascending: false })
          .order("horario", { ascending: true })
          .range(from, to)

        if (error) throw error

        if (data && data.length > 0) {
          allData = [...allData, ...(data as Appointment[])]
          
          // Se retornou menos que o pageSize, não há mais dados
          if (data.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }

      console.log(`📊 Total de agendamentos carregados: ${allData.length}`)
      setAllAppointments(allData)
      applyFilters(allData, searchTerm, statusFilter, dataInicial, dataFinal)
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
      showNotification("Erro ao carregar agendamentos", "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Aplicar todos os filtros
  const applyFilters = (
    appointments: Appointment[],
    search: string,
    status: string,
    dataIni: string,
    dataFim: string
  ) => {
    let filtered = [...appointments]

    // Filtro de pesquisa por nome ou CPF
    if (search.trim()) {
      const searchLower = search.trim().toLowerCase()
      filtered = filtered.filter(app => {
        const nomeCompleto = app.nome.trim()
        const nomeCompletoLower = nomeCompleto.toLowerCase()
        const partesNome = nomeCompleto.split(' ')
        
        // Nome completo EXATO ou qualquer parte do nome EXATA
        const nomeExato = partesNome.some(parte => parte.toLowerCase() === searchLower)
        
        // CPF (só números)
        const isNumerico = /^\d+$/.test(search)
        const cpfMatch = isNumerico && app.cpf.replace(/\D/g, '').includes(search)
        
        return nomeExato || cpfMatch
      })
    }

    // Filtro de status
    if (status !== "todos") {
      filtered = filtered.filter(app => {
        const appStatus = app.status.toLowerCase()
        const filterStatus = status.toLowerCase()
        return appStatus === filterStatus
      })
    }

    // Filtro de data inicial
    if (dataIni) {
      filtered = filtered.filter(app => app.data_agendamento >= dataIni)
    }

    // Filtro de data final
    if (dataFim) {
      filtered = filtered.filter(app => app.data_agendamento <= dataFim)
    }

    console.log(`📊 Filtros aplicados:`)
    console.log(`   - Pesquisa: "${search}"`)
    console.log(`   - Status: ${status}`)
    console.log(`   - Data Inicial: ${dataIni || "Todas"}`)
    console.log(`   - Data Final: ${dataFim || "Todas"}`)
    console.log(`   - Total original: ${appointments.length}`)
    console.log(`   - Total filtrado: ${filtered.length}`)

    setDisplayAppointments(filtered)
  }

  // Handlers de filtros
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    applyFilters(allAppointments, value, statusFilter, dataInicial, dataFinal)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    applyFilters(allAppointments, searchTerm, value, dataInicial, dataFinal)
  }

  const handleDataInicialChange = (value: string) => {
    setDataInicial(value)
    applyFilters(allAppointments, searchTerm, statusFilter, value, dataFinal)
  }

  const handleDataFinalChange = (value: string) => {
    setDataFinal(value)
    applyFilters(allAppointments, searchTerm, statusFilter, dataInicial, value)
  }

  const clearFilters = () => {
    console.log("🧹 Limpando filtros...")
    
    const hojeAtual = getToday()
    
    console.log(`📅 Data atual para filtros: ${hojeAtual}`)
    console.log(`📊 Total de agendamentos: ${allAppointments.length}`)
    
    // Atualiza os estados
    setSearchTerm("")
    setStatusFilter("todos")
    setDataInicial(hojeAtual)
    setDataFinal(hojeAtual)
    
    // Aplica os filtros com a data atual
    applyFilters(allAppointments, "", "todos", hojeAtual, hojeAtual)
    
    showNotification("Filtros limpos! Mostrando agendamentos de hoje.", "success")
  }

  const showAllAppointments = () => {
    console.log("📋 Mostrando todos os agendamentos...")
    
    // Atualiza os estados - remove filtros de data
    setSearchTerm("")
    setStatusFilter("todos")
    setDataInicial("")
    setDataFinal("")
    
    // Aplica os filtros sem restrição de data
    applyFilters(allAppointments, "", "todos", "", "")
    
    showNotification(`Mostrando todos os ${allAppointments.length} agendamentos do sistema.`, "success")
  }

  // Mudar status
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: newStatus })
        .eq("id", appointmentId)

      if (error) throw error

      // Atualizar lista local
      const updatedAppointments = allAppointments.map(app => 
        app.id === appointmentId ? { ...app, status: newStatus } : app
      )
      
      setAllAppointments(updatedAppointments)
      applyFilters(updatedAppointments, searchTerm, statusFilter, dataInicial, dataFinal)

      showNotification("Status atualizado com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      showNotification("Erro ao atualizar status", "error")
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    loadAppointments()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600 font-medium">Carregando agendamentos...</span>
        </div>
      </div>
    )
  }

  // Verifica se há filtros ativos
  const isShowingToday = dataInicial === getToday() && dataFinal === getToday()
  const isShowingAll = dataInicial === "" && dataFinal === ""
  const hasActiveFilters = 
    searchTerm !== "" || 
    statusFilter !== "todos" || 
    (!isShowingToday && !isShowingAll)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex gap-2 items-center">
          <h2 className="text-xl font-semibold text-gray-900">Lista de Agendamentos</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadAppointments}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="flex gap-3">
          <div className="text-sm bg-gray-100 px-3 py-2 rounded-lg">
            <span className="font-medium text-gray-600">Total no sistema:</span>
            <span className="ml-2 font-bold text-gray-900">{allAppointments.length}</span>
          </div>
          {hasActiveFilters && (
            <div className="text-sm bg-blue-100 px-3 py-2 rounded-lg">
              <span className="font-medium text-blue-600">Filtrados:</span>
              <span className="ml-2 font-bold text-blue-900">{displayAppointments.length}</span>
            </div>
          )}
        </div>
      </div>
        
      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros de Pesquisa
          </h3>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Ocultar" : "Expandir"} Filtros
            </Button>
          </div>
        </div>

        {/* Pesquisa rápida (sempre visível) */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input 
              placeholder="🔍 Pesquisar por nome ou CPF..." 
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Botões de Atalho Rápido */}
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={isShowingToday ? "default" : "outline"}
                size="sm"
                onClick={clearFilters}
                className={isShowingToday ? "bg-green-600 hover:bg-green-700" : ""}
              >
                📅 Hoje
              </Button>
              <Button
                variant={isShowingAll ? "default" : "outline"}
                size="sm"
                onClick={showAllAppointments}
                className={isShowingAll ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                📋 Todos os Agendamentos
              </Button>
            </div>

            {/* Indicador de Período */}
            {(isShowingToday || isShowingAll || hasActiveFilters) && (
              <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                {isShowingToday && (
                  <span>📅 Exibindo agendamentos de <strong>hoje</strong> ({format(new Date(dataInicial), "dd/MM/yyyy")})</span>
                )}
                {isShowingAll && (
                  <span>📋 Exibindo <strong>todos os agendamentos</strong> do sistema</span>
                )}
                {!isShowingToday && !isShowingAll && (dataInicial || dataFinal) && (
                  <span>
                    🗓️ Período: <strong>
                      {dataInicial ? format(new Date(dataInicial), "dd/MM/yyyy") : "Início"} 
                      {" até "} 
                      {dataFinal ? format(new Date(dataFinal), "dd/MM/yyyy") : "Fim"}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filtros avançados (expansível) */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            {/* Filtro de Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">📋 Todos</SelectItem>
                  <SelectItem value="agendado">🔵 Agendado</SelectItem>
                  <SelectItem value="concluído">✅ Concluído</SelectItem>
                  <SelectItem value="não compareceu">⚠️ Não Compareceu</SelectItem>
                  <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Inicial */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Data Inicial</Label>
              <Input
                type="date"
                value={dataInicial}
                onChange={(e) => handleDataInicialChange(e.target.value)}
              />
            </div>

            {/* Data Final */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Data Final</Label>
              <Input
                type="date"
                value={dataFinal}
                onChange={(e) => handleDataFinalChange(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Dica de uso */}
        <p className="text-xs text-gray-500 mt-3">
          💡 <strong>Dica:</strong> Digite o nome exato (ex: "Maria") ou CPF para pesquisar. Use os filtros para refinar os resultados.
        </p>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border shadow-sm">
        {displayAppointments.length > 0 ? (
          <div className="max-h-[600px] overflow-y-auto">
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px] lg:w-[300px] font-bold">Nome</TableHead>
                      <TableHead className="min-w-[120px] lg:w-[150px] font-bold">CPF</TableHead>
                      <TableHead className="min-w-[150px] lg:w-[200px] font-bold">Data</TableHead>
                      <TableHead className="min-w-[100px] lg:w-[100px] font-bold">Horário</TableHead>
                      <TableHead className="min-w-[120px] lg:w-[150px] font-bold">Tipo</TableHead>
                      <TableHead className="min-w-[120px] lg:w-[150px] font-bold">Status</TableHead>
                      <TableHead className="w-[100px] font-bold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayAppointments.map((appointment) => {
                      const StatusIcon = statusConfig[appointment.status as keyof typeof statusConfig]?.Icon || Clock
                      const statusColor = statusConfig[appointment.status as keyof typeof statusConfig]?.color || "bg-gray-500"
                      
                      return (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">{appointment.nome}</TableCell>
                          <TableCell>{appointment.cpf}</TableCell>
                          <TableCell>
                            {format(dbFormatToDate(appointment.data_agendamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{appointment.horario}</TableCell>
                          <TableCell className="capitalize">{appointment.tipo}</TableCell>
                          <TableCell>
                            <Badge 
                              className={`${statusColor} text-white flex items-center gap-1 w-fit`}
                            >
                              <StatusIcon className="w-4 h-4" />
                              {appointment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {Object.entries(statusConfig).map(([status, config]) => {
                                  const MenuIcon = config.Icon
                                  return (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={() => handleStatusChange(appointment.id, status as AppointmentStatus)}
                                      disabled={appointment.status === status}
                                      className="gap-2"
                                    >
                                      <MenuIcon className="w-4 h-4" />
                                      <span>Marcar como {status}</span>
                                    </DropdownMenuItem>
                                  )
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="space-y-3">
              {hasActiveFilters ? (
                <>
                  <p className="text-lg">🔍 Nenhum resultado encontrado</p>
                  <p>Não encontramos agendamentos com os filtros aplicados</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    Limpar todos os filtros
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg">📋 Lista vazia</p>
                  <p>Nenhum agendamento cadastrado no sistema</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
