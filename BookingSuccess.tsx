import React from 'react';
import { Agendamento, Profissional } from '../../types';
import { formatMoney, formatDuration, formatDateTimeBr, generateWhatsAppLink } from '../../utils/formatters';
import { CheckCircle2, MessageCircle, Calendar, ArrowRight, MapPin } from 'lucide-react';

interface Props {
  agendamento: Agendamento;
  profissional: Profissional;
  onGoToMyAppointments: () => void;
  onClose: () => void;
}

export const BookingSuccess: React.FC<Props> = ({
  agendamento,
  profissional,
  onGoToMyAppointments,
  onClose,
}) => {
  const servicosTexto = agendamento.servicos.map((s) => s.nome_servico).join(' + ');

  const whatsappMsg = `Olá ${profissional.nome_publico}! Acabei de agendar pelo BarberTime:%0A%0A*Cliente:* ${agendamento.cliente_nome}%0A*Serviços:* ${servicosTexto}%0A*Data:* ${formatDateTimeBr(
    agendamento.data_inicio
  )}%0A*Valor:* ${formatMoney(agendamento.valor_total)}%0A%0APor favor, confirme meu horário!`;

  const waLink = generateWhatsAppLink(profissional.whatsapp, whatsappMsg);

  return (
    <div className="text-center space-y-6 py-4 animate-fadeIn">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
        <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
          Reserva Confirmada
        </span>
        <h3 className="text-xl font-bold text-white mt-2 font-serif-luxury">
          Horário Agendado com Sucesso!
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Sua reserva foi gravada no sistema. O profissional foi notificado do seu agendamento.
        </p>
      </div>

      {/* Ticket Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0F1420] border border-[#D4AF37]/30 text-left space-y-3.5 shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Estabelecimento
            </span>
            <h4 className="text-sm font-bold text-white">{profissional.nome_publico}</h4>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#D4AF37]" />
              {profissional.endereco}, {profissional.cidade}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total</span>
            <span className="text-base font-extrabold text-[#D4AF37]">
              {formatMoney(agendamento.valor_total)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Data e Hora</span>
            <span className="font-semibold text-white">
              {formatDateTimeBr(agendamento.data_inicio)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Duração Estimada</span>
            <span className="font-semibold text-slate-200">
              {formatDuration(agendamento.duracao_total)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400 block text-[11px] mb-1">Serviços Inclusos:</span>
          <div className="space-y-1">
            {agendamento.servicos.map((s, idx) => (
              <div key={idx} className="flex justify-between text-slate-300">
                <span>{s.nome_servico}</span>
                <span className="text-slate-400">{formatMoney(s.preco)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Protocolo: {agendamento.id.slice(-8).toUpperCase()}</span>
          <span>Status: <strong className="text-emerald-400 uppercase">Confirmado</strong></span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5 pt-2">
        {profissional.whatsapp && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#25D366] hover:bg-[#20BA5C] text-black flex items-center justify-center gap-2 transition shadow-lg shadow-[#25D366]/20"
          >
            <MessageCircle className="w-4 h-4 fill-black" />
            Avisar no WhatsApp do Profissional
          </a>
        )}

        <div className="flex gap-2">
          <button
            onClick={onGoToMyAppointments}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            Ver Minhas Reservas
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
