"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { getAvailableTimeSlots } from "@/utils/dateUtils"
import Swal from 'sweetalert2'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (formData.dataAgendamento) {
      loadAvailableTimeSlots(formData.dataAgendamento)
    }
  }, [formData.dataAgendamento])

  const loadAvailableTimeSlots = async (date: Date) => {
    try {
      // Busca os horários disponíveis
      const horarios = await getAvailableTimeSlots(date)
      console.log('Horários disponíveis recebidos (admin):', horarios)
      
      // Atualiza o estado com os horários disponíveis
      setAvailableTimeSlots(horarios)

      // Se o horário selecionado não está mais disponível, limpa a seleção
      if (formData.horario && !horarios.includes(formData.horario)) {
        setFormData(prev => ({ ...prev, horario: "" }))
      }
    } catch (error) {
      console.error("Erro ao carregar horários:", error)
      setAvailableTimeSlots([])
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
        await loadAvailableTimeSlots(dataAjustada)
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
          email: "agendamento@presencial.com",
          data_agendamento: dataAjustada.toISOString().split("T")[0],
          horario: formData.horario,
          tipo: formData.tipo,
          status: "Agendado"
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
        `,
        icon: 'success',
        showConfirmButton: true,
        confirmButtonText: 'OK',
        confirmButtonColor: '#15803d',
        showCloseButton: true,
        showDenyButton: true,
        denyButtonText: 'Copiar mensagem',
        denyButtonColor: '#2563eb',
        preConfirm: () => {
          return new Promise((resolve) => {
            resolve(true)
          })
        },
        preDeny: async () => {
          try {
            await navigator.clipboard.writeText(mensagem)
            await Swal.fire({
              title: 'Copiado!',
              text: 'Mensagem copiada com sucesso!',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            })
            return false // Mantém o modal principal aberto
          } catch (err) {
            console.error('Erro ao copiar:', err)
            await Swal.fire({
              title: 'Erro',
              text: 'Não foi possível copiar a mensagem',
              icon: 'error',
              timer: 1500,
              showConfirmButton: false
            })
            return false // Mantém o modal principal aberto
          }
        }
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label>Data do Agendamento</Label>
              <div className="p-2 border rounded-lg bg-gray-50/50">
                <Calendar
                  mode="single"
                  selected={formData.dataAgendamento}
                  onSelect={handleDateSelect}
                  locale={ptBR}
                  weekStartsOn={0}
                  ISOWeek={false}
                  disabled={(date) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return date < today || date.getDay() === 0 || date.getDay() === 6
                  }}
                  className="rounded-md border bg-white"
                />
              </div>
              {formData.dataAgendamento && availableTimeSlots.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-2">
                    Horários Disponíveis:
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimeSlots.sort().map((horario) => (
                      <div key={horario} className="text-sm text-green-700 flex items-center">
                        • {horario}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {formData.dataAgendamento && availableTimeSlots.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                  <h4 className="text-sm font-medium text-yellow-900">
                    Não há horários disponíveis para esta data.
                  </h4>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="horario">Horário</Label>
                <Select
                  value={formData.horario}
                  onValueChange={(value) => handleSelectChange("horario", value)}
                  disabled={!formData.dataAgendamento || availableTimeSlots.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      !formData.dataAgendamento 
                        ? "Selecione uma data primeiro"
                        : availableTimeSlots.length === 0
                        ? "Nenhum horário disponível"
                        : "Selecione um horário"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.sort().map((horario) => (
                      <SelectItem 
                        key={horario} 
                        value={horario}
                      >
                        {horario}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full mt-6"
            disabled={!formData.dataAgendamento || !formData.horario || isSubmitting}
          >
            {isSubmitting ? "Agendando..." : "Agendar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

