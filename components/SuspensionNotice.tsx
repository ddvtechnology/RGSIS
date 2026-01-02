"use client"

import React from "react"
import Image from "next/image"
import { SUSPENSION } from "@/suspension"

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "")
}

export const SuspensionNotice: React.FC = () => {
  const { title, message, whatsapp } = SUSPENSION
  const wa = digitsOnly(whatsapp || "")

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-2xl bg-white border rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold text-red-700 mb-2">{title}</h2>
        <p className="text-sm text-gray-700 mb-6">{message}</p>

        <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
          <a
            href={wa ? `https://wa.me/${wa}` : "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:brightness-95"
          >
            Contatar via WhatsApp
          </a>

          <button
            onClick={() => window.location.reload()}
            className="inline-block px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Tentar novamente
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">Se você acha que isso é um erro, contate o administrador.</p>
      </div>
    </div>
  )
}

export default SuspensionNotice
