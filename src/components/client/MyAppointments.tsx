import React, { useState, useEffect } from 'react';
import { Agendamento, Profissional } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  formatMoney,
  formatDuration,
  formatDateTimeBr,
  formatWhatsApp,
  generateWhatsAppLink,
} from '../../utils/formatters';
import {
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  XCircle,
  CheckCircle,
  AlertCircle,
  Search,
  ArrowRight,
  Star,
  RefreshCw,
  X,
  Send,
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, params?: any) => void;
  onReagendar?: (prof: Profissional, initialServiceId?: string) => void;
}

export const MyAppointments: React.FC<Props> = ({ onNavigate, onReagendar }) => {
  const { user, perfil } = useAuth();
  const { success, error: toastError } = useToast();

  const [whatsappSearch, setWhatsappSearch] = useState(() => (perfil?.telefone ? formatWhatsApp(perfil.telefone) : ''));
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Modal de Avaliação
  const [evaluatingAg, setEvaluatingAg] = useState<Agendamento | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchAgendamentos = async (phoneToUse?: string) => {
    setLoading(true);
    const ags = await db.getAgendamentosByCliente({
      clienteId: user?.id,
      whatsapp: phoneToUse || whatsappSearch,
    });
    setAgendamentos(ags);
    setLoading(false);
  };

  useEffect(() => {
    fetchAgendamentos();
  }, [user]);

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setWhatsappSearch(formatWhatsApp(raw));
  };

  const handleSearchByPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = whatsappSearch.replace(/\D/g, '');
    if (clean.length < 10) {
      toastError('Número Inválido', 'Digite o DDD e o número completo (pelo menos 10 dígitos) para consultar suas reservas com segurança.');
      return;
    }
    fetchAgendamentos(clean);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este agendamento? O horário será liberado.')) {
      return;
    }

    setCancellingId(id);
    try {
      const updated = await db.atualizarStatusAgendamento(
        id,
        'cancelado',
        'Cancelado pelo próprio cliente'
      );
      if (updated) {
        success('Agendamento Cancelado', 'Sua reserva foi cancelada e o horário liberado.');
        setAgendamentos((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    } catch {
      toastError('Erro', 'Não foi possível cancelar o agendamento.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenReschedule = async (ag: Agendamento) => {
    const prof = await db.getProfissionalById(ag.profissional_id);
    if (!prof) {
      toastError('Profissional não encontrado', 'Não foi possível carregar os dados deste profissional.');
      return;
    }
    if (onReagendar) {
      const firstServiceId = ag.servicos[0]?.servico_id;
      onReagendar(prof, firstServiceId);
    } else {
      onNavigate('professional-profile', { slug: prof.slug });
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingAg) return;

    setSubmittingRating(true);
    try {
      const res = await db.avaliarAgendamento(evaluatingAg.id, ratingStars, ratingComment);
      if (res.success) {
        success('Avaliação Registrada', res.message);
        setAgendamentos((prev) =>
          prev.map((a) =>
            a.id === evaluatingAg.id
              ? { ...a, avaliacao_nota: ratingStars, avaliacao_comentario: ratingComment }
              : a
          )
        );
        setEvaluatingAg(null);
        setRatingComment('');
      } else {
        toastError('Não foi possível avaliar', res.message);
      }
    } catch {
      toastError('Erro', 'Falha ao registrar avaliação.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" /> Confirmado
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" /> Pendente
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Concluído
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Cancelado
          </span>
        );
      case 'faltou':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300">
            Não compareceu
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-white font-serif-luxury">
          Meus Agendamentos
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Acompanhe suas reservas, detalhes de serviços ou cancele se necessário.
        </p>
      </div>

      {/* Busca rápida por telefone se o usuário não estiver logado ou quiser buscar de outro número */}
      <div className="p-4 rounded-2xl bg-[#0F1420] border border-slate-800 space-y-2">
        <label className="block text-xs font-semibold text-slate-300">
          Consultar por WhatsApp / Telefone
        </label>
        <form onSubmit={handleSearchByPhone} className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="tel"
              placeholder="(11) 98765-4321"
              value={whatsappSearch}
              onChange={handlePhoneInputChange}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition"
            />
          </div>
          <button
            type="submit"
            className="py-2 px-5 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Consultar</span>
          </button>
        </form>
        <p className="text-[11px] text-slate-500">
          Privacidade garantida: consulta exata pelo número de WhatsApp completo informado na reserva.
        </p>
      </div>

      {/* Lista de agendamentos */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não encontramos reservas para os dados informados. Que tal agendar um novo horário agora?
          </p>
          <button
            onClick={() => onNavigate('search')}
            className="py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition inline-flex items-center gap-2"
          >
            <span>Buscar Profissionais</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {agendamentos.map((ag) => {
            const isCancelado = ag.status === 'cancelado' || ag.status === 'faltou';
            const isPassado = new Date(ag.data_fim) < new Date();

            const waLink = ag.profissional_whatsapp
              ? generateWhatsAppLink(
                  ag.profissional_whatsapp,
                  `Olá! Sou ${ag.cliente_nome}, gostaria de tirar uma dúvida sobre o agendamento de ${formatDateTimeBr(
                    ag.data_inicio
                  )}.`
                )
              : null;

            return (
              <div
                key={ag.id}
                className="p-5 rounded-2xl bg-[#0F1420] border border-slate-800 space-y-4 shadow-lg transition"
              >
                {/* Header card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {ag.profissional_nome || 'Profissional'}
                      </h3>
                      {getStatusBadge(ag.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Protocolo: #{ag.id.slice(-8).toUpperCase()} &bull; Em nome de{' '}
                      <strong className="text-slate-300">{ag.cliente_nome}</strong>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase text-slate-400 tracking-wider block">
                      Total
                    </span>
                    <span className="text-lg font-extrabold text-[#D4AF37]">
                      {formatMoney(ag.valor_total)}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-[#D4AF37]" />
                      <span className="font-semibold text-white">
                        {formatDateTimeBr(ag.data_inicio)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 pl-6">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Duração total: {formatDuration(ag.duracao_total)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block font-medium">Serviços Inclusos:</span>
                    <div className="space-y-0.5">
                      {ag.servicos.map((s, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>&bull; {s.nome_servico}</span>
                          <span className="text-slate-400">
                            {formatMoney(s.preco)} ({s.duracao_minutos}m)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {ag.observacao && (
                  <p className="text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-slate-400">
                    <strong className="text-slate-300">Observações:</strong> {ag.observacao}
                  </p>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>WhatsApp cadastrado: {formatWhatsApp(ag.cliente_whatsapp)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botão de Avaliação para Atendimentos Concluídos */}
                    {ag.status === 'concluido' && (
                      <>
                        {ag.avaliacao_nota ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>Avaliado: {ag.avaliacao_nota}/5</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setEvaluatingAg(ag);
                              setRatingStars(5);
                              setRatingComment('');
                            }}
                            className="py-1.5 px-3 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>Avaliar Atendimento</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Botão Reagendar */}
                    <button
                      onClick={() => handleOpenReschedule(ag)}
                      className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
                      title="Agendar novo horário com este profissional"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Reagendar</span>
                    </button>

                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-xs font-semibold flex items-center gap-1.5 transition border border-[#25D366]/30"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Falar com o Profissional</span>
                      </a>
                    )}

                    {!isCancelado && !isPassado && (
                      <button
                        onClick={() => handleCancel(ag.id)}
                        disabled={cancellingId === ag.id}
                        className="py-1.5 px-3 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/40 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{cancellingId === ag.id ? 'Cancelando...' : 'Cancelar Reserva'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Avaliação de Atendimento Concluído */}
      {evaluatingAg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0F1420] border border-[#D4AF37]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 bg-[#0B0F17] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-serif-luxury flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                  Avaliar Atendimento
                </h3>
                <p className="text-[11px] text-slate-400">
                  {evaluatingAg.profissional_nome} &bull; {formatDateTimeBr(evaluatingAg.data_inicio)}
                </p>
              </div>
              <button
                onClick={() => setEvaluatingAg(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRating} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-2 text-center">
                  Como foi sua experiência no atendimento?
                </label>
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="p-1 text-2xl transition hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= ratingStars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700 hover:text-slate-500'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-slate-400 font-medium mt-1">
                  {ratingStars === 5 && 'Excelente! Superou expectativas.'}
                  {ratingStars === 4 && 'Muito bom! Recomendo.'}
                  {ratingStars === 3 && 'Bom atendimento.'}
                  {ratingStars === 2 && 'Poderia ter sido melhor.'}
                  {ratingStars === 1 && 'Experiência insatisfatória.'}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Comentário ou feedback (opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Conte o que achou do corte, pontualidade e ambiente..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEvaluatingAg(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] disabled:opacity-50 transition flex items-center gap-1.5 shadow-md shadow-[#D4AF37]/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingRating ? 'Salvando...' : 'Enviar Avaliação'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
