import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import type { Appointment } from "@/utils/types"

interface DashboardProps {
  appointments: Appointment[]
}

export function Dashboard({ appointments }: DashboardProps) {
  const todayAppointments = appointments.filter(
    (app) => new Date(app.data_agendamento).toDateString() === new Date().toDateString(),
  )

  const upcomingAppointments = appointments.filter((app) => new Date(app.data_agendamento) > new Date())

  const completedAppointments = appointments.filter((app) => app.status === "Concluído")

  const nextAvailableDate =
    upcomingAppointments.length > 0
      ? new Date(upcomingAppointments[0].data_agendamento).toLocaleDateString()
      : "Não há agendamentos futuros"

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const count = appointments.filter(
      (app) => new Date(app.data_agendamento).toDateString() === date.toDateString(),
    ).length
    return {
      dia: date.toLocaleDateString("pt-BR", { weekday: "short" }),
      agendamentos: count,
    }
  })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayAppointments.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {((completedAppointments.length / appointments.length) * 100).toFixed(2)}%
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próxima Data Disponível</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{nextAvailableDate}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{appointments.length}</div>
        </CardContent>
      </Card>
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Distribuição de Agendamentos (Próxima Semana)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="agendamentos" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

