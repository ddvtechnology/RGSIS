"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ReportGenerator } from "@/components/ReportGenerator"
import { AdminScheduleForm } from "@/components/AdminScheduleForm"
import { Dashboard } from "@/components/Dashboard"
import { LayoutDashboard, CalendarPlus, FileBarChart, ClipboardList } from "lucide-react"
import { AppointmentList } from "@/components/AppointmentList"

export default function AdminPage() {

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <div className="max-w-7xl mx-auto">
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
              Painel Administrativo
            </CardTitle>
            <CardDescription className="text-gray-600">
              Gerencie agendamentos, visualize relatórios e mais
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full max-w-2xl mx-auto mb-6 grid grid-cols-4 h-auto p-1 bg-gray-100/80 rounded-lg border">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="agendamentos" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger 
              value="lista" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger 
              value="relatorios" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <FileBarChart className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <Dashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agendamentos" className="mt-0">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <AdminScheduleForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lista" className="mt-0">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <AppointmentList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relatorios" className="mt-0">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <ReportGenerator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

