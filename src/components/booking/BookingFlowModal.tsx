import React, { useState, useEffect } from 'react';
import { Profissional, Servico, DisponibilidadeRegra, Indisponibilidade, Agendamento } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ServiceSelector } from './ServiceSelector';
import { DateTimeSelector } from './DateTimeSelector';
import { ClientInfoForm } from './ClientInfoForm';
import { BookingSuccess } from './BookingSuccess';
import { WaitlistModal } from './WaitlistModal';
import { formatMoney, formatDuration } from '../../utils/formatters';
import { checkRedundantServices } from '../../utils/availability';
import { X, ArrowLeft, ArrowRight, Loader2, Sparkles, Check } from 'lucide-react';

interface Props {
  profissional: Profissional;
  isOpen: boolean;
  onClose: () => void;
  onGoToMyAppointments: () => void;
  initialServiceId?: string;
}

type Step = 'servicos' | 'horario' | 'dados' | 'sucesso';

export const BookingFlowModal: React.FC<Props> = ({
  profissional,
  isOpen,
  onClose,
  onGoToMyAppointments,
  initialServiceId,
}) => {
  const { user, perfil } = useAuth();
  const { error: toastError } = useToast();

  const [step, setStep] = useState<Step>('servicos');
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [redundancyWarning, setRedundancyWarning] = useState<string | null>(null);

  // Regras de disponibilidade e agendamentos existentes
  const [regrasDisponibilidade, setRegrasDisponibilidade] = useState<DisponibilidadeRegra[]>([]);
  const [bloqueios, setBloqueios] = useState<Indisponibilidade[]>([]);
  const [agendamentosExistentes, setAgendamentosExistentes] = useState<Agendamento[]>([]);

  // Dados da reserva
  const [dataEscolhida, setDataEscolhida] = useState<string>('');
  const [horarioEscolhido, setHorarioEscolhido] = useState<string>('');

  // Dados do cliente
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [observacao, setObservacao] = useState('');

  // Estado de submissão
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Agendamento | null>(null);

  // Lista de Espera Modal
  const [waitlistConfig, setWaitlistConfig] = useState<{
    open: boolean;
    data?: string;
    horario?: string;
  }>({ open: false });

  // Inicializar dados do profissional
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      const [srvList, regrasList, bloqList, agList] = await Promise.all([
        db.getServicosByProfissional(profissional.id),
        db.getDisponibilidadeByProfissional(profissional.id),
        db.getBloqueiosByProfissional(profissional.id),
        db.getAgendamentosByProfissional(profissional.id),
      ]);

      setServicos(srvList);
      setRegrasDisponibilidade(regrasList);
      setBloqueios(bloqList);
      setAgendamentosExistentes(agList);

      // Pré-selecionar serviço se passado
      if (initialServiceId && srvList.some((s) => s.id === initialServiceId)) {
        setSelectedServiceIds([initialServiceId]);
      } else if (srvList.length > 0 && selectedServiceIds.length === 0) {
        setSelectedServiceIds([srvList[0].id]);
      }

      // Preencher dados do cliente se já logado
      if (perfil) {
        setNome(perfil.nome || '');
        setEmail(perfil.email || '');
        if (perfil.telefone) setWhatsapp(perfil.telefone);
      } else if (user) {
        setEmail(user.email || '');
      }

      // Configurar data inicial como hoje
      const hoje = new Date();
      const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(
        hoje.getDate()
      ).padStart(2, '0')}`;
      setDataEscolhida(hojeIso);
    };

    loadData();
  }, [isOpen, profissional.id, initialServiceId, perfil, user]);

  if (!isOpen) return null;

  // Cálculos dinâmicos
  const servicosSelecionados = servicos.filter((s) => selectedServiceIds.includes(s.id));
  const duracaoTotal = servicosSelecionados.reduce((acc, s) => acc + s.duracao_minutos, 0);
  const precoTotal = servicosSelecionados.reduce((acc, s) => acc + s.preco, 0);

  // Toggle de seleção de serviços com verificação de redundância de pacote
  const handleToggleService = (servicoId: string) => {
    setRedundancyWarning(null);

    if (selectedServiceIds.includes(servicoId)) {
      if (selectedServiceIds.length === 1) {
        setRedundancyWarning('Você deve manter pelo menos um serviço selecionado.');
        return;
      }
      setSelectedServiceIds((prev) => prev.filter((id) => id !== servicoId));
      // Se a duração mudar, resetar o horário escolhido para exigir nova checagem de slot
      setHorarioEscolhido('');
      return;
    }

    // Verificar se causa conflito redundante (ex: pacote vs serviço avulso)
    const check = checkRedundantServices(servicos, selectedServiceIds, servicoId);
    if (check.redundante) {
      setRedundancyWarning(check.motivo || 'Combinação redundante.');
      return;
    }

    setSelectedServiceIds((prev) => [...prev, servicoId]);
    // Mudança de serviços exige novo cálculo de horários
    setHorarioEscolhido('');
  };

  const handleNextStep = () => {
    if (step === 'servicos') {
      if (selectedServiceIds.length === 0) {
        setRedundancyWarning('Selecione pelo menos um serviço para continuar.');
        return;
      }
      setStep('horario');
    } else if (step === 'horario') {
      if (!horarioEscolhido) {
        toastError('Selecione um Horário', 'Por favor, escolha um dos horários livres disponíveis.');
        return;
      }
      setStep('dados');
    }
  };

  const handlePrevStep = () => {
    if (step === 'horario') setStep('servicos');
    if (step === 'dados') setStep('horario');
  };

  // Submissão atômica da reserva
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toastError('Nome obrigatório', 'Por favor, informe seu nome completo.');
      return;
    }
    if (!whatsapp.trim() || whatsapp.replace(/\D/g, '').length < 10) {
      toastError('WhatsApp obrigatório', 'Informe um número de WhatsApp válido com DDD.');
      return;
    }

    setSubmitting(true);

    try {
      // Montar timestamp ISO completo para data de início
      const [hh, mm] = horarioEscolhido.split(':').map(Number);
      const [ano, mes, dia] = dataEscolhida.split('-').map(Number);
      const dataInicioObj = new Date(ano, mes - 1, dia, hh, mm, 0);

      const result = await db.criarAgendamentoAtomico({
        profissional_id: profissional.id,
        cliente_id: user?.id,
        cliente_nome: nome,
        cliente_whatsapp: whatsapp,
        cliente_email: email || undefined,
        data_inicio: dataInicioObj.toISOString(),
        servico_ids: selectedServiceIds,
        observacao: observacao || undefined,
      });

      if (!result.success) {
        // Conflito atômico de concorrência ou bloqueio
        toastError('Horário Indisponível', result.message);
        // Retornar para seleção de horário para atualizar slots sem perder dados do cliente
        const agList = await db.getAgendamentosByProfissional(profissional.id);
        setAgendamentosExistentes(agList);
        setHorarioEscolhido('');
        setStep('horario');
        setSubmitting(false);
        return;
      }

      setConfirmedBooking(result.agendamento!);
      setStep('sucesso');
    } catch (err: any) {
      toastError('Erro ao Agendar', err.message || 'Ocorreu um erro ao processar sua reserva.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0F1420] border border-[#D4AF37]/35 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header com Navegação de Passos */}
        <div className="px-5 py-4 border-b border-slate-800 bg-[#0B0F17] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step !== 'servicos' && step !== 'sucesso' && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Agendamento Online
                <span className="text-[10px] text-[#D4AF37] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 font-semibold uppercase">
                  {profissional.nome_publico}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {step === 'servicos' && 'Passo 1 de 3: Selecione os serviços'}
                {step === 'horario' && 'Passo 2 de 3: Escolha data e horário'}
                {step === 'dados' && 'Passo 3 de 3: Seus dados e confirmação'}
                {step === 'sucesso' && 'Agendamento concluído!'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps visual indicator */}
        {step !== 'sucesso' && (
          <div className="grid grid-cols-3 bg-[#111726] border-b border-slate-800/80 text-[11px] font-semibold text-center">
            <div
              className={`py-2 px-1 border-b-2 transition ${
                step === 'servicos'
                  ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5'
                  : 'border-transparent text-slate-400'
              }`}
            >
              1. Serviços
            </div>
            <div
              className={`py-2 px-1 border-b-2 transition ${
                step === 'horario'
                  ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5'
                  : 'border-transparent text-slate-400'
              }`}
            >
              2. Data & Hora
            </div>
            <div
              className={`py-2 px-1 border-b-2 transition ${
                step === 'dados'
                  ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5'
                  : 'border-transparent text-slate-400'
              }`}
            >
              3. Confirmar
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {step === 'servicos' && (
            <ServiceSelector
              servicos={servicos}
              selectedIds={selectedServiceIds}
              onToggleService={handleToggleService}
              redundancyWarning={redundancyWarning}
            />
          )}

          {step === 'horario' && (
            <DateTimeSelector
              dataEscolhida={dataEscolhida}
              onSelectData={setDataEscolhida}
              horarioEscolhido={horarioEscolhido}
              onSelectHorario={setHorarioEscolhido}
              duracaoTotalMinutos={duracaoTotal}
              regrasDisponibilidade={regrasDisponibilidade}
              bloqueios={bloqueios}
              agendamentosExistentes={agendamentosExistentes}
              onOpenWaitlist={(data, horario) =>
                setWaitlistConfig({ open: true, data, horario })
              }
            />
          )}

          {step === 'dados' && (
            <form id="booking-form" onSubmit={handleConfirmBooking}>
              <ClientInfoForm
                profissional={profissional}
                servicosSelecionados={servicosSelecionados}
                dataEscolhida={dataEscolhida}
                horarioEscolhido={horarioEscolhido}
                nome={nome}
                onChangeNome={setNome}
                whatsapp={whatsapp}
                onChangeWhatsapp={setWhatsapp}
                email={email}
                onChangeEmail={setEmail}
                observacao={observacao}
                onChangeObservacao={setObservacao}
              />
            </form>
          )}

          {step === 'sucesso' && confirmedBooking && (
            <BookingSuccess
              agendamento={confirmedBooking}
              profissional={profissional}
              onGoToMyAppointments={() => {
                onClose();
                onGoToMyAppointments();
              }}
              onClose={onClose}
            />
          )}
        </div>

        {/* Bottom Bar: Resumo & Botão de Avanço */}
        {step !== 'sucesso' && (
          <div className="p-4 border-t border-slate-800 bg-[#0B0F17] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>{servicosSelecionados.length} serv.</span>
                <span>&bull;</span>
                <span className="text-slate-300 font-medium">{formatDuration(duracaoTotal)}</span>
              </div>
              <div className="text-base font-extrabold text-[#D4AF37]">
                {formatMoney(precoTotal)}
              </div>
            </div>

            {step !== 'dados' ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={selectedServiceIds.length === 0 || (step === 'horario' && !horarioEscolhido)}
                className="py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#D4AF37] hover:bg-[#E5C07B] disabled:opacity-50 disabled:cursor-not-allowed text-black flex items-center gap-2 transition shadow-lg shadow-[#D4AF37]/20"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                form="booking-form"
                type="submit"
                disabled={submitting}
                className="py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#F5D77F] to-[#D4AF37] hover:from-[#FFF0B3] hover:to-[#E5C07B] disabled:opacity-50 text-black flex items-center gap-2 transition shadow-lg shadow-[#D4AF37]/25"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando & Agendando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirmar Agendamento</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Lista de Espera se cliente optar quando horário estiver ocupado */}
      {waitlistConfig.open && (
        <WaitlistModal
          isOpen={waitlistConfig.open}
          onClose={() => setWaitlistConfig({ open: false })}
          profissional={profissional}
          servicos={servicos}
          initialData={waitlistConfig.data}
          initialHorario={waitlistConfig.horario}
          initialServicoId={selectedServiceIds[0]}
        />
      )}
    </div>
  );
};
