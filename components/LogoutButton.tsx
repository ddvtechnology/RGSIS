"use client"

import { useEffect, useState } from "react"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function LogoutButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  if (!isLoggedIn) return null

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-700 hover:bg-red-600 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sair
    </button>
  )
} 