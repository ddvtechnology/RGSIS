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
import { generateTimeSlots, formatDate } from "@/utils/dateUtils"

export default function AgendamentoPage() {
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    dataNascimento: "",
    telefone: "",
    email: "",
    dataAgendamento: undefined as Date | undefined,
    horario: "",
    certidaoUrl: "",
  })

  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])

  useEffect(() => {
    fetchAvailableDates()
  }, [])

  useEffect(() => {
    if (formData.dataAgendamento) {
      fetchAvailableTimeSlots(formData.dataAgendamento)
    }
  }, [formData.dataAgendamento])

  const fetchAvailableDates = async () => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 1)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 30)

    const { data, error } = await supabase
      .from("agendamentos")
      .select("data_agendamento")
      .gte("data_agendamento", startDate.toISOString())
      .lte("data_agendamento", endDate.toISOString())

    if (error) {
      console.error("Erro ao buscar datas disponíveis:", error)
      return
    }

    const bookedDates = new Set(data.map((item) => item.data_agendamento.split("T")[0]))
    const availableDates = []

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6 && !bookedDates.has(d.toISOString().split("T")[0])) {
        availableDates.push(new Date(d))
      }
    }

    setAvailableDates(availableDates)
  }

  const fetchAvailableTimeSlots = async (date: Date) => {
    const { data, error } = await supabase
      .from("agendamentos")
      .select("horario")
      .eq("data_agendamento", date.toISOString().split("T")[0])

    if (error) {
      console.error("Erro ao buscar horários disponíveis:", error)
      return
    }

    const bookedTimeSlots = new Set(data.map((item) => item.horario))
    const allTimeSlots = generateTimeSlots()
    const availableSlots = allTimeSlots.filter((slot) => !bookedTimeSlots.has(slot))

    setAvailableTimeSlots(availableSlots)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, dataAgendamento: date }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, certidaoUrl: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase.from("agendamentos").insert([
        {
          nome: formData.nome,
          cpf: formData.cpf,
          data_nascimento: formData.dataNascimento,
          telefone: formData.telefone,
          email: formData.email,
          data_agendamento: formData.dataAgendamento?.toISOString(),
          horario: formData.horario,
          certidao_url: formData.certidaoUrl,
          status: "Agendado",
        },
      ])

      if (error) throw error

      alert("Agendamento realizado com sucesso!")
      // Limpar o formulário ou redirecionar o usuário
    } catch (error) {
      console.error("Erro ao realizar agendamento:", error)
      alert("Erro ao realizar agendamento. Por favor, tente novamente.")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Agendamento de RG</CardTitle>
          <CardDescription>Preencha o formulário para agendar seu atendimento</CardDescription>
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
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label>Certidão de Nascimento/Casamento</Label>
                <FileUpload onUpload={handleFileUpload} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <Label>Data do Agendamento</Label>
                <Calendar
                  mode="single"
                  selected={formData.dataAgendamento}
                  onSelect={handleDateSelect}
                  disabled={(date) =>
                    !availableDates.some((availableDate) => availableDate.toDateString() === date.toDateString())
                  }
                  className="rounded-md border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horario">Horário</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("horario", value)}
                  disabled={!formData.dataAgendamento}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.dataAgendamento && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Data selecionada: {formatDate(formData.dataAgendamento)}
                  </p>
                )}
              </div>
            </div>
            <Button type="submit" onClick={handleSubmit} className="w-full mt-6">
              Agendar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

