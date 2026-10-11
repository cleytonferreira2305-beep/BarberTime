import React, { useState, useEffect, useMemo } from 'react';
import { Profissional, Agendamento, Servico, StatusAgendamento } from '../../types';
import { db } from '../../services/db';
import { useToast } from '../../contexts/ToastContext';
import {
  formatMoney,
  formatDuration,
  formatTimeOnly,
  formatDateTimeBr,
  formatWhatsApp,
  generateWhatsAppLink,
} from '../../utils/formatters';
import {
  Calendar,
  Clock,
  TrendingUp,
  Scissors,
  Check,
  CheckCheck,
  X,
  MessageCircle,
  UserX,
  ArrowRight,
  BarChart3,
  DollarSign,
  Activity,
  Copy,
  Share2,
  ExternalLink,
  QrCode,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ShareProfileModal } from '../ui/ShareProfileModal';
import { getProfileShareLinks } from '../../utils/shareUtils';

interface Props {
  profissional: Profissional;
  onGoToAgenda: () => void;
  onGoToServicos: () => void;
  onGoToLembretes?: () => void;
}

export const ProfessionalDashboard: React.FC<Props> = ({
  profissional,
  onGoToAgenda,
  onGoToServicos,
  onGoToLembretes,
}) => {
  const { success, error: toastError } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'recent' | 'upcoming'>('recent');
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const shareLinks = useMemo(() => getProfileShareLinks(profissional), [profissional]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLinks.fullUrl);
    setCopiedLink(true);
    success('Link Copiado!', 'O link da sua página de agendamento foi copiado para a área de transferência.');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    const [ags, srvs] = await Promise.all([
      db.getAgendamentosByProfissional(profissional.id),
      db.getServicosByProfissional(profissional.id),
    ]);
    setAgendamentos(ags);
    setServicos(srvs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profissional.id]);

  const handleUpdateStatus = async (agendamentoId: string, novoStatus: StatusAgendamento) => {
    try {
      const updated = await db.atualizarStatusAgendamento(agendamentoId, novoStatus);
      if (updated) {
        success('Status Atualizado', `Agendamento marcado como ${novoStatus}.`);
        setAgendamentos((prev) => prev.map((a) => (a.id === agendamentoId ? updated : a)));
      }
    } catch {
      toastError('Erro', 'Não foi possível atualizar o status.');
    }
  };

  // Filtragens para métricas reais do banco
  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(
    hoje.getDate()
  ).padStart(2, '0')}`;

  const agendamentosHoje = agendamentos.filter((a) => {
    const d = new Date(a.data_inicio);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    return dStr === hojeStr && a.status !== 'cancelado';
  });

  const faturamentoHoje = agendamentosHoje.reduce((acc, a) => acc + a.valor_total, 0);

  const proximos7Dias = agendamentos.filter((a) => {
    const d = new Date(a.data_inicio);
    const agora = new Date();
    const seteDiasDepois = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);
    return d >= agora && d <= seteDiasDepois && a.status !== 'cancelado';
  });

  const servicosAtivos = servicos.filter((s) => s.ativo).length;

  // Preparação de dados diários para o gráfico com Recharts
  const chartData = useMemo(() => {
    const daysCount = 7;
    const result = [];
    const baseDate = new Date();

    const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = daysCount - 1; i >= 0; i--) {
      const targetDate = new Date(baseDate);
      if (chartPeriod === 'recent') {
        // Últimos 7 dias (incluindo hoje)
        targetDate.setDate(baseDate.getDate() - i);
      } else {
        // Próximos 7 dias (a partir de hoje)
        targetDate.setDate(baseDate.getDate() + (daysCount - 1 - i));
      }

      const isoDay = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(
        targetDate.getDate()
      ).padStart(2, '0')}`;

      const dayAppointments = agendamentos.filter((a) => {
        if (a.status === 'cancelado') return false;
        const aDate = new Date(a.data_inicio);
        const aIso = `${aDate.getFullYear()}-${String(aDate.getMonth() + 1).padStart(2, '0')}-${String(
          aDate.getDate()
        ).padStart(2, '0')}`;
        return aIso === isoDay;
      });

      const receitaDia = dayAppointments.reduce((acc, a) => acc + a.valor_total, 0);
      const volumeDia = dayAppointments.length;
      const diaSemanaLabel = diasNomes[targetDate.getDay()];
      const dataLabel = `${diaSemanaLabel} ${String(targetDate.getDate()).padStart(2, '0')}/${String(
        targetDate.getMonth() + 1
      ).padStart(2, '0')}`;

      result.push({
        date: dataLabel,
        isoDate: isoDay,
        receita: receitaDia,
        volume: volumeDia,
        ticketMedio: volumeDia > 0 ? Math.round(receitaDia / volumeDia) : 0,
      });
    }

    return result;
  }, [agendamentos, chartPeriod]);

  const totalPeriodoReceita = chartData.reduce((acc, d) => acc + d.receita, 0);
  const totalPeriodoVolume = chartData.reduce((acc, d) => acc + d.volume, 0);
  const ticketMedioGeral = totalPeriodoVolume > 0 ? totalPeriodoReceita / totalPeriodoVolume : 0;

  // Custom Dark Gold Tooltip para o Recharts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0F1420] border border-[#D4AF37]/50 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
          <p className="font-bold text-white border-b border-slate-800 pb-1">{label}</p>
          <div className="flex items-center justify-between gap-4 text-amber-300">
            <span>Faturamento:</span>
            <span className="font-extrabold text-[#D4AF37]">{formatMoney(data.receita)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-300">
            <span>Atendimentos:</span>
            <span className="font-bold text-emerald-400">{data.volume}</span>
          </div>
          {data.volume > 0 && (
            <div className="flex items-center justify-between gap-4 text-slate-400 pt-0.5 border-t border-slate-800/80">
              <span>Ticket Médio:</span>
              <span className="text-slate-200">{formatMoney(data.ticketMedio)}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Shareable Booking Link Banner (Priority 1 Acquisition) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#171207] via-[#21180A] to-[#120F08] border border-[#D4AF37]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              Link Público & Divulgação
            </span>
          </div>
          <p className="text-xs text-white font-semibold">
            Divulgue seu link na bio do Instagram ou envie para clientes no WhatsApp:
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs font-mono text-[#D4AF37] bg-black/40 px-3 py-1 rounded-lg border border-[#D4AF37]/20 break-all inline-block">
              {shareLinks.displayShortUrl}
            </p>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              (redireciona para sua agenda)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition flex items-center gap-1.5 shadow-md shadow-[#D4AF37]/20"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
          </button>

          <a
            href={shareLinks.whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Compartilhar no WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Mais opções de divulgação e QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Bio & QR Code</span>
          </button>

          {onGoToLembretes && (
            <button
              type="button"
              onClick={onGoToLembretes}
              className="py-2.5 px-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Acessar Fila de Lembretes WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Lembretes (D+1)</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-[#0F1420] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Agendamentos Hoje</span>
            <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{agendamentosHoje.length}</div>
          <p className="text-[11px] text-slate-500">Horários marcados para hoje</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-[#0F1420] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Previsão Hoje</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {formatMoney(faturamentoHoje)}
          </div>
          <p className="text-[11px] text-slate-500">Soma dos atendimentos do dia</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-[#0F1420] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Próximos 7 Dias</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{proximos7Dias.length}</div>
          <p className="text-[11px] text-slate-500">Reservas na semana</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-[#0F1420] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Serviços Ativos</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{servicosAtivos}</div>
          <p className="text-[11px] text-slate-500">Opções no catálogo</p>
        </div>
      </div>

      {/* Statistics Widget: Daily Revenue & Appointment Volume using Recharts */}
      <div className="p-6 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white font-serif-luxury">
                Estatísticas: Faturamento & Volume de Agendamentos
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhamento da receita diária (R$) e número de atendimentos baseado nas reservas
            </p>
          </div>

          {/* Period Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setChartPeriod('recent')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                chartPeriod === 'recent'
                  ? 'bg-[#D4AF37] text-black shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => setChartPeriod('upcoming')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                chartPeriod === 'upcoming'
                  ? 'bg-[#D4AF37] text-black shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Próximos 7 dias
            </button>
          </div>
        </div>

        {/* Summary Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Receita do Período
              </span>
              <p className="text-lg font-extrabold text-[#D4AF37]">
                {formatMoney(totalPeriodoReceita)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total de Agendamentos
              </span>
              <p className="text-lg font-extrabold text-emerald-400">
                {totalPeriodoVolume} {totalPeriodoVolume === 1 ? 'cliente' : 'clientes'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Ticket Médio
              </span>
              <p className="text-lg font-extrabold text-slate-200">
                {formatMoney(ticketMedioGeral)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Recharts Chart Visualization */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              {/* Left axis: Receita R$ */}
              <YAxis
                yAxisId="left"
                stroke="#D4AF37"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) => `R$${val}`}
              />
              {/* Right axis: Qtd Agendamentos */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10B981"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                formatter={(value) => {
                  if (value === 'receita') return <span className="text-slate-300">Receita Diária (R$)</span>;
                  if (value === 'volume') return <span className="text-slate-300">Volume de Atendimentos</span>;
                  return value;
                }}
              />
              {/* Bars for daily revenue */}
              <Bar
                yAxisId="left"
                dataKey="receita"
                name="receita"
                fill="#D4AF37"
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
              />
              {/* Line for daily appointment volume */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="volume"
                name="volume"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10B981', stroke: '#0B0F17', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#34D399', stroke: '#fff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's Appointments Section */}
      <div className="p-6 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-serif-luxury">
              Atendimentos de Hoje ({agendamentosHoje.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhe a fila do dia e atualize os estados de atendimento
            </p>
          </div>
          <button
            onClick={onGoToAgenda}
            className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
          >
            <span>Ver agenda completa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-28 bg-slate-900/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : agendamentosHoje.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">Nenhum atendimento agendado para hoje.</p>
            <p className="text-xs text-slate-500">
              Compartilhe seu link público de agendamento para receber reservas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {agendamentosHoje.map((ag) => {
              const waLink = generateWhatsAppLink(
                ag.cliente_whatsapp,
                `Olá ${ag.cliente_nome}! Confirmando seu horário hoje às ${formatTimeOnly(
                  ag.data_inicio
                )} na ${profissional.nome_publico}.`
              );

              return (
                <div
                  key={ag.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#D4AF37]">
                        {formatTimeOnly(ag.data_inicio)} - {formatTimeOnly(ag.data_fim)}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({formatDuration(ag.duracao_total)})
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          ag.status === 'concluido'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : ag.status === 'confirmado'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : ag.status === 'cancelado'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {ag.status}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white">
                      {ag.cliente_nome} &bull;{' '}
                      <span className="text-xs font-normal text-slate-400">
                        {formatWhatsApp(ag.cliente_whatsapp)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap gap-2">
                      <span>
                        Serviços: {ag.servicos.map((s) => s.nome_servico).join(', ')}
                      </span>
                      <span>&bull;</span>
                      <span className="text-[#D4AF37] font-semibold">
                        {formatMoney(ag.valor_total)}
                      </span>
                    </div>

                    {ag.observacao && (
                      <p className="text-[11px] text-slate-500 italic">
                        Obs: {ag.observacao}
                      </p>
                    )}
                  </div>

                  {/* Quick actions for professional */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-xs font-semibold flex items-center gap-1 border border-[#25D366]/30 transition"
                      title="Enviar WhatsApp ao cliente"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>

                    {ag.status !== 'concluido' && ag.status !== 'cancelado' && (
                      <button
                        onClick={() => handleUpdateStatus(ag.id, 'concluido')}
                        className="p-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-semibold flex items-center gap-1 border border-blue-500/30 transition"
                        title="Marcar como Concluído"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Concluir</span>
                      </button>
                    )}

                    {ag.status !== 'cancelado' && ag.status !== 'concluido' && (
                      <button
                        onClick={() => handleUpdateStatus(ag.id, 'cancelado')}
                        className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-semibold flex items-center gap-1 border border-rose-500/30 transition"
                        title="Cancelar Horário"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Compartilhamento & Divulgação */}
      <ShareProfileModal
        profissional={profissional}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
};

