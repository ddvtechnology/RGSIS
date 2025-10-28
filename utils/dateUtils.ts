import { ptBR as dateFnsPtBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";

/**
 * Locale customizado para pt-BR
 */
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

/**
 * FUNÇÕES DE CONVERSÃO DE DATAS - TIMEZONE BRASIL
 * 
 * IMPORTANTE: Estas funções garantem que as datas sejam sempre tratadas
 * como data local (Brasil) sem problemas de timezone UTC.
 */

/**
 * Converte uma Date para string no formato "YYYY-MM-DD" (para banco de dados)
 * Remove informação de hora e timezone
 */
export function dateToDBFormat(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte string "YYYY-MM-DD" do banco para Date (Brasil)
 * Define hora como meio-dia para evitar problemas de timezone
 */
export function dbFormatToDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return date;
}

/**
 * Retorna data atual (Brasil) com hora zerada
 */
export function getToday(): Date {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return hoje;
}

/**
 * Retorna data atual no formato do banco "YYYY-MM-DD"
 */
export function getTodayDBFormat(): string {
  return dateToDBFormat(getToday());
}

/**
 * Formata data para exibição em pt-BR (dd/MM/yyyy)
 */
export const formatDateToPtBR = (date: Date): string => {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formata data e hora para exibição em pt-BR
 */
export const formatDateTimeToPtBR = (date: Date): string => {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formata mês e ano para exibição em pt-BR
 */
export const formatMonthYearToPtBR = (date: Date): string => {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};

/**
 * Formata dia da semana para exibição em pt-BR
 */
export const formatWeekdayToPtBR = (date: Date): string => {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
  });
};

/**
 * Busca horários disponíveis para uma data específica
 * 
 * @param date Data para verificar disponibilidade
 * @returns Array com horários disponíveis no formato "HH:MM"
 */
export async function getAvailableTimeSlots(date: Date): Promise<string[]> {
  try {
    // 1. Converte a data para formato do banco (YYYY-MM-DD)
    const dataFormatada = dateToDBFormat(date);

    console.log("=== getAvailableTimeSlots DEBUG ===");
    console.log("Data recebida:", date);
    console.log("Data formatada para DB:", dataFormatada);

    // 2. Gera todos os horários possíveis para o dia
    const todosHorarios = generateTimeSlots(date);
    console.log("Todos os horários possíveis:", todosHorarios);

    // 3. Busca agendamentos ativos para esta data
    const { data: agendamentosAtivos, error } = await supabase
      .from("agendamentos")
      .select("horario, status")
      .eq("data_agendamento", dataFormatada)
      .eq("status", "Agendado");

    if (error) {
      console.error("Erro ao buscar agendamentos:", error);
      return [];
    }

    console.log("Agendamentos ativos encontrados:", agendamentosAtivos);

    // 4. Cria Set com horários ocupados (normaliza formato HH:MM)
    const horariosOcupados = new Set(
      agendamentosAtivos?.map((agendamento) => {
        const [hora, minuto] = agendamento.horario.split(":");
        return `${hora.padStart(2, "0")}:${minuto.padStart(2, "0")}`;
      }) || []
    );

    console.log("Horários ocupados:", Array.from(horariosOcupados));

    // 5. Filtra horários disponíveis
    const horariosDisponiveis = todosHorarios.filter(
      (horario) => !horariosOcupados.has(horario)
    );

    console.log("Horários disponíveis:", horariosDisponiveis);
    console.log("=====================================");

    return horariosDisponiveis.sort();
  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    return [];
  }
}

/**
 * Gera slots de horários disponíveis baseado no dia da semana
 * 
 * Segunda a Quinta: 08:00 às 15:30 (exceto 12:30 - almoço)
 * Sexta-feira: 08:00 às 12:30
 * Intervalo: 30 minutos
 * 
 * @param date Data para gerar horários
 * @returns Array com horários no formato "HH:MM"
 */
export function generateTimeSlots(date: Date): string[] {
  const diaSemana = date.getDay(); // 0 = Domingo, 5 = Sexta, 6 = Sábado
  const isSexta = diaSemana === 5;

  // Lista completa de horários (Segunda a Quinta)
  const horariosPadrao = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    // 12:30 é removido nos dias normais (horário de almoço)
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
  ];

  if (isSexta) {
    // Sexta-feira: apenas manhã até 12:30
    return [
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
    ];
  }

  // Segunda a Quinta: horário completo exceto 12:30
  return horariosPadrao;
}

/**
 * Gera array com datas disponíveis (dias úteis) a partir de uma data
 * 
 * @param startDate Data inicial
 * @param numberOfDays Número de dias a frente para gerar
 * @returns Array com datas (exclui finais de semana)
 */
export function generateAvailableDates(startDate: Date, numberOfDays: number): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  let diasAdicionados = 0;
  let tentativas = 0;
  const maxTentativas = numberOfDays * 2; // Evita loop infinito

  while (diasAdicionados < numberOfDays && tentativas < maxTentativas) {
    const diaSemana = currentDate.getDay();
    
    // Adiciona apenas dias úteis (1 = Segunda a 5 = Sexta)
    if (diaSemana !== 0 && diaSemana !== 6) {
      dates.push(new Date(currentDate));
      diasAdicionados++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
    tentativas++;
  }

  return dates;
}

/**
 * Formata data por extenso em pt-BR
 * Exemplo: "segunda-feira, 28 de outubro de 2024"
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Verifica se uma data é dia útil (Segunda a Sexta)
 */
export function isDiaUtil(date: Date): boolean {
  const diaSemana = date.getDay();
  return diaSemana >= 1 && diaSemana <= 5;
}

/**
 * Verifica se uma data é hoje
 */
export function isToday(date: Date): boolean {
  const hoje = getToday();
  return dateToDBFormat(date) === dateToDBFormat(hoje);
}

/**
 * Verifica se uma data é passada
 */
export function isPast(date: Date): boolean {
  const hoje = getToday();
  return date < hoje;
}

/**
 * Verifica se uma data é futura
 */
export function isFuture(date: Date): boolean {
  const hoje = getToday();
  return date > hoje;
}
