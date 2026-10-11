import React from 'react';
import { Servico } from '../../types';
import { formatMoney, formatDuration } from '../../utils/formatters';
import { checkRedundantServices } from '../../utils/availability';
import { Check, Plus, AlertCircle, Package } from 'lucide-react';

interface Props {
  servicos: Servico[];
  selectedIds: string[];
  onToggleService: (servicoId: string) => void;
  redundancyWarning?: string | null;
}

export const ServiceSelector: React.FC<Props> = ({
  servicos,
  selectedIds,
  onToggleService,
  redundancyWarning,
}) => {
  const activeServices = servicos.filter((s) => s.ativo);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-white flex items-center justify-between">
          <span>Selecione os Serviços</span>
          <span className="text-xs text-slate-400 font-normal">
            Você pode escolher mais de um
          </span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Combine corte, barba ou tratamentos para um único horário.
        </p>
      </div>

      {redundancyWarning && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <p>{redundancyWarning}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {activeServices.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            Nenhum serviço disponível no momento.
          </p>
        ) : (
          activeServices.map((servico) => {
            const isSelected = selectedIds.includes(servico.id);

            return (
              <div
                key={servico.id}
                onClick={() => onToggleService(servico.id)}
                className={`group relative p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#182133] border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-md shadow-[#D4AF37]/10'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white group-hover:text-[#D4AF37] transition">
                      {servico.nome}
                    </h4>
                    {servico.is_pacote && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                        <Package className="w-3 h-3" /> Pacote
                      </span>
                    )}
                  </div>
                  {servico.descricao && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {servico.descricao}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">
                      ⏱ {formatDuration(servico.duracao_minutos)}
                    </span>
                    <span className="text-[#D4AF37] font-bold">
                      {formatMoney(servico.preco)}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                    isSelected
                      ? 'bg-[#D4AF37] text-black shadow'
                      : 'bg-slate-800 text-slate-400 group-hover:text-white'
                  }`}
                >
                  {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
