"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

interface FileUploadProps {
  onUpload: (url: string) => void
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `certidoes/${fileName}`

      const { error: uploadError } = await supabase.storage.from("certidoes").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("certidoes").getPublicUrl(filePath)

      if (data && data.publicUrl) {
        onUpload(data.publicUrl)
        alert("Certidão enviada com sucesso!")
      } else {
        throw new Error("Failed to get public URL")
      }
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error)
      alert("Erro ao enviar a certidão. Por favor, tente novamente.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Input id="certidao" type="file" onChange={handleFileChange} accept=".pdf,image/*" disabled={uploading} />
      <Button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Enviando..." : "Enviar Certidão"}
      </Button>
    </div>
  )
}

