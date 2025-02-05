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
import { Metadata } from "next"
import { AgendamentoForm } from "@/components/AgendamentoForm"

export default function AgendamentoPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 lg:p-8">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Agendamento Online
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Faça seu agendamento para emissão de RG de forma rápida e simples
            </p>
          </div>
          
          <AgendamentoForm />
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Em caso de dúvidas, entre em contato com a Secretaria de Assistência Social
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

