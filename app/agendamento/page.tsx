"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { FileUpload } from "@/components/FileUpload"
import { supabase } from "@/lib/supabase"
import { generateTimeSlots, formatDate, formatDateToPtBR, getAvailableTimeSlots } from "@/utils/dateUtils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy } from "lucide-react"
import { useRouter } from "next/navigation"
import Swal from 'sweetalert2'
import { ptBR } from "@/utils/dateUtils"

export default function AgendamentoPage() {
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    dataAgendamento: undefined as Date | undefined,
    horario: "",
  })

  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState("")
  const [whatsappMessage, setWhatsappMessage] = useState("")
  const [showCopyButton, setShowCopyButton] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchAvailableDates()
  }, [])

  useEffect(() => {
    if (formData.dataAgendamento) {
      loadAvailableTimeSlots(formData.dataAgendamento)
    }
  }, [formData.dataAgendamento])

  const fetchAvailableDates = async () => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 1)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 30)

    const { data: agendamentos, error } = await supabase
      .from("agendamentos")
      .select("data_agendamento, horario")
      .gte("data_agendamento", startDate.toISOString())
      .lte("data_agendamento", endDate.toISOString())
      .in("status", ["agendado", "confirmado"])

    if (error) {
      console.error("Erro ao buscar datas disponíveis:", error)
      return
    }

    // Agrupa os agendamentos por data
    const agendamentosPorData = agendamentos.reduce((acc: { [key: string]: string[] }, curr) => {
      const data = curr.data_agendamento.split("T")[0]
      if (!acc[data]) {
        acc[data] = []
      }
      acc[data].push(curr.horario)
      return acc
    }, {})

    const allTimeSlots = generateTimeSlots(new Date())
    const availableDates = []

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Pula fins de semana
      if (d.getDay() === 0 || d.getDay() === 6) continue

      const dataStr = d.toISOString().split("T")[0]
      const horariosOcupados = agendamentosPorData[dataStr] || []

      // Só bloqueia a data se todos os horários estiverem ocupados
      if (horariosOcupados.length < allTimeSlots.length) {
        availableDates.push(new Date(d))
      }
    }

    setAvailableDates(availableDates)
  }

  const loadAvailableTimeSlots = async (date: Date) => {
    try {
      // Busca os horários disponíveis
      const horarios = await getAvailableTimeSlots(date)
      
      // Atualiza o estado apenas se houver horários disponíveis
      if (horarios && horarios.length > 0) {
        setAvailableTimeSlots(horarios.sort())
      } else {
        setAvailableTimeSlots([])
      }

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

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage)
    alert("Mensagem copiada com sucesso!")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)

    try {
      const dataAjustada = new Date(formData.dataAgendamento)
      dataAjustada.setHours(0, 0, 0, 0)

      // Verifica se o horário ainda está disponível
      const { data: agendamentosExistentes, error: checkError } = await supabase
        .from("agendamentos")
        .select("horario")
        .eq("data_agendamento", dataAjustada.toISOString().split("T")[0])
        .in("status", ["Agendado", "Confirmado"])
        .eq("horario", formData.horario)

      if (checkError) throw checkError

      if (agendamentosExistentes && agendamentosExistentes.length > 0) {
        await Swal.fire({
          title: 'Horário Indisponível',
          text: 'Este horário já foi reservado. Por favor, escolha outro horário.',
          icon: 'warning',
          confirmButtonColor: '#15803d'
        })
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
          email: "agendamento@online.com", // Email padrão para agendamentos online
          data_agendamento: dataAjustada.toISOString().split("T")[0],
          horario: formData.horario,
          tipo: "online",
          status: "Agendado"
        })

      if (insertError) throw insertError

      // Remove o horário agendado da lista de disponíveis
      setAvailableTimeSlots(prev => prev.filter(h => h !== formData.horario))

      const dataFormatada = formData.dataAgendamento ? formatDateToPtBR(formData.dataAgendamento) : ''

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
        `⚠️ Importante: Chegue com 30 minutos de antecedência.\n\n` +
        `Em caso de dúvidas, entre em contato conosco.`

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

      setFormData({
        nome: "",
        cpf: "",
        dataNascimento: "",
        telefone: "",
        dataAgendamento: undefined,
        horario: "",
      })

      await fetchAvailableDates()
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
    <div className="container mx-auto p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl md:text-2xl text-center">Agendamento de RG</CardTitle>
          <CardDescription className="text-center">Preencha o formulário para agendar seu atendimento</CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="mb-6 space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
              
              {showCopyButton && (
                <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                  <h3 className="font-medium text-gray-700">Mensagem para WhatsApp:</h3>
                  <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border">
                    {whatsappMessage}
                  </pre>
                  <Button 
                    onClick={handleCopyMessage}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar mensagem
                  </Button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Agendamento */}
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
    </div>
  )
}

