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
  onSchedule?: () => void
}

export function AdminScheduleForm({ onSchedule }: AdminScheduleFormProps = {}) {
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

      // Importar função de conversão
      const { dateToDBFormat, formatDateToPtBR } = await import("@/utils/dateUtils")
      
      const dataAgendamento = formData.dataAgendamento!
      const dataFormatadaDB = dateToDBFormat(dataAgendamento)

      // Verifica se o horário ainda está disponível
      const { data: agendamentosExistentes, error: checkError } = await supabase
        .from("agendamentos")
        .select("horario")
        .eq("data_agendamento", dataFormatadaDB)
        .eq("status", "Agendado")
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
        await loadAvailableTimeSlots(dataAgendamento)
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
          data_agendamento: dataFormatadaDB,
          horario: formData.horario,
          tipo: formData.tipo,
          status: "Agendado"
        })

      if (insertError) throw insertError

      // Remove o horário agendado da lista de disponíveis
      setAvailableTimeSlots(prev => prev.filter(h => h !== formData.horario))

      const mensagem = `🗓️ *Agendamento RG - São Bento do Una*\n\n` +
        `📋 Nome: ${formData.nome}\n` +
        `📅 Data: ${formatDateToPtBR(dataAgendamento)}\n` +
        `⏰ Horário: ${formData.horario}\n` +
        `📍 Local: Secretaria de Assistência Social\n` +
        `🏥 Tipo: ${formData.tipo}\n\n` +
        `*Documentos necessários:*\n` +
        `- Certidão de Nascimento ou Casamento (original)\n` +
        `- Comprovante de residência\n` +
        `- CPF\n\n` +
        `⚠️ *Importante:* Chegue com 30 minutos de antecedência, caso ultrapasse o horário perderá a vez.\n\n` +
        `Em caso de dúvidas, entre em contato conosco.`

      await Swal.fire({
        title: 'Agendamento realizado com sucesso!',
        html: `
          <div style="text-align: left; margin-bottom: 15px; font-size: 1.1em;">
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
        customClass: {
          popup: 'max-w-md mx-auto',
          content: 'text-left',
        },
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
    <Card className="shadow-lg">
      <CardHeader className="space-y-1 px-4 md:px-6 py-4">
        <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">Agendar Novo Atendimento</CardTitle>
        <CardDescription className="text-gray-600">Preencha os dados para agendar um novo atendimento</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium text-gray-700">Nome Completo</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="Digite o nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm font-medium text-gray-700">CPF</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="Digite o CPF"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento" className="text-sm font-medium text-gray-700">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  name="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-sm font-medium text-gray-700">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="Digite o telefone"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Data do Agendamento</Label>
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
              </div>

              {formData.dataAgendamento && availableTimeSlots.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-2">
                    Horários Disponíveis:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Horário</Label>
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
                      <SelectItem key={horario} value={horario}>
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
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!formData.dataAgendamento || !formData.horario || isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <span className="mr-2">Agendando...</span>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            ) : (
              "Agendar"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

