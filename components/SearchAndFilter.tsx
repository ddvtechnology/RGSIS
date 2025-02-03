import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AppointmentStatus, AppointmentType } from "@/utils/types"

interface SearchAndFilterProps {
  onSearch: (searchTerm: string) => void
  onFilter: (status: AppointmentStatus | "", type: AppointmentType | "") => void
}

export function SearchAndFilter({ onSearch, onFilter }: SearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("")
  const [typeFilter, setTypeFilter] = useState<AppointmentType | "">("")

  const handleSearch = () => {
    onSearch(searchTerm)
  }

  const handleFilter = () => {
    onFilter(statusFilter, typeFilter)
  }

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
      <Input placeholder="Buscar por nome ou CPF" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AppointmentStatus | "")}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="Agendado">Agendado</SelectItem>
          <SelectItem value="Confirmado">Confirmado</SelectItem>
          <SelectItem value="Cancelado">Cancelado</SelectItem>
          <SelectItem value="Não Compareceu">Não Compareceu</SelectItem>
          <SelectItem value="Concluído">Concluído</SelectItem>
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as AppointmentType | "")}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="Online">Online</SelectItem>
          <SelectItem value="Presencial">Presencial</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleFilter}>Aplicar Filtros</Button>
    </div>
  )
}

