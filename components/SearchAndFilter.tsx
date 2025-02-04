"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AppointmentStatus, AppointmentType } from "@/utils/types"
import { Search } from "lucide-react"

interface SearchAndFilterProps {
  onSearch: (term: string) => void
  onFilter: (status: string, type: string) => void
}

export function SearchAndFilter({ onSearch, onFilter }: SearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch(value)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    onFilter(value, typeFilter)
  }

  const handleTypeChange = (value: string) => {
    setTypeFilter(value)
    onFilter(statusFilter, value)
  }

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
        <Input 
          placeholder="Buscar por nome ou CPF" 
          value={searchTerm} 
          onChange={handleSearch}
          className="pl-10"
        />
      </div>
      
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Agendado">Agendado</SelectItem>
            <SelectItem value="Concluído">Concluído</SelectItem>
            <SelectItem value="Não Compareceu">Não Compareceu</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="presencial">Presencial</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

