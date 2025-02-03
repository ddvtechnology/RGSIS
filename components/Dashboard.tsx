import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

// Dados simulados para o gráfico
const data = [
  { dia: "Seg", agendamentos: 12 },
  { dia: "Ter", agendamentos: 18 },
  { dia: "Qua", agendamentos: 15 },
  { dia: "Qui", agendamentos: 20 },
  { dia: "Sex", agendamentos: 16 },
]

export function Dashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">24</div>
          <p className="text-xs text-muted-foreground">12 online, 12 presenciais</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Comparecimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">92%</div>
          <p className="text-xs text-muted-foreground">+2% em relação à semana passada</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próxima Data Disponível</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">15/06</div>
          <p className="text-xs text-muted-foreground">Em 5 dias</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vagas Restantes (Próx. 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">132</div>
          <p className="text-xs text-muted-foreground">53% de ocupação</p>
        </CardContent>
      </Card>
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Distribuição de Agendamentos (Próxima Semana)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <XAxis dataKey="dia" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Bar dataKey="agendamentos" fill="#adfa1d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

