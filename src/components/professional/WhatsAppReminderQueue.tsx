import React, { useState, useEffect } from 'react';
import {
  Profissional,
  LembreteWhatsAppItem,
  FilaLembreteConfig,
} from '../../types';
import { whatsAppReminderService } from '../../services/whatsappReminderService';
import { useToast } from '../../contexts/ToastContext';
import {
  formatDateTimeBr,
  formatMoney,
  formatWhatsApp,
} from '../../utils/formatters';
import {
  MessageSquare,
  Send,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  Calendar,
  Sparkles,
  ExternalLink,
  Trash2,
  XCircle,
  PlayCircle,
  Info,
} from 'lucide-react';

interface Props {
  profissional: Profissional;
}

export const WhatsAppReminderQueue: React.FC<Props> = ({ profissional }) => {
  const { success, error: toastError, info } = useToast();
  const [fila, setFila] = useState<LembreteWhatsAppItem[]>([]);
  const [config, setConfig] = useState<FilaLembreteConfig>(
    whatsAppReminderService.getConfig()
  );
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedItemForPreview, setSelectedItemForPreview] =
    useState<LembreteWhatsAppItem | null>(null);

  // Form de configuração
  const [templateDraft, setTemplateDraft] = useState(
    config.templateMensagemPadrao
  );
  const [autoVerificarDraft, setAutoVerificarDraft] = useState(
    config.autoVerificar
  );

  const carregarFila = () => {
    const itens = whatsAppReminderService.getFila(profissional.id);
    setFila(itens);
  };

  useEffect(() => {
    carregarFila();

    // Auto-verificação inicial para já carregar os agendamentos de amanhã se a fila estiver vazia
    whatsAppReminderService
      .verificarAgendamentosDiaSeguinte(profissional.id)
      .then((res) => {
        carregarFila();
      });

    const handleAtualizacao = () => {
      carregarFila();
    };

    window.addEventListener(
      'barbertime_fila_lembretes_atualizada',
      handleAtualizacao
    );
    return () => {
      window.removeEventListener(
        'barbertime_fila_lembretes_atualizada',
        handleAtualizacao
      );
    };
  }, [profissional.id]);

  const handleVerificarAmanha = async () => {
    setIsVerifying(true);
    try {
      const res = await whatsAppReminderService.verificarAgendamentosDiaSeguinte(
        profissional.id
      );
      carregarFila();
      if (res.enfileirados > 0) {
        success(
          'Fila Atualizada!',
          `${res.enfileirados} lembrete(s) do dia seguinte foram adicionados à fila de disparo.`
        );
      } else if (res.totalAgendamentosAmanha === 0) {
        info(
          'Agenda Livre',
          'Nenhum agendamento confirmado para o dia seguinte até o momento.'
        );
      } else {
        info(
          'Fila em dia',
          `Todos os ${res.totalAgendamentosAmanha} agendamento(s) de amanhã já estão na fila ou foram notificados.`
        );
      }
    } catch {
      toastError('Erro', 'Não foi possível verificar os agendamentos.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDispararIndividual = async (item: LembreteWhatsAppItem) => {
    try {
      const res = await whatsAppReminderService.dispararLembrete(item.id);
      if (res) {
        carregarFila();
        success(
          'WhatsApp Acionado!',
          `Mensagem de lembrete aberta para envio a ${item.cliente_nome}.`
        );
      }
    } catch {
      toastError('Erro', 'Falha ao disparar o WhatsApp.');
    }
  };

  const handleDispararTodos = async () => {
    const pendentes = fila.filter((f) => f.status === 'pendente');
    if (pendentes.length === 0) {
      info('Nenhum pendente', 'Não há lembretes pendentes na fila para enviar.');
      return;
    }

    setIsBatchSending(true);
    try {
      const res = await whatsAppReminderService.processarFilaPendente(
        profissional.id
      );
      carregarFila();
      success(
        'Processamento Concluído',
        `${res.sucessos} lembrete(s) disparado(s) com sucesso.`
      );
    } catch {
      toastError('Erro', 'Ocorreu um problema durante o disparo em lote.');
    } finally {
      setIsBatchSending(false);
    }
  };

  const handleCancelarItem = (id: string) => {
    whatsAppReminderService.cancelarLembrete(id);
    carregarFila();
    info('Lembrete Cancelado', 'O item foi marcado como cancelado na fila.');
  };

  const handleLimparConcluidos = () => {
    whatsAppReminderService.limparFilaConcluida(profissional.id);
    carregarFila();
    success('Fila Limpa', 'Histórico de lembretes enviados ou cancelados foi limpo.');
  };

  const handleSalvarConfig = () => {
    const novaCfg = whatsAppReminderService.saveConfig({
      templateMensagemPadrao: templateDraft,
      autoVerificar: autoVerificarDraft,
    });
    setConfig(novaCfg);
    setShowConfigModal(false);
    success('Configurações Salvas', 'Modelo de mensagem e fila atualizados com sucesso.');
  };

  const pendentesCount = fila.filter((f) => f.status === 'pendente').length;
  const enviadosCount = fila.filter((f) => f.status === 'enviado').length;

  return (
    <div className="space-y-6">
      {/* Header com resumo da fila */}
      <div className="p-6 rounded-3xl bg-[#0F1420] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-serif-luxury">
                Lembretes Automáticos via WhatsApp
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fila inteligente de disparo para clientes com agendamento no dia seguinte
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleVerificarAmanha}
            disabled={isVerifying}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition disabled:opacity-50"
            title="Verificar agendamentos do dia seguinte"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verificar Dia Seguinte</span>
          </button>

          <button
            type="button"
            onClick={handleDispararTodos}
            disabled={isBatchSending || pendentesCount === 0}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-black bg-[#D4AF37] hover:bg-[#E5C07B] flex items-center gap-2 transition shadow-md shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isBatchSending ? 'Enviando...' : `Disparar Todos (${pendentesCount})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition"
            title="Configurar modelo de mensagem"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0F1420] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Fila Pendente</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{pendentesCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Aguardando disparo</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F1420] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Enviados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{enviadosCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Notificados pelo WhatsApp</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F1420] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Monitoramento Automático</span>
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-sm font-semibold text-slate-200 mt-1 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                config.autoVerificar ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            {config.autoVerificar ? 'Ativo (Dia Seguinte / D+1)' : 'Manual'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Verifica reservas de amanhã a cada 5 min
          </p>
        </div>
      </div>

      {/* Tabela de Fila de Lembretes */}
      <div className="rounded-3xl bg-[#0F1420] border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm">
              Agendamentos na Fila ({fila.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Alvo: {whatsAppReminderService.getDataDiaSeguinte().dataStr} (Amanhã)
            </span>
          </div>

          {fila.length > 0 && (
            <button
              type="button"
              onClick={handleLimparConcluidos}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Concluídos</span>
            </button>
          )}
        </div>

        {fila.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-slate-300 font-semibold text-sm">
              Nenhum lembrete na fila
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Clique em <strong>"Verificar Dia Seguinte"</strong> para buscar os
              agendamentos de amanhã e gerar as mensagens automaticamente.
            </p>
            <button
              type="button"
              onClick={handleVerificarAmanha}
              className="mt-2 py-2 px-4 rounded-xl text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verificar Agora</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141A28] text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Cliente / WhatsApp</th>
                  <th className="py-3 px-4">Horário de Amanhã</th>
                  <th className="py-3 px-4">Serviço(s)</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {fila.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === 'enviado' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Enviado
                        </span>
                      )}
                      {item.status === 'pendente' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                      {item.status === 'cancelado' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-400 border border-slate-700">
                          <XCircle className="w-3 h-3" />
                          Cancelado
                        </span>
                      )}
                      {item.status === 'falha' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <AlertCircle className="w-3 h-3" />
                          Falha
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{item.cliente_nome}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {formatWhatsApp(item.cliente_whatsapp)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-200 font-medium">
                        {formatDateTimeBr(item.data_agendamento)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-300">
                      {item.servicos_nomes}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#D4AF37]">
                      {formatMoney(item.valor_total)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedItemForPreview(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Visualizar Mensagem"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>

                        {item.status !== 'enviado' ? (
                          <button
                            type="button"
                            onClick={() => handleDispararIndividual(item)}
                            className="py-1 px-2.5 rounded-lg text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center gap-1.5 transition"
                          >
                            <Send className="w-3 h-3" />
                            <span>Enviar</span>
                          </button>
                        ) : (
                          <a
                            href={item.link_whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1 px-2.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 flex items-center gap-1.5 transition"
                            title="Reenviar pelo WhatsApp"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Reenviar</span>
                          </a>
                        )}

                        {item.status === 'pendente' && (
                          <button
                            type="button"
                            onClick={() => handleCancelarItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Cancelar da fila"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Prévia da Mensagem */}
      {selectedItemForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F1420] border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  Prévia do Lembrete
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForPreview(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-400">
                Destinatário: <strong className="text-white">{selectedItemForPreview.cliente_nome}</strong> ({formatWhatsApp(selectedItemForPreview.cliente_whatsapp)})
              </p>
              <div className="p-4 rounded-2xl bg-[#141A28] border border-slate-800 text-slate-200 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                {selectedItemForPreview.mensagem_texto}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedItemForPreview(null)}
                className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 transition"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDispararIndividual(selectedItemForPreview);
                  setSelectedItemForPreview(null);
                }}
                className="py-2 px-4 rounded-xl text-xs font-bold text-black bg-[#D4AF37] hover:bg-[#E5C07B] flex items-center gap-2 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar pelo WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração do Template */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F1420] border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-bold text-white text-base">
                  Configuração de Lembretes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoVerificarDraft}
                    onChange={(e) => setAutoVerificarDraft(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-[#D4AF37] focus:ring-0 focus:ring-offset-0 bg-slate-900"
                  />
                  <span>
                    Ativar verificação automática para o dia seguinte (D+1)
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 ml-6 mt-0.5">
                  Identifica novos agendamentos confirmados para amanhã e adiciona automaticamente à fila.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">
                  Modelo da Mensagem (WhatsApp)
                </label>
                <textarea
                  rows={6}
                  value={templateDraft}
                  onChange={(e) => setTemplateDraft(e.target.value)}
                  className="w-full bg-[#141A28] border border-slate-700 rounded-2xl p-3 text-slate-200 text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <p className="text-[11px] text-slate-400">
                  Variáveis suportadas: <code className="text-[#D4AF37]">{'{cliente_nome}'}</code>,{' '}
                  <code className="text-[#D4AF37]">{'{profissional_nome}'}</code>,{' '}
                  <code className="text-[#D4AF37]">{'{data}'}</code>,{' '}
                  <code className="text-[#D4AF37]">{'{horario}'}</code>,{' '}
                  <code className="text-[#D4AF37]">{'{servicos}'}</code>,{' '}
                  <code className="text-[#D4AF37]">{'{valor}'}</code>
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarConfig}
                className="py-2.5 px-5 rounded-xl text-xs font-bold text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition shadow-md shadow-[#D4AF37]/20"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
