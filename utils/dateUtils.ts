import { ptBR as dateFnsPtBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

export const ptBR = {
  ...dateFnsPtBR,
  localize: {
    ...dateFnsPtBR.localize,
    month: (n: number) => {
      return [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ][n];
    },
    day: (n: number, options?: { width?: string }) => {
      const width = options?.width || "full";
      const days = {
        narrow: ["D", "S", "T", "Q", "Q", "S", "S"],
        short: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
        abbreviated: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
        wide: [
          "Domingo",
          "Segunda-feira",
          "Terça-feira",
          "Quarta-feira",
          "Quinta-feira",
          "Sexta-feira",
          "Sábado",
        ],
        full: [
          "Domingo",
          "Segunda-feira",
          "Terça-feira",
          "Quarta-feira",
          "Quinta-feira",
          "Sexta-feira",
          "Sábado",
        ],
      };

      const dayWidth = width as keyof typeof days;
      return days[dayWidth] ? days[dayWidth][n] : days.full[n];
    },
  },
  formatLong: {
    ...dateFnsPtBR.formatLong,
    date: () => "dd/MM/yyyy",
  },
};

export const formatDateToPtBR = (date: Date): string => {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateTimeToPtBR = (date: Date): string => {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatMonthYearToPtBR = (date: Date): string => {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};

export const formatWeekdayToPtBR = (date: Date): string => {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
  });
};

export async function getAvailableTimeSlots(date: Date) {
  try {
    // 1. Ajusta a data para meia-noite para comparação consistente
    const dataAjustada = new Date(date);
    dataAjustada.setHours(0, 0, 0, 0);
    const dataFormatada = dataAjustada.toISOString().split("T")[0];

    // 2. Lista de todos os horários possíveis (já padronizados)
    const todosHorarios = generateTimeSlots(dataAjustada);

    // 3. Busca TODOS os agendamentos ativos para esta data
    const { data: agendamentosAtivos, error } = await supabase
      .from("agendamentos")
      .select("horario, status")
      .eq("data_agendamento", dataFormatada)
      .in("status", ["Agendado", "Confirmado"]); // Considera apenas agendados e confirmados

    if (error) {
      console.error("Erro ao buscar agendamentos:", error);
      return [];
    }

    // 4. Cria um Set com os horários ocupados para busca mais eficiente
    const horariosOcupados = new Set(
      agendamentosAtivos?.map((agendamento) => {
        const [hora, minuto] = agendamento.horario.split(":");
        return `${hora.padStart(2, "0")}:${minuto.padStart(2, "0")}`;
      }) || []
    );

    // 5. Filtra os horários disponíveis
    const horariosDisponiveis = todosHorarios.filter(
      (horario) => !horariosOcupados.has(horario)
    );

    console.log("=== DEBUG getAvailableTimeSlots ===");
    console.log("Data formatada:", dataFormatada);
    console.log("Horários ocupados:", Array.from(horariosOcupados));
    console.log("Horários disponíveis:", horariosDisponiveis);
    console.log("================================");

    return horariosDisponiveis.sort();
  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    return [];
  }
}

export function generateTimeSlots(date: Date) {
  const isSexta = date.getDay() === 5; // Verifica se é sexta-feira (5 representa sexta-feira)

  // Lista completa de horários disponíveis
  const horarios = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
  ];

  if (isSexta) {
    // Se for sexta-feira, retorna somente horários até 12:30
    return horarios.filter((horario) => {
      const [hora, minuto] = horario.split(":");
      const horaNum = parseInt(hora, 10);
      // Permite somente horários antes de 12:30
      return horaNum < 12 || (horaNum === 12 && minuto === "30");
    });
  }

  // Para os demais dias, remove o horário '12:30'
  return horarios.filter((horario) => horario !== "12:30");
}

export function generateAvailableDates(startDate: Date, numberOfDays: number) {
  const dates = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < numberOfDays; i++) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      // Excluir sábados e domingos
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}