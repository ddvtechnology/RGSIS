import { useState, useEffect } from "react"
import { Card } from "./ui/card"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { ptBR } from "@/utils/dateUtils"
import { getAvailableTimeSlots } from "@/utils/dateUtils"
import { supabase } from "@/lib/supabase"
import Swal from "sweetalert2"
import { format } from "date-fns"

export function AgendamentoForm() {
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    dataAgendamento: undefined as Date | undefined,
    horario: "",
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
      const horarios = await getAvailableTimeSlots(date)
      if (horarios && horarios.length > 0) {
        setAvailableTimeSlots(horarios.sort())
      } else {
        setAvailableTimeSlots([])
      }

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
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      dataAgendamento: date,
      horario: ""
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // Importar função de conversão
      const { dateToDBFormat, formatDateToPtBR } = await import("@/utils/dateUtils")
      
      const dataAgendamento = formData.dataAgendamento!
      const dataFormatadaDB = dateToDBFormat(dataAgendamento)

      // Verifica disponibilidade
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
        await loadAvailableTimeSlots(dataAgendamento)
        return
      }

      // Insere agendamento
      const { error: insertError } = await supabase
        .from("agendamentos")
        .insert({
          nome: formData.nome,
          cpf: formData.cpf,
          data_nascimento: formData.dataNascimento,
          telefone: formData.telefone,
          email: "agendamento@online.com",
          data_agendamento: dataFormatadaDB,
          horario: formData.horario,
          tipo: "online",
          status: "Agendado"
        })

      if (insertError) throw insertError

      const dataFormatada = formatDateToPtBR(dataAgendamento)

      const mensagem = `🗓️ *Agendamento RG - São Bento do Una*\n\n` +
        `Olá ${formData.nome},\n\n` +
        `Seu agendamento foi realizado com sucesso!\n\n` +
        `📅 Data: ${dataFormatada}\n` +
        `⏰ Horário: ${formData.horario}\n` +
        `📍 Local: Secretaria de Assistência Social\n\n` +
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
            return false
          } catch (err) {
            console.error('Erro ao copiar:', err)
            await Swal.fire({
              title: 'Erro',
              text: 'Não foi possível copiar a mensagem',
              icon: 'error',
              timer: 1500,
              showConfirmButton: false
            })
            return false
          }
        }
      })

      setFormData({
        nome: "",
        cpf: "",
        dataNascimento: "",
        telefone: "",
        dataAgendamento: undefined,
        horario: "",
      })

      await loadAvailableTimeSlots(dataAgendamento)
    } catch (error: any) {
      console.error("Erro ao realizar agendamento:", error)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dados Pessoais */}
        <div className="space-y-4">
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
                placeholder="Digite seu nome completo"
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
                placeholder="Digite seu CPF"
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
                placeholder="Digite seu telefone"
              />
            </div>
          </div>
        </div>

        {/* Agendamento */}
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
  )
} 