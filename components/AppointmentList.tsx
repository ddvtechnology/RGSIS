"use client"

import { useState, useEffect } from "react"
import { DatePicker } from "@/components/ui/date-picker"
import { SearchAndFilter } from "@/components/SearchAndFilter"
import { AppointmentTable } from "@/components/AppointmentTable"
import { supabase } from "@/lib/supabase"
import type { Appointment } from "@/utils/types"
import { useNotification } from "@/contexts/NotificationContext"
import { Button } from "@/components/ui/button"
import { Calendar, ListFilter } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [filterByDate, setFilterByDate] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const { showNotification } = useNotification()

  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      // Modificado para limitar o número de registros e usar paginação se necessário
      const { data, error, count } = await supabase
        .from("agendamentos")
        .select("*", { count: 'exact' })
        .order("data_agendamento", { ascending: true })
        // Se precisar de paginação:
        // .range(0, 999)  // Isso limita a 1000 registros por vez

      if (error) {
        console.error("Erro ao buscar agendamentos:", error)
        showNotification("Erro ao carregar agendamentos. Por favor, tente novamente.", "error")
        return
      }

      console.log("=== DEBUG CARREGAMENTO ===")
      console.log("Total de agendamentos:", data?.length)
      console.log("Contagem total no banco:", count)
      if (data && data.length > 0) {
        console.log("Exemplo de agendamento:", {
          nome: data[0].nome,
          data: data[0].data_agendamento,
          tipo: typeof data[0].data_agendamento
        })
        console.log("Datas disponíveis (amostra):", data.slice(0, 5).map(app => app.data_agendamento))
      }
      console.log("=========================")
      
      setAppointments(data || [])
      
      if (filterByDate) {
        filterAppointmentsByDate(data || [], selectedDate)
      } else {
        applyFilters(data || [], searchTerm, statusFilter, typeFilter)
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error)
      showNotification("Erro ao carregar agendamentos. Por favor, tente novamente.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  useEffect(() => {
    if (filterByDate) {
      filterAppointmentsByDate(appointments, selectedDate)
    }
  }, [selectedDate, filterByDate])

  const filterAppointmentsByDate = (appointmentsToFilter: Appointment[], date: Date) => {
    // Formata a data selecionada para YYYY-MM-DD (mesmo formato que vem do banco)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const selectedDateStr = `${year}-${month}-${day}`
    
    console.log("=== DEBUG FILTRO DE DATA ===")
    console.log("Data selecionada:", selectedDateStr)
    console.log("Total de agendamentos para filtrar:", appointmentsToFilter.length)
    
    // Criar um array separado para debug
    const matchingAppointments = []
    
    // Primeiro passe para debugging antes de filtrar
    for (const app of appointmentsToFilter) {
      if (app.data_agendamento === selectedDateStr) {
        matchingAppointments.push(app)
      }
    }
    
    console.log(`Agendamentos que devem corresponder à data ${selectedDateStr}:`, 
      matchingAppointments.map(a => ({ nome: a.nome, data: a.data_agendamento })))
    
    // Agora fazer o filtro real
    const filtered = appointmentsToFilter.filter(app => {
      const appDateStr = app.data_agendamento
      
      // Simplificando o log para não sobrecarregar o console
      if (appDateStr === selectedDateStr) {
        console.log(`Match encontrado: ${app.nome} (${appDateStr})`)
      }
      
      return appDateStr === selectedDateStr
    })
    
    console.log(`Total de agendamentos encontrados para ${selectedDateStr}:`, filtered.length)
    if (filtered.length === 0 && matchingAppointments.length > 0) {
      console.error("ERRO: Há uma discrepância entre os agendamentos identificados e filtrados!")
    }
    
    // Verificar se há dados válidos no banco para esta data
    const dataExisteNoBanco = appointmentsToFilter.some(app => app.data_agendamento === selectedDateStr)
    if (!dataExisteNoBanco) {
      console.log(`Não existem agendamentos no banco para a data ${selectedDateStr}`)
    }
    
    setFilteredAppointments(filtered)
  }

  const applyFilters = (appointmentsToFilter: Appointment[], search: string, status: string, type: string) => {
    let filtered = [...appointmentsToFilter]
    
    // Aplicar filtro de busca
    if (search) {
      filtered = filtered.filter(
        (app) => 
          app.nome.toLowerCase().includes(search.toLowerCase()) || 
          app.cpf.includes(search)
      )
    }
    
    // Aplicar filtro de status
    if (status && status !== "all") {
      filtered = filtered.filter((app) => app.status === status)
    }
    
    // Aplicar filtro de tipo
    if (type && type !== "all") {
      filtered = filtered.filter((app) => app.tipo.toLowerCase() === type.toLowerCase())
    }
    
    console.log("Agendamentos após aplicar filtros:", filtered.length)
    setFilteredAppointments(filtered)
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    
    if (filterByDate) {
      filterAppointmentsByDate(appointments, selectedDate)
    } else {
      applyFilters(appointments, term, statusFilter, typeFilter)
    }
  }

  const handleFilter = (status: string, type: string) => {
    setStatusFilter(status)
    setTypeFilter(type)
    
    if (filterByDate) {
      filterAppointmentsByDate(appointments, selectedDate)
    } else {
      applyFilters(appointments, searchTerm, status, type)
    }
  }

  const toggleFilterMode = () => {
    const newFilterByDate = !filterByDate
    setFilterByDate(newFilterByDate)
    
    if (newFilterByDate) {
      filterAppointmentsByDate(appointments, selectedDate)
    } else {
      applyFilters(appointments, searchTerm, statusFilter, typeFilter)
    }
  }

  // Implementação da busca direta no banco para o dia específico
  const loadAppointmentsForDate = async (date: Date) => {
    setIsLoading(true)
    
    try {
      // Formata a data para YYYY-MM-DD
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      // Busca diretamente do banco apenas os registros para a data específica
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("data_agendamento", dateStr)
        .order("horario", { ascending: true })
      
      if (error) {
        console.error("Erro ao buscar agendamentos para data específica:", error)
        showNotification("Erro ao carregar agendamentos para a data selecionada.", "error")
        return
      }
      
      console.log(`Agendamentos carregados diretamente para ${dateStr}:`, data?.length)
      
      // Aplicar filtros adicionais se necessário
      let filtered = data || []
      if (statusFilter !== "all") {
        filtered = filtered.filter(app => app.status === statusFilter)
      }
      if (typeFilter !== "all") {
        filtered = filtered.filter(app => app.tipo.toLowerCase() === typeFilter.toLowerCase())
      }
      if (searchTerm) {
        filtered = filtered.filter(app => 
          app.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
          app.cpf.includes(searchTerm)
        )
      }
      
      setFilteredAppointments(filtered)
    } catch (error) {
      console.error("Erro ao carregar agendamentos específicos:", error)
      showNotification("Erro ao buscar agendamentos para a data.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Modificar o useEffect para usar o novo método
  useEffect(() => {
    if (filterByDate) {
      loadAppointmentsForDate(selectedDate)
    }
  }, [selectedDate, filterByDate])

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      // Atualiza o estado local primeiro
      const updatedAppointments = appointments.map(app => 
        app.id === appointmentId ? { ...app, status: newStatus } : app
      )
      setAppointments(updatedAppointments)

      // Atualiza a lista filtrada
      const updatedFiltered = filteredAppointments.map(app => 
        app.id === appointmentId ? { ...app, status: newStatus } : app
      )
      setFilteredAppointments(updatedFiltered)

      // Atualiza no banco de dados em segundo plano
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: newStatus })
        .eq("id", appointmentId)

      if (error) throw error

      showNotification("Status atualizado com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      showNotification("Erro ao atualizar status. Tente novamente.", "error")
      
      // Reverte as mudanças em caso de erro
      fetchAppointments()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="flex gap-2 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={toggleFilterMode}
                  className={filterByDate ? "border-green-600 text-green-700" : "border-blue-600 text-blue-700"}
                >
                  {filterByDate ? <Calendar className="h-4 w-4" /> : <ListFilter className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{filterByDate ? "Filtrando por dia" : "Mostrando todos os agendamentos"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {filterByDate && (
            <DatePicker
              selected={selectedDate}
              onSelect={(date) => {
                handleDateChange(date);
                // Focar na busca direta no banco quando a data mudar
                if (date) {
                  loadAppointmentsForDate(date);
                }
              }}
              className="w-full lg:w-auto"
            />
          )}
          
          {!filterByDate && (
            <div className="text-sm font-medium text-blue-700">
              Mostrando todos os agendamentos
            </div>
          )}
        </div>
        
        <div className="flex-1 w-full lg:w-auto">
          <SearchAndFilter 
            onSearch={handleSearch} 
            onFilter={handleFilter}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredAppointments.length > 0 ? (
          <AppointmentTable 
            appointments={filteredAppointments}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            {filterByDate 
              ? "Nenhum agendamento encontrado para a data selecionada." 
              : "Nenhum agendamento encontrado com os filtros aplicados."}
          </div>
        )}
      </div>
      
      <div className="text-right text-sm text-gray-500">
        Total: {filteredAppointments.length} agendamento(s)
      </div>
    </div>
  )
}