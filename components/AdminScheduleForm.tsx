"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/FileUpload"
import { supabase } from "@/lib/supabase"

export function AdminScheduleForm() {
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    certidaoNascimentoUrl: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, certidaoNascimentoUrl: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase.from("agendamentos").insert([
        {
          nome: formData.nome,
          cpf: formData.cpf,
          certidao_nascimento_url: formData.certidaoNascimentoUrl,
          status: "Pendente",
        },
      ])

      if (error) throw error

      alert("Agendamento realizado com sucesso!")
      setFormData({ nome: "", cpf: "", certidaoNascimentoUrl: "" })
    } catch (error) {
      console.error("Erro ao realizar agendamento:", error)
      alert("Erro ao realizar agendamento. Por favor, tente novamente.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitar Agendamento para RG</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label>Foto da Certidão de Nascimento</Label>
            <FileUpload onUpload={handleFileUpload} />
          </div>
          <Button type="submit" className="w-full">
            Solicitar Agendamento
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

