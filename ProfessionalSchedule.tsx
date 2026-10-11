import React, { useState, useEffect } from 'react';
import { Profissional, Agendamento, StatusAgendamento } from '../../types';
import { db } from '../../services/db';
import { useToast } from '../../contexts/ToastContext';
import {
  formatMoney,
  formatDuration,
  formatDateTimeBr,
  formatDateBr,
  formatWhatsApp,
  generateWhatsAppLink,
} from '../../utils/formatters';
import {
  Calendar,
  Clock,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  Phone,
  User,
  CheckCheck,
  UserX,
  FileText,
} from 'lucide-react';

interface Props {
  profissional: Profissional;
}

export const ProfessionalSchedule: React.FC<Props> = ({ profissional }) => {
  const { success, error: toastError } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);

  const fetchAgendamentos = async () => {
    setLoading(true);
    const list = await db.getAgendamentosByProfissional(profissional.id);
    setAgendamentos(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchAgendamentos();
  }, [profissional.id]);

  const handleUpdateStatus = async (agendamentoId: string, novoStatus: StatusAgendamento) => {
    try {
      const updated = await db.atualizarStatusAgendamento(agendamentoId, novoStatus);
      if (updated) {
        success('Status Atualizado', `Agendamento alterado para "${novoStatus}".`);
        setAgendamentos((prev) => prev.map((a) => (a.id === agendamentoId ? updated : a)));
        if (selectedAgendamento?.id === agendamentoId) {
          setSelectedAgendamento(updated);
        }
      }
    } catch {
      toastError('Erro', 'Não foi possível atualizar o status do agendamento.');
    }
  };

  // Aplicar filtros
  const filteredList = agendamentos.filter((a) => {
    if (statusFilter !== 'todos' && a.status !== statusFilter) return false;
    if (dateFilter) {
      const d = new Date(a.data_inicio);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (dStr !== dateFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="p-4 rounded-2xl bg-[#0F1420] border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#D4AF37]" /> Status:
          </span>
          {['todos', 'confirmado', 'concluido', 'cancelado', 'faltou'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? 'bg-[#D4AF37] text-black shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Data específica:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-slate-400">
            {dateFilter || statusFilter !== 'todos'
              ? 'Tente ajustar os filtros selecionados acima.'
              : 'Nenhum agendamento cadastrado no momento.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((ag) => {
            const waLink = generateWhatsAppLink(
              ag.cliente_whatsapp,
              `Olá ${ag.cliente_nome}! Aqui é da ${profissional.nome_publico}. Entrando em contato sobre seu agendamento de ${formatDateTimeBr(
                ag.data_inicio
              )}.`
            );

            return (
              <div
                key={ag.id}
                className="p-5 rounded-2xl bg-[#0F1420] border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-bold text-white">
                      {formatDateTimeBr(ag.data_inicio)}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({formatDuration(ag.duracao_total)})
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                        ag.status === 'confirmado'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : ag.status === 'concluido'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : ag.status === 'cancelado'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {ag.status}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>{ag.cliente_nome}</span>
                    <span className="text-xs font-normal text-slate-400">
                      ({formatWhatsApp(ag.cliente_whatsapp)})
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <span className="text-slate-400">Serviços:</span>{' '}
                    {ag.servicos.map((s) => s.nome_servico).join(' + ')}{' '}
                    <span className="text-[#D4AF37] font-bold ml-1">
                      ({formatMoney(ag.valor_total)})
                    </span>
                  </div>

                  {ag.observacao && (
                    <p className="text-xs text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-900 inline-block">
                      Obs: {ag.observacao}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-xs font-semibold flex items-center gap-1.5 border border-[#25D366]/30 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>

                  {ag.status === 'confirmado' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(ag.id, 'concluido')}
                        className="py-2 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-semibold flex items-center gap-1.5 border border-blue-500/30 transition"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Concluir</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(ag.id, 'faltou')}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <UserX className="w-4 h-4" />
                        <span>Faltou</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(ag.id, 'cancelado')}
                        className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-semibold flex items-center gap-1.5 border border-rose-500/30 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancelar</span>
                      </button>
                    </>
                  )}

                  {ag.status === 'cancelado' && (
                    <button
                      onClick={() => handleUpdateStatus(ag.id, 'confirmado')}
                      className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Reativar Horário</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
