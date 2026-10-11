import React, { useMemo } from 'react';
import { DisponibilidadeRegra, Indisponibilidade, Agendamento, TimeSlot } from '../../types';
import { calculateAvailableSlots } from '../../utils/availability';
import { formatDuration } from '../../utils/formatters';
import { Calendar, Clock, AlertCircle, BellRing } from 'lucide-react';

interface Props {
  dataEscolhida: string; // YYYY-MM-DD
  onSelectData: (data: string) => void;
  horarioEscolhido: string; // HH:mm
  onSelectHorario: (horario: string) => void;
  duracaoTotalMinutos: number;
  regrasDisponibilidade: DisponibilidadeRegra[];
  bloqueios: Indisponibilidade[];
  agendamentosExistentes: Agendamento[];
  onOpenWaitlist?: (data: string, horario?: string) => void;
}

export const DateTimeSelector: React.FC<Props> = ({
  dataEscolhida,
  onSelectData,
  horarioEscolhido,
  onSelectHorario,
  duracaoTotalMinutos,
  regrasDisponibilidade,
  bloqueios,
  agendamentosExistentes,
  onOpenWaitlist,
}) => {
  // Gerar os próximos 14 dias para o seletor rápido
  const proximosDias = useMemo(() => {
    const dias = [];
    const hoje = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

      const diaSemanaIndex = d.getDay();
      const diasSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      // Verificar se o profissional abre neste dia da semana
      const regra = regrasDisponibilidade.find((r) => r.dia_semana === diaSemanaIndex && r.ativo);

      dias.push({
        dataStr: isoDate,
        diaNumero: d.getDate(),
        diaSemanaNome: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : diasSemanaNomes[diaSemanaIndex],
        mesNome: d.toLocaleDateString('pt-BR', { month: 'short' }),
        aberto: Boolean(regra),
      });
    }
    return dias;
  }, [regrasDisponibilidade]);

  // Calcular slots disponíveis para a data escolhida
  const slots: TimeSlot[] = useMemo(() => {
    if (!dataEscolhida || duracaoTotalMinutos <= 0) return [];
    return calculateAvailableSlots({
      dataEscolhida,
      duracaoTotalMinutos,
      regrasDisponibilidade,
      bloqueios,
      agendamentosExistentes,
      intervaloPassoMinutos: 30,
    });
  }, [
    dataEscolhida,
    duracaoTotalMinutos,
    regrasDisponibilidade,
    bloqueios,
    agendamentosExistentes,
  ]);

  const slotsDisponiveis = slots.filter((s) => s.disponivel);

  return (
    <div className="space-y-5">
      {/* 1. Escolha de Data */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            Escolha o Dia
          </label>
          <span className="text-xs text-slate-400">
            Tempo total: <strong className="text-[#D4AF37]">{formatDuration(duracaoTotalMinutos)}</strong>
          </span>
        </div>

        {/* Scroll horizontal de dias touch-friendly */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
          {proximosDias.map((dia) => {
            const isSelected = dataEscolhida === dia.dataStr;
            const disabled = !dia.aberto;

            return (
              <button
                key={dia.dataStr}
                type="button"
                disabled={disabled}
                onClick={() => onSelectData(dia.dataStr)}
                className={`flex flex-col items-center justify-center min-w-[70px] py-2.5 px-2 rounded-xl border transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold shadow-lg shadow-[#D4AF37]/20 scale-105'
                    : disabled
                    ? 'bg-slate-900/40 border-slate-900 text-slate-600 opacity-50 cursor-not-allowed'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider">{dia.diaSemanaNome}</span>
                <span className="text-lg font-bold my-0.5">{dia.diaNumero}</span>
                <span className="text-[10px] capitalize opacity-80">{dia.mesNome}</span>
                {!dia.aberto && (
                  <span className="text-[9px] text-rose-400/80 font-medium mt-0.5">Fechado</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Escolha de Horário */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#D4AF37]" />
            Horários Disponíveis
          </label>
          <span className="text-xs text-slate-400">
            {slotsDisponiveis.length} {slotsDisponiveis.length === 1 ? 'horário' : 'horários'} livres
          </span>
        </div>

        {slots.length === 0 ? (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-300">
                Não há horários livres para este dia.
              </p>
              <p className="text-xs text-slate-500">
                A agenda pode estar cheia ou o profissional não atende nesta data.
              </p>
            </div>
            {onOpenWaitlist && (
              <button
                type="button"
                onClick={() => onOpenWaitlist(dataEscolhida)}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 transition"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Entrar na Lista de Espera deste dia</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
              {slots.map((slot) => {
                const isSelected = horarioEscolhido === slot.hora_inicio;

                if (!slot.disponivel) {
                  return (
                    <button
                      key={slot.hora_inicio}
                      type="button"
                      onClick={() => onOpenWaitlist?.(dataEscolhida, slot.hora_inicio)}
                      title="Horário ocupado. Clique para ser avisado se houver cancelamento!"
                      className="p-2 rounded-lg border border-slate-900/80 bg-slate-950/70 text-slate-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 hover:bg-slate-900/80 text-xs text-center transition flex flex-col items-center justify-center group"
                    >
                      <span className="line-through group-hover:no-underline">{slot.hora_inicio}</span>
                      <span className="text-[9px] no-underline text-slate-600 group-hover:text-[#D4AF37] flex items-center gap-0.5 mt-0.5">
                        <BellRing className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
                        Ocupado (Avisar)
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={slot.hora_inicio}
                    type="button"
                    onClick={() => onSelectHorario(slot.hora_inicio)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md shadow-[#D4AF37]/25 font-bold scale-[1.02]'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-[#D4AF37]/50 hover:bg-slate-850'
                    }`}
                  >
                    <span className="text-sm">{slot.hora_inicio}</span>
                    <span className="text-[10px] font-normal opacity-70">
                      até {slot.hora_fim}
                    </span>
                  </button>
                );
              })}
            </div>

            {onOpenWaitlist && (
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Não achou o horário ideal?
                </span>
                <button
                  type="button"
                  onClick={() => onOpenWaitlist(dataEscolhida)}
                  className="text-[11px] font-semibold text-[#D4AF37] hover:underline"
                >
                  Entrar na Lista de Espera &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
