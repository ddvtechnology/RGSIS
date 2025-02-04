"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { generateTimeSlots } from "@/utils/dateUtils"
import Swal from 'sweetalert2'
import { format } from 'date-fns'

interface AdminScheduleFormProps {
  onSchedule: () => void
}

export function AdminScheduleForm({ onSchedule }: AdminScheduleFormProps) {
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    dataAgendamento: undefined as Date | undefined,
    horario: "",
    tipo: "presencial"
  })

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [horariosOcupados, setHorariosOcupados] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (formData.dataAgendamento) {
      fetchAvailableTimeSlots(formData.dataAgendamento)
    }
  }, [formData.dataAgendamento])

  const fetchAvailableTimeSlots = async (date: Date) => {
    try {
      const dataAjustada = new Date(date)
      dataAjustada.setHours(0, 0, 0, 0)

      // Busca todos os agendamentos para a data selecionada
      const { data: agendamentos, error } = await supabase
        .from("agendamentos")
        .select("horario, status")
        .eq("data_agendamento", dataAjustada.toISOString().split("T")[0])
        .in("status", ["agendado", "confirmado"])

      if (error) {
        console.error("Erro ao buscar agendamentos:", error)
        throw error
      }

      console.log("Agendamentos encontrados:", agendamentos) // Debug

      // Cria um Set com os horários ocupados
      const ocupados = new Set(agendamentos?.map(a => a.horario) || [])
      console.log("Horários ocupados:", Array.from(ocupados)) // Debug
      setHorariosOcupados(ocupados)

      // Gera todos os horários possíveis para o dia
      const todosHorarios = generateTimeSlots(dataAjustada)
      console.log("Todos os horários:", todosHorarios) // Debug
      setAvailableTimeSlots(todosHorarios)

      // Limpa o horário selecionado se estiver ocupado
      if (formData.horario && ocupados.has(formData.horario)) {
        setFormData(prev => ({ ...prev, horario: "" }))
      }
    } catch (error) {
      console.error("Erro ao buscar horários:", error)
      setAvailableTimeSlots([])
      setHorariosOcupados(new Set())
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    setFormData((prev) => ({ 
      ...prev, 
      dataAgendamento: date,
      horario: "" // Limpa o horário quando mudar a data
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.nome || !formData.cpf || !formData.dataNascimento || !formData.telefone || !formData.dataAgendamento || !formData.horario) {
        await Swal.fire({
          title: 'Atenção!',
          text: 'Por favor, preencha todos os campos obrigatórios.',
          icon: 'warning',
          confirmButtonColor: '#15803d'
        })
        setIsSubmitting(false)
        return
      }

      const dataAjustada = new Date(formData.dataAgendamento)
      dataAjustada.setHours(0, 0, 0, 0)

      // Verifica se o horário ainda está disponível
      const { data: agendamentosExistentes, error: checkError } = await supabase
        .from("agendamentos")
        .select("horario")
        .eq("data_agendamento", dataAjustada.toISOString().split("T")[0])
        .eq("status", "agendado")
        .eq("horario", formData.horario)

      if (checkError) throw checkError

      if (agendamentosExistentes && agendamentosExistentes.length > 0) {
        await Swal.fire({
          title: 'Horário Indisponível',
          text: 'Este horário já foi reservado. Por favor, escolha outro horário.',
          icon: 'warning',
          confirmButtonColor: '#15803d'
        })
        // Atualiza a lista de horários disponíveis
        await fetchAvailableTimeSlots(dataAjustada)
        setIsSubmitting(false)
        return
      }

      // Insere o agendamento
      const { error: insertError } = await supabase
        .from("agendamentos")
        .insert({
          nome: formData.nome,
          cpf: formData.cpf,
          data_nascimento: formData.dataNascimento,
          telefone: formData.telefone,
          email: "admin@rg.com",
          data_agendamento: dataAjustada.toISOString().split("T")[0],
          horario: formData.horario,
          tipo: formData.tipo,
          status: "agendado"
        })

      if (insertError) throw insertError

      // Remove o horário agendado da lista de disponíveis
      setAvailableTimeSlots(prev => prev.filter(h => h !== formData.horario))

      const mensagem = `🗓️ Agendamento confirmado!\n\n📋 Nome: ${formData.nome}\n📅 Data: ${format(dataAjustada, "dd/MM/yyyy")}\n⏰ Horário: ${formData.horario}\n🏥 Tipo: ${formData.tipo}\n\nPor favor, compareça com 15 minutos de antecedência e traga seus documentos.`

      await Swal.fire({
        title: 'Agendamento realizado com sucesso!',
        html: `
          <div style="text-align: left; margin-bottom: 15px;">
            ${mensagem.replace(/\n/g, '<br>')}
          </div>
          <div style="margin-top: 15px;">
            <button onclick="navigator.clipboard.writeText(\`${mensagem}\`)" class="swal2-confirm swal2-styled">
              Copiar mensagem
            </button>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#15803d'
      })

      resetForm()
      if (onSchedule) onSchedule()
    } catch (error: any) {
      console.error("Erro ao agendar:", error)
      await Swal.fire({
        title: 'Erro!',
        text: error?.message || 'Ocorreu um erro ao realizar o agendamento. Por favor, tente novamente.',
        icon: 'error',
        confirmButtonColor: '#15803d'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nome: "",
      cpf: "",
      dataNascimento: "",
      telefone: "",
      dataAgendamento: undefined,
      horario: "",
      tipo: "presencial"
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendar Novo Atendimento</CardTitle>
        <CardDescription>Preencha os dados para agendar um novo atendimento</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                name="dataNascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <Label>Data do Agendamento</Label>
              <Calendar
                mode="single"
                selected={formData.dataAgendamento}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return date < today || date.getDay() === 0 || date.getDay() === 6
                }}
                className="rounded-md border"
              />
              {formData.dataAgendamento && horariosOcupados.size > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
                  <h4 className="text-sm font-medium text-red-900 mb-2">
                    Horários Ocupados:
                  </h4>
                  <div className="space-y-1">
                    {Array.from(horariosOcupados).sort().map((horario) => (
                      <div key={horario} className="text-sm text-red-700">
                        • {horario}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario">Horários</Label>
              <Select
                value={formData.horario}
                onValueChange={(value) => handleSelectChange("horario", value)}
                disabled={!formData.dataAgendamento}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.dataAgendamento 
                      ? "Selecione uma data primeiro"
                      : "Selecione um horário"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.map((horario) => {
                    const ocupado = horariosOcupados.has(horario)
                    return (
                      <SelectItem 
                        key={horario} 
                        value={horario}
                        disabled={ocupado}
                        className={ocupado ? 'text-red-500 line-through' : ''}
                      >
                        {horario} {ocupado ? '(Ocupado)' : ''}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full mt-6"
            disabled={!formData.dataAgendamento || !formData.horario || isSubmitting || horariosOcupados.has(formData.horario)}
          >
            Agendar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

