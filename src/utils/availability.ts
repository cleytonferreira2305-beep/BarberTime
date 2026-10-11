import { DisponibilidadeRegra, Indisponibilidade, Agendamento, Servico, TimeSlot } from '../types';

/**
 * Verifica se a combinação de serviços é redundante (ex: pacote que já contém os serviços avulsos)
 */
export function checkRedundantServices(
  servicosDisponiveis: Servico[],
  selectedIds: string[],
  tentandoAdicionarId: string
): { redundante: boolean; motivo?: string } {
  const tentando = servicosDisponiveis.find((s) => s.id === tentandoAdicionarId);
  if (!tentando) return { redundante: false };

  const selecionados = servicosDisponiveis.filter((s) => selectedIds.includes(s.id));

  // 1. Se tentando adicionar um PACOTE, verificar se algum dos serviços avulsos já está selecionado
  if (tentando.is_pacote && tentando.servicos_inclusos?.length) {
    const conflitos = selecionados.filter((s) => tentando.servicos_inclusos?.includes(s.id));
    if (conflitos.length > 0) {
      return {
        redundante: true,
        motivo: `O pacote "${tentando.nome}" já inclui o serviço "${conflitos[0].nome}". Remova o avulso para selecionar o pacote.`,
      };
    }
  }

  // 2. Se tentando adicionar um AVULSO, verificar se já há um pacote selecionado que inclui este serviço
  const pacoteSelecionado = selecionados.find(
    (s) => s.is_pacote && s.servicos_inclusos?.includes(tentando.id)
  );
  if (pacoteSelecionado) {
    return {
      redundante: true,
      motivo: `O serviço "${tentando.nome}" já está incluído no pacote "${pacoteSelecionado.nome}" selecionado.`,
    };
  }

  return { redundante: false };
}

/**
 * Converte "HH:mm" para minutos desde o início do dia
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hh, mm] = timeStr.split(':').map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

/**
 * Converte minutos desde o início do dia para "HH:mm"
 */
export function minutesToTimeString(minutes: number): string {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Gera os horários possíveis para uma data considerando regras de funcionamento,
 * pausas de almoço, duração total necessária e conflitos de agendamentos existentes.
 */
export function calculateAvailableSlots(params: {
  dataEscolhida: string; // "YYYY-MM-DD"
  duracaoTotalMinutos: number;
  regrasDisponibilidade: DisponibilidadeRegra[];
  bloqueios: Indisponibilidade[];
  agendamentosExistentes: Agendamento[];
  intervaloPassoMinutos?: number; // padrão 30 minutos
}): TimeSlot[] {
  const {
    dataEscolhida,
    duracaoTotalMinutos,
    regrasDisponibilidade,
    bloqueios,
    agendamentosExistentes,
    intervaloPassoMinutos = 30,
  } = params;

  if (duracaoTotalMinutos <= 0) return [];

  // Parse da data selecionada em fuso local
  const [ano, mes, dia] = dataEscolhida.split('-').map(Number);
  const dataObj = new Date(ano, mes - 1, dia);
  const diaSemana = dataObj.getDay(); // 0 = Domingo, 1 = Segunda, etc.

  // 1. Procurar regra do dia da semana
  const regraDia = regrasDisponibilidade.find(
    (r) => r.dia_semana === diaSemana && r.ativo
  );

  if (!regraDia) {
    return []; // Profissional não atende neste dia da semana
  }

  const inicioExpediente = timeStringToMinutes(regraDia.hora_inicio);
  const fimExpediente = timeStringToMinutes(regraDia.hora_fim);

  const temPausa = Boolean(regraDia.pausa_inicio && regraDia.pausa_fim);
  const inicioPausa = temPausa ? timeStringToMinutes(regraDia.pausa_inicio!) : -1;
  const fimPausa = temPausa ? timeStringToMinutes(regraDia.pausa_fim!) : -1;

  // Filtrar agendamentos ativos na data escolhida
  const agendamentosDoDia = agendamentosExistentes.filter((ag) => {
    if (ag.status === 'cancelado' || ag.status === 'faltou') return false;
    const agDataInicio = new Date(ag.data_inicio);
    const dataAgStr = `${agDataInicio.getFullYear()}-${String(agDataInicio.getMonth() + 1).padStart(2, '0')}-${String(agDataInicio.getDate()).padStart(2, '0')}`;
    return dataAgStr === dataEscolhida;
  });

  // Filtrar bloqueios/indisponibilidades na data
  const bloqueiosDoDia = bloqueios.filter((b) => {
    const bInicio = new Date(b.data_inicio);
    const bFim = new Date(b.data_fim);
    const diaInicio = new Date(ano, mes - 1, dia, 0, 0, 0);
    const diaFim = new Date(ano, mes - 1, dia, 23, 59, 59);
    return bInicio <= diaFim && bFim >= diaInicio;
  });

  const slots: TimeSlot[] = [];

  // Agora vamos verificar a hora atual se a data escolhida for hoje
  const agora = new Date();
  const hojeStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
  const isHoje = dataEscolhida === hojeStr;
  const minutoAtualHoje = isHoje ? agora.getHours() * 60 + agora.getMinutes() + 15 : -1; // buffer de 15 min de antecedência

  // Gerar slots de acordo com intervaloPassoMinutos
  for (
    let minInicio = inicioExpediente;
    minInicio + duracaoTotalMinutos <= fimExpediente;
    minInicio += intervaloPassoMinutos
  ) {
    const minFim = minInicio + duracaoTotalMinutos;
    const horaInicioStr = minutesToTimeString(minInicio);
    const horaFimStr = minutesToTimeString(minFim);

    // 1. Se for hoje, horário precisa ser no futuro
    if (isHoje && minInicio <= minutoAtualHoje) {
      continue;
    }

    // 2. Conflito com intervalo/pausa de almoço
    if (temPausa) {
      // Slot sobrepõe pausa se minInicio < fimPausa && minFim > inicioPausa
      if (minInicio < fimPausa && minFim > inicioPausa) {
        slots.push({
          hora_inicio: horaInicioStr,
          hora_fim: horaFimStr,
          disponivel: false,
          motivo_indisponivel: 'Horário de almoço / intervalo do profissional',
        });
        continue;
      }
    }

    // 3. Conflito com agendamentos existentes (considerando minutos exatos do dia)
    let temConflitoAgendamento = false;
    for (const ag of agendamentosDoDia) {
      const dInicio = new Date(ag.data_inicio);
      const dFim = new Date(ag.data_fim);
      const agMinInicio = dInicio.getHours() * 60 + dInicio.getMinutes();
      const agMinFim = dFim.getHours() * 60 + dFim.getMinutes();

      // Sobreposição de horários: A_start < B_end && A_end > B_start
      if (minInicio < agMinFim && minFim > agMinInicio) {
        temConflitoAgendamento = true;
        break;
      }
    }

    if (temConflitoAgendamento) {
      slots.push({
        hora_inicio: horaInicioStr,
        hora_fim: horaFimStr,
        disponivel: false,
        motivo_indisponivel: 'Horário já reservado por outro cliente',
      });
      continue;
    }

    // 4. Conflito com indisponibilidades / bloqueios cadastrados
    let temBloqueio = false;
    const slotDataInicio = new Date(ano, mes - 1, dia, Math.floor(minInicio / 60), minInicio % 60);
    const slotDataFim = new Date(ano, mes - 1, dia, Math.floor(minFim / 60), minFim % 60);

    for (const b of bloqueiosDoDia) {
      const bInicio = new Date(b.data_inicio);
      const bFim = new Date(b.data_fim);
      if (slotDataInicio < bFim && slotDataFim > bInicio) {
        temBloqueio = true;
        break;
      }
    }

    if (temBloqueio) {
      slots.push({
        hora_inicio: horaInicioStr,
        hora_fim: horaFimStr,
        disponivel: false,
        motivo_indisponivel: 'Período bloqueado pelo profissional',
      });
      continue;
    }

    // Horário totalmente disponível!
    slots.push({
      hora_inicio: horaInicioStr,
      hora_fim: horaFimStr,
      disponivel: true,
    });
  }

  return slots;
}
