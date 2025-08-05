"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search } from "lucide-react"
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
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MoreHorizontal, CheckCircle, XCircle, Clock, Ban } from "lucide-react"

const statusConfig = {
  "Agendado": { label: "Agendado", color: "bg-blue-500", Icon: Clock },
  "Concluído": { label: "Concluído", color: "bg-green-500", Icon: CheckCircle },
  "Não Compareceu": { label: "Não Compareceu", color: "bg-yellow-500", Icon: XCircle },
  "Cancelado": { label: "Cancelado", color: "bg-red-500", Icon: Ban },
}

export function AppointmentList() {
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [displayAppointments, setDisplayAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { showNotification } = useNotification()

  // Carregar agendamentos
  const loadAppointments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .order("data_agendamento", { ascending: false })
        .order("horario", { ascending: true })

      if (error) throw error

      const appointments = (data as Appointment[]) || []
      setAllAppointments(appointments)
      setDisplayAppointments(appointments)
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
      showNotification("Erro ao carregar agendamentos", "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Pesquisar agendamentos por NOME EXATO ou CPF
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    
    if (!value.trim()) {
      setDisplayAppointments(allAppointments)
      return
    }

    const search = value.trim() // Mantém maiúsculas/minúsculas originais
    const searchLower = search.toLowerCase()
    
    const filtered = allAppointments.filter(app => {
      const nomeCompleto = app.nome.trim()
      const nomeCompletoLower = nomeCompleto.toLowerCase()
      const partesNome = nomeCompleto.split(' ')
      
      // 1. Nome completo EXATO (case-insensitive)
      const nomeCompletoExato = nomeCompletoLower === searchLower
      
      // 2. Primeiro nome EXATO (case-insensitive)
      const primeiroNomeExato = partesNome[0] && partesNome[0].toLowerCase() === searchLower
      
      // 3. Qualquer nome do meio EXATO (case-insensitive)
      const qualquerNomeExato = partesNome.some(parte => parte.toLowerCase() === searchLower)
      
      // 4. CPF (só números)
      const isNumerico = /^\d+$/.test(search)
      const cpfMatch = isNumerico && app.cpf.replace(/\D/g, '').includes(search)
      
      // Log detalhado
      if (nomeCompletoExato) {
        console.log(`✅ Nome completo EXATO (case-insensitive): "${nomeCompleto}" = "${search}"`)
      } else if (primeiroNomeExato) {
        console.log(`✅ Primeiro nome EXATO (case-insensitive): "${partesNome[0]}" = "${search}" em "${nomeCompleto}"`)
      } else if (qualquerNomeExato) {
        console.log(`✅ Nome EXATO encontrado (case-insensitive): "${search}" em "${nomeCompleto}"`)
      } else if (cpfMatch) {
        console.log(`✅ CPF encontrado: "${search}" em "${app.cpf}"`)
      }
      
      return nomeCompletoExato || primeiroNomeExato || qualquerNomeExato || cpfMatch
    })
    
    console.log(`🔍 Pesquisa EXATA por "${search}" encontrou ${filtered.length} resultado(s) de ${allAppointments.length} total`)
    setDisplayAppointments(filtered)
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
      
      // Aplicar pesquisa novamente se necessário
      if (searchTerm.trim()) {
        handleSearch(searchTerm)
      } else {
        setDisplayAppointments(updatedAppointments)
      }

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

        {/* Indicador de resultados */}
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {searchTerm ? (
            <span className="text-blue-700 font-medium">
              🔍 {displayAppointments.length} resultado(s) para "{searchTerm}"
            </span>
          ) : (
            <span>📋 {allAppointments.length} agendamentos no total</span>
          )}
        </div>
        </div>
        
      {/* Barra de pesquisa */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="space-y-2">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input 
              placeholder="Digite o nome da pessoa ou CPF..." 
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-gray-500">
            🎯 <strong>Pesquisa EXATA:</strong> Digite "pollyan", "POLLYAN" ou "Pollyan" → encontra apenas quem tem exatamente esse nome
            <br />
            📱 <strong>CPF:</strong> Digite apenas números do CPF (ex: "123", "456")
            <br />
            ✅ <strong>Maiúsculas/minúsculas:</strong> Funciona com qualquer combinação de letras
          </p>
        </div>
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
                      const StatusIcon = statusConfig[appointment.status as keyof typeof statusConfig].Icon
                      return (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">{appointment.nome}</TableCell>
                          <TableCell>{appointment.cpf}</TableCell>
                          <TableCell>
                            {format(new Date(`${appointment.data_agendamento}T12:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{appointment.horario}</TableCell>
                          <TableCell className="capitalize">{appointment.tipo}</TableCell>
                          <TableCell>
                            <Badge 
                              className={`${statusConfig[appointment.status as keyof typeof statusConfig].color} text-white flex items-center gap-1`}
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
            <div className="space-y-2">
              {searchTerm ? (
                <>
                  <p className="text-lg">🔍 Nenhum resultado encontrado</p>
                  <p>Não encontramos agendamentos para "{searchTerm}"</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSearch("")}
                    className="mt-2"
                  >
                    Limpar pesquisa
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
      
      {/* Rodapé */}
      <div className="flex justify-between text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
        <span>
          Exibindo: <strong>{displayAppointments.length}</strong> agendamentos
        </span>
        <span>
          Total no sistema: <strong>{allAppointments.length}</strong>
        </span>
      </div>
    </div>
  )
}