"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    // Simular autenticação
    if (username === "admin" && password === "admin123") {
      // Redirecionar para o painel de administração
      router.push("/admin")
    } else {
      setError("Credenciais inválidas")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-144px)]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login Administrativo</CardTitle>
          <CardDescription>Acesse o painel de controle</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button className="w-full" type="submit" onClick={handleLogin}>
            Entrar
          </Button>
          <Alert className="mt-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Credenciais de teste</AlertTitle>
            <AlertDescription>
              Usuário: admin
              <br />
              Senha: admin123
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
    </div>
  )
}

