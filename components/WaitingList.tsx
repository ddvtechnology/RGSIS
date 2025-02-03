"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"

interface WaitingListItem {
  id: number
  nome: string
  cpf: string
  telefone: string
}

export function WaitingList() {
  const [waitingList, setWaitingList] = useState<WaitingListItem[]>([])
  const [newItem, setNewItem] = useState({ nome: "", cpf: "", telefone: "" })

  useEffect(() => {
    fetchWaitingList()
  }, [])

  const fetchWaitingList = async () => {
    const { data, error } = await supabase.from("lista_espera").select("*").order("created_at", { ascending: true })

    if (error) {
      console.error("Erro ao buscar lista de espera:", error)
    } else if (data) {
      setWaitingList(data)
    }
  }

  const addToWaitingList = async () => {
    if (newItem.nome && newItem.cpf && newItem.telefone) {
      const { data, error } = await supabase.from("lista_espera").insert([newItem])

      if (error) {
        console.error("Erro ao adicionar à lista de espera:", error)
      } else {
        fetchWaitingList()
        setNewItem({ nome: "", cpf: "", telefone: "" })
      }
    }
  }

  const removeFromWaitingList = async (id: number) => {
    const { error } = await supabase.from("lista_espera").delete().eq("id", id)

    if (error) {
      console.error("Erro ao remover da lista de espera:", error)
    } else {
      fetchWaitingList()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          placeholder="Nome"
          value={newItem.nome}
          onChange={(e) => setNewItem({ ...newItem, nome: e.target.value })}
        />
        <Input
          placeholder="CPF"
          value={newItem.cpf}
          onChange={(e) => setNewItem({ ...newItem, cpf: e.target.value })}
        />
        <Input
          placeholder="Telefone"
          value={newItem.telefone}
          onChange={(e) => setNewItem({ ...newItem, telefone: e.target.value })}
        />
        <Button onClick={addToWaitingList}>Adicionar</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {waitingList.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.nome}</TableCell>
              <TableCell>{item.cpf}</TableCell>
              <TableCell>{item.telefone}</TableCell>
              <TableCell>
                <Button variant="destructive" onClick={() => removeFromWaitingList(item.id)}>
                  Remover
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

