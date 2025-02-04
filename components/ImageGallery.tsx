import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import type { Appointment } from "@/utils/types"
import Image from "next/image"

interface ImageGalleryProps {
  appointments: Appointment[]
}

export function ImageGallery({ appointments }: ImageGalleryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const filteredAppointments = appointments.filter(
    (app) =>
      app.certidao_url && // Apenas mostrar registros com imagens
      (app.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.cpf.replace(/\D/g, "").includes(searchTerm.replace(/\D/g, "")))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          type="text"
          placeholder="Buscar por nome ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppointments.map((appointment) => (
          <Card key={appointment.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedImage(appointment.certidao_url)}>
            <CardContent className="p-4">
              <div className="aspect-[3/4] relative mb-2">
                <Image
                  src={appointment.certidao_url}
                  alt={`Certidão de ${appointment.nome}`}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div className="space-y-1">
                <p className="font-medium truncate">{appointment.nome}</p>
                <p className="text-sm text-gray-500">CPF: {appointment.cpf}</p>
                <p className="text-sm text-gray-500">
                  Data: {new Date(appointment.data_agendamento).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal para visualização da imagem */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full h-[80vh]">
            <Image
              src={selectedImage}
              alt="Visualização da certidão"
              fill
              className="object-contain"
            />
            <button
              className="absolute top-4 right-4 bg-white rounded-full p-2"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {filteredAppointments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm
            ? "Nenhuma imagem encontrada para a busca realizada"
            : "Nenhuma imagem disponível"}
        </div>
      )}
    </div>
  )
}

