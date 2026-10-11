import React, { useState, useEffect } from 'react';
import { Profissional, ListaEsperaItem, StatusListaEspera, Servico, Agendamento } from '../../types';
import { waitlistService } from '../../services/waitlistService';
import { db } from '../../services/db';
import { useToast } from '../../contexts/ToastContext';
import {
  formatDateBr,
  formatWhatsApp,
  formatTimeOnly,
  generateWhatsAppLink,
} from '../../utils/formatters';
import {
  BellRing,
  Users,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Calendar,
  Phone,
  User,
  Scissors,
  CheckCheck,
  Zap,
  ExternalLink,
  X,
  Eye,
} from 'lucide-react';

interface Props {
  profissional: Profissional;
}

export const WaitlistManager: React.FC<Props> = ({ profissional }) => {
  const { success, error: toastError, info } = useToast();

  const [items, setItems] = useState<ListaEsperaItem[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusListaEspera>('aguardando');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<ListaEsperaItem | null>(null);

  // Form de adição manual
  const [novoNome, setNovoNome] = useState('');
  const [novoWhatsapp, setNovoWhatsapp] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novoHorario, setNovoHorario] = useState('qualquer');
  const [novoServicoId, setNovoServicoId] = useState('');
  const [novaObs, setNovaObs] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  // Carregar dados
  const loadData = async () => {
    setLoading(true);
    try {
      const [lista, srvs, ags] = await Promise.all([
        waitlistService.getLista(profissional.id),
        db.getServicosByProfissional(profissional.id),
        db.getAgendamentosByProfissional(profissional.id),
      ]);
      setItems(lista);
      setServicos(srvs);
      setAgendamentos(ags);
    } catch {
      toastError('Erro', 'Não foi possível carregar a lista de espera.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Ouvir atualizações automáticas
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('barbertime_lista_espera_atualizada', handleUpdate);
    return () => {
      window.removeEventListener('barbertime_lista_espera_atualizada', handleUpdate);
    };
  }, [profissional.id]);

  // Contadores
  const totalAguardando = items.filter((i) => i.status === 'aguardando').length;
  const totalNotificados = items.filter((i) => i.status === 'notificado').length;
  const totalAgendados = items.filter((i) => i.status === 'agendado').length;

  // Filtragem
  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'todos' && item.status !== statusFilter) return false;

    if (dateFilter && item.data_desejada !== dateFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchNome = item.cliente_nome.toLowerCase().includes(term);
      const matchPhone = item.cliente_whatsapp.includes(term.replace(/\D/g, ''));
      const matchServico = item.servico_nome?.toLowerCase().includes(term);
      if (!matchNome && !matchPhone && !matchServico) return false;
    }

    return true;
  });

  // Ações de gerenciamento
  const handleRemover = async (id: string, nomeCliente: string) => {
    if (!confirm(`Deseja remover ${nomeCliente} da lista de espera?`)) return;

    const ok = await waitlistService.remover(id);
    if (ok) {
      success('Removido', `${nomeCliente} foi removido da lista de espera.`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleMudarStatus = async (id: string, novoStatus: StatusListaEspera) => {
    const updated = await waitlistService.atualizarStatus(id, novoStatus);
    if (updated) {
      success('Status Atualizado', `Cliente marcado como "${novoStatus}".`);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    }
  };

  const handleNotificarManualmente = (item: ListaEsperaItem) => {
    const horario = item.horario_liberado || item.horario_desejado || 'Horário disponível';
    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/?prof=${profissional.slug}` : '';
    const { linkWhatsApp } = waitlistService.notificarClienteIndividual(item, horario, profileUrl);

    // Abrir WhatsApp
    window.open(linkWhatsApp, '_blank');
    success('Notificação Aberta', `WhatsApp aberto para notificar ${item.cliente_nome}.`);
    loadData();
  };

  // Submeter adição manual
  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) {
      toastError('Nome obrigatório', 'Informe o nome do cliente.');
      return;
    }
    const cleanPhone = novoWhatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toastError('WhatsApp obrigatório', 'Informe o WhatsApp com DDD.');
      return;
    }
    if (!novaData) {
      toastError('Data obrigatória', 'Informe a data desejada.');
      return;
    }

    setSavingManual(true);
    try {
      const srvObj = servicos.find((s) => s.id === novoServicoId);

      await waitlistService.entrarListaEspera({
        profissional_id: profissional.id,
        profissional_nome: profissional.nome_publico,
        cliente_nome: novoNome.trim(),
        cliente_whatsapp: cleanPhone,
        cliente_email: novoEmail.trim() || undefined,
        data_desejada: novaData,
        horario_desejado: novoHorario,
        servico_id: novoServicoId || undefined,
        servico_nome: srvObj?.nome || undefined,
        observacao: novaObs.trim() || undefined,
      });

      success('Cliente Adicionado', 'Cliente cadastrado na lista de espera com sucesso!');
      setIsAddModalOpen(false);
      // Limpar form
      setNovoNome('');
      setNovoWhatsapp('');
      setNovoEmail('');
      setNovaData('');
      setNovoHorario('qualquer');
      setNovoServicoId('');
      setNovaObs('');
      loadData();
    } catch {
      toastError('Erro', 'Não foi possível cadastrar o cliente na lista.');
    } finally {
      setSavingManual(false);
    }
  };

  // Simular cancelamento de um agendamento para testar o disparo automático
  const handleSimularCancelamento = async (agendamento: Agendamento) => {
    try {
      const updated = await db.atualizarStatusAgendamento(
        agendamento.id,
        'cancelado',
        'Cancelamento de teste (Simulação da Lista de Espera)'
      );

      if (updated) {
        // Disparar processamento da lista de espera
        const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/?prof=${profissional.slug}` : '';
        const res = await waitlistService.processarCancelamentoEnotificar(updated, profileUrl);

        if (res.totalNotificados > 0) {
          success(
            '🎉 Vaga Liberada e Notificada!',
            `O agendamento de ${agendamento.cliente_nome} foi cancelado. ${res.totalNotificados} cliente(s) que estavam na Lista de Espera foram notificados automaticamente!`
          );
        } else {
          info(
            'Agendamento Cancelado',
            `O horário das ${formatTimeOnly(agendamento.data_inicio)} foi liberado. Nenhum cliente estava aguardando especificamente por esta data.`
          );
        }

        setIsSimulateModalOpen(false);
        loadData();
      }
    } catch {
      toastError('Erro na Simulação', 'Não foi possível simular o cancelamento.');
    }
  };

  // Agendamentos confirmados disponíveis para simular cancelamento
  const agendamentosConfirmados = agendamentos.filter((a) => a.status === 'confirmado');

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F1420] via-slate-900 to-[#121927] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
            <Sparkles className="w-3.5 h-3.5" />
            Sistema Ativo &bull; Automação em Tempo Real
          </div>
          <h2 className="text-2xl font-extrabold text-white font-serif-luxury flex items-center gap-2.5">
            <BellRing className="w-7 h-7 text-[#D4AF37]" />
            Lista de Espera Inteligente
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Quando um cliente cancela um horário ocupado, nosso sistema localiza quem está aguardando
            por aquela data e envia notificações automáticas para recuperar o faturamento da cadeira.
          </p>
        </div>

        {/* Quick Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition flex items-center gap-2 shadow"
            title="Simular um cancelamento para verificar o disparo automático"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Testar Notificação Automática</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Cliente</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Aguardando */}
        <div className="p-5 rounded-2xl bg-[#0F1420] border border-amber-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Clientes Aguardando
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">{totalAguardando}</span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Esperando vagas surgirem por desistência
            </span>
          </div>
        </div>

        {/* Card 2: Notificados */}
        <div className="p-5 rounded-2xl bg-[#0F1420] border border-emerald-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Vagas Notificadas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BellRing className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">{totalNotificados}</span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Alertados automaticamente após cancelamentos
            </span>
          </div>
        </div>

        {/* Card 3: Agendados */}
        <div className="p-5 rounded-2xl bg-[#0F1420] border border-blue-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Horários Recuperados
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CheckCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">{totalAgendados}</span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Encaixes confirmados com sucesso
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0F1420] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('aguardando')}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              statusFilter === 'aguardando'
                ? 'bg-[#D4AF37] text-black font-bold shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Aguardando ({totalAguardando})</span>
          </button>

          <button
            onClick={() => setStatusFilter('notificado')}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              statusFilter === 'notificado'
                ? 'bg-emerald-500 text-black font-bold shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Notificados ({totalNotificados})</span>
          </button>

          <button
            onClick={() => setStatusFilter('agendado')}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              statusFilter === 'agendado'
                ? 'bg-blue-500 text-white font-bold shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Agendados ({totalAgendados})</span>
          </button>

          <button
            onClick={() => setStatusFilter('todos')}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === 'todos'
                ? 'bg-slate-700 text-white font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({items.length})
          </button>
        </div>

        {/* Search and Date Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-slate-400 hover:text-white p-2"
                title="Limpar filtro de data"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0F1420] border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
            <BellRing className="w-8 h-8 opacity-60" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Nenhum cliente nesta seleção</h3>
            <p className="text-xs text-slate-400">
              {searchTerm || dateFilter
                ? 'Nenhum resultado corresponde aos filtros pesquisados.'
                : 'Não há clientes cadastrados na lista de espera com o status selecionado.'}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Cliente à Fila</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const dataFmt = formatDateBr(item.data_desejada);
            const waFormatado = formatWhatsApp(item.cliente_whatsapp);

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-[#0F1420] border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.status === 'notificado'
                    ? 'border-emerald-500/40 hover:border-emerald-500/60 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left Info Column */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        item.status === 'aguardando'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : item.status === 'notificado'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
                          : item.status === 'agendado'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item.status === 'aguardando' && '⏳ Aguardando Vaga'}
                      {item.status === 'notificado' && '🔔 Notificado de Vaga'}
                      {item.status === 'agendado' && '✓ Encaixado / Agendado'}
                      {item.status === 'cancelado' && 'Cancelado'}
                    </span>

                    {/* Data Desejada Badge */}
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-300 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Data: <strong className="text-white">{dataFmt}</strong>
                    </span>

                    {/* Horário Desejado Badge */}
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-300 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {item.horario_desejado && item.horario_desejado !== 'qualquer'
                        ? `Horário: ${item.horario_desejado}`
                        : 'Qualquer Horário'}
                    </span>

                    {item.horario_liberado && (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-lg">
                        Vaga Aberta: {item.horario_liberado}
                      </span>
                    )}
                  </div>

                  {/* Client Name & Contacts */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                      <User className="w-4 h-4 text-[#D4AF37]" />
                      <span>{item.cliente_nome}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{waFormatado}</span>
                    </div>

                    {item.servico_nome && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                        <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{item.servico_nome}</span>
                      </div>
                    )}
                  </div>

                  {/* Observations */}
                  {item.observacao && (
                    <p className="text-xs text-slate-400 bg-slate-950/70 p-2 rounded-xl border border-slate-900 inline-block">
                      Obs: {item.observacao}
                    </p>
                  )}

                  {item.notificado_em && (
                    <p className="text-[11px] text-emerald-400/90 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Notificado em {new Date(item.notificado_em).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(item.notificado_em).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>

                {/* Right Action Column */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {/* WhatsApp Action */}
                  <button
                    onClick={() => handleNotificarManualmente(item)}
                    className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Avisar cliente no WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Preview message */}
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition"
                    title="Ver prévia da mensagem gerada"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Convert to scheduled */}
                  {item.status !== 'agendado' && (
                    <button
                      onClick={() => handleMudarStatus(item.id, 'agendado')}
                      className="py-2 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                      title="Marcar que o cliente agendou este horário"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Encaixar</span>
                    </button>
                  )}

                  {/* Remove */}
                  <button
                    onClick={() => handleRemover(item.id, item.cliente_nome)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Remover da lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Simular Desistência & Testar Notificação Automática */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0F1420] border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Zap className="w-3 h-3 text-purple-400" />
                  Laboratório de Teste
                </span>
                <h3 className="text-lg font-bold text-white font-serif-luxury">
                  Simular Cancelamento de Agendamento
                </h3>
                <p className="text-xs text-slate-400">
                  Cancele um agendamento existente para ver o sistema localizar clientes na lista de espera
                  e disparar a notificação automaticamente.
                </p>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {agendamentosConfirmados.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                  Nenhum agendamento com status "confirmado" encontrado para cancelar. Crie um agendamento novo
                  para testar.
                </div>
              ) : (
                agendamentosConfirmados.map((ag) => (
                  <div
                    key={ag.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{ag.cliente_nome}</span>
                        <span className="text-[11px] text-[#D4AF37] font-semibold">
                          {formatDateBr(ag.data_inicio.split('T')[0])} às {formatTimeOnly(ag.data_inicio)}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Serviços: {ag.servicos.map((s) => s.nome_servico).join(', ')}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSimularCancelamento(ag)}
                      className="py-2 px-3 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition shrink-0"
                    >
                      Cancelar & Notificar Fila
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Cliente Manualmente */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0F1420] border border-[#D4AF37]/30 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-serif-luxury">
                  Adicionar Cliente à Lista de Espera
                </h3>
                <p className="text-xs text-slate-400">
                  Cadastre um cliente que ligou ou mandou WhatsApp querendo vaga.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManual} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Cliente <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp com DDD <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 98765-4321"
                  value={novoWhatsapp}
                  onChange={(e) => setNovoWhatsapp(formatWhatsApp(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data Desejada <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Horário de Preferência
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 14:00 ou 'tarde'"
                    value={novoHorario}
                    onChange={(e) => setNovoHorario(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {servicos.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Serviço de Interesse
                  </label>
                  <select
                    value={novoServicoId}
                    onChange={(e) => setNovoServicoId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Qualquer serviço / Indiferente</option>
                    {servicos.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Consegue chegar em 15 minutos se avisado."
                  value={novaObs}
                  onChange={(e) => setNovaObs(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition shadow-lg"
                >
                  {savingManual ? 'Salvando...' : 'Adicionar à Fila'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Prévia da Mensagem */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0F1420] border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  Texto da Notificação de Vaga
                </h3>
                <p className="text-xs text-slate-400">
                  Mensagem pré-formatada para {previewItem.cliente_nome} ({formatWhatsApp(previewItem.cliente_whatsapp)})
                </p>
              </div>
              <button onClick={() => setPreviewItem(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
              {previewItem.mensagem_notificacao ||
                waitlistService.gerarMensagemVagaLiberada(
                  previewItem,
                  previewItem.data_desejada,
                  previewItem.horario_liberado || previewItem.horario_desejado || 'Horário livre',
                  profissional.nome_publico
                )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleNotificarManualmente(previewItem)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-2 shadow"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Abrir no WhatsApp</span>
              </button>
              <button
                onClick={() => setPreviewItem(null)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
