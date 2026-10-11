import React, { useState, useEffect } from 'react';
import { Profissional, Servico } from '../../types';
import { waitlistService } from '../../services/waitlistService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatWhatsApp, formatDateBr } from '../../utils/formatters';
import {
  X,
  BellRing,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Sparkles,
  Scissors,
  ArrowRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profissional: Profissional;
  servicos?: Servico[];
  initialData?: string; // YYYY-MM-DD
  initialHorario?: string; // HH:mm
  initialServicoId?: string;
}

export const WaitlistModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profissional,
  servicos = [],
  initialData,
  initialHorario,
  initialServicoId,
}) => {
  const { user, perfil } = useAuth();
  const { success, error: toastError } = useToast();

  const [dataDesejada, setDataDesejada] = useState('');
  const [tipoHorario, setTipoHorario] = useState<'qualquer' | 'especifico' | 'manha' | 'tarde'>(
    'qualquer'
  );
  const [horarioEspecifico, setHorarioEspecifico] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [observacao, setObservacao] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Inicializar formulário
  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false);
      return;
    }

    // Definir data inicial
    if (initialData) {
      setDataDesejada(initialData);
    } else {
      const hoje = new Date();
      const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(
        hoje.getDate()
      ).padStart(2, '0')}`;
      setDataDesejada(hojeIso);
    }

    // Definir horário inicial
    if (initialHorario) {
      setTipoHorario('especifico');
      setHorarioEspecifico(initialHorario);
    } else {
      setTipoHorario('qualquer');
      setHorarioEspecifico('');
    }

    // Definir serviço inicial
    if (initialServicoId) {
      setServicoId(initialServicoId);
    } else if (servicos.length > 0) {
      setServicoId(servicos[0].id);
    }

    // Preencher dados do usuário se logado
    if (perfil) {
      setNome(perfil.nome || '');
      setEmail(perfil.email || '');
      if (perfil.telefone) setWhatsapp(formatWhatsApp(perfil.telefone));
    } else if (user) {
      setEmail(user.email || '');
    }
  }, [isOpen, initialData, initialHorario, initialServicoId, perfil, user, servicos]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatWhatsApp(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dataDesejada) {
      toastError('Data obrigatória', 'Por favor, selecione a data desejada.');
      return;
    }

    if (!nome.trim()) {
      toastError('Nome obrigatório', 'Informe seu nome completo para entrarmos em contato.');
      return;
    }

    const cleanNumber = whatsapp.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      toastError('WhatsApp obrigatório', 'Informe um telefone WhatsApp válido com DDD.');
      return;
    }

    const servicoObj = servicos.find((s) => s.id === servicoId);

    let horarioFinal = 'qualquer';
    if (tipoHorario === 'especifico') {
      horarioFinal = horarioEspecifico || 'qualquer';
    } else if (tipoHorario === 'manha') {
      horarioFinal = 'manha';
    } else if (tipoHorario === 'tarde') {
      horarioFinal = 'tarde';
    }

    setSubmitting(true);

    try {
      await waitlistService.entrarListaEspera({
        profissional_id: profissional.id,
        profissional_nome: profissional.nome_publico,
        cliente_nome: nome.trim(),
        cliente_whatsapp: cleanNumber,
        cliente_email: email.trim() || undefined,
        data_desejada: dataDesejada,
        horario_desejado: horarioFinal,
        servico_id: servicoId || undefined,
        servico_nome: servicoObj?.nome || undefined,
        observacao: observacao.trim() || undefined,
      });

      success(
        'Inscrito na Lista de Espera!',
        'Avisaremos você pelo WhatsApp assim que surgir uma desistência.'
      );
      setIsSuccess(true);
    } catch {
      toastError('Erro ao entrar na lista', 'Não foi possível salvar seu pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0F1420] border border-[#D4AF37]/30 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-[#141A28] to-slate-900 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
              <Sparkles className="w-3 h-3" />
              Lista de Espera Inteligente
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-serif-luxury">
              {isSuccess ? 'Você está na fila prioritária!' : 'Avise-me se vagar um horário'}
            </h2>
            <p className="text-xs text-slate-400">
              {profissional.nome_publico} &bull; {profissional.cidade}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isSuccess ? (
            <div className="text-center py-6 space-y-5 animate-scaleUp">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-emerald-500/20 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37] shadow-xl shadow-[#D4AF37]/10">
                <CheckCircle2 className="w-9 h-9 stroke-[2.2] text-[#D4AF37]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">
                  Inscrição Confirmada com Sucesso!
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Assim que um cliente cancelar ou reagendar para{' '}
                  <strong className="text-[#D4AF37] font-semibold">
                    {formatDateBr(dataDesejada)}
                  </strong>
                  , você receberá um alerta automático direto no WhatsApp:{' '}
                  <strong className="text-white font-semibold">{whatsapp}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Profissional:</span>
                  <span className="text-white font-medium">{profissional.nome_publico}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Data desejada:</span>
                  <span className="text-[#D4AF37] font-semibold">{formatDateBr(dataDesejada)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Horário:</span>
                  <span className="text-white font-medium capitalize">
                    {tipoHorario === 'especifico'
                      ? `Por volta das ${horarioEspecifico || 'livre'}`
                      : tipoHorario === 'manha'
                      ? 'Período da Manhã'
                      : tipoHorario === 'tarde'
                      ? 'Período da Tarde'
                      : 'Qualquer horário vago'}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition shadow-lg shadow-[#D4AF37]/20"
              >
                Concluir e Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Card explicativo */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 flex items-start gap-3">
                <BellRing className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  A agenda está disputada? Cadastre-se na lista e nosso sistema avisa você{' '}
                  <strong className="text-white">imediatamente no WhatsApp</strong> se outro cliente
                  desistir ou reagendar.
                </p>
              </div>

              {/* Data Desejada */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Data Desejada <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dataDesejada}
                  onChange={(e) => setDataDesejada(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                />
              </div>

              {/* Preferência de Horário */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Preferência de Horário
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setTipoHorario('qualquer')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition ${
                      tipoHorario === 'qualquer'
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Qualquer Horário
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoHorario('manha')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition ${
                      tipoHorario === 'manha'
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Manhã (até 12h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoHorario('tarde')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition ${
                      tipoHorario === 'tarde'
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Tarde (12h-18h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoHorario('especifico')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition ${
                      tipoHorario === 'especifico'
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Horário Específico
                  </button>
                </div>

                {tipoHorario === 'especifico' && (
                  <input
                    type="time"
                    value={horarioEspecifico}
                    onChange={(e) => setHorarioEspecifico(e.target.value)}
                    placeholder="Ex: 14:00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition mt-1.5"
                  />
                )}
              </div>

              {/* Serviço Desejado */}
              {servicos.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Serviço de Interesse
                  </label>
                  <select
                    value={servicoId}
                    onChange={(e) => setServicoId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  >
                    <option value="">Qualquer serviço ou decidir depois</option>
                    {servicos.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} ({s.duracao_minutos} min)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dados do Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Seu Nome <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    WhatsApp com DDD <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={whatsapp}
                    onChange={handlePhoneChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Observações adicionais (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Se tiver vaga a partir das 17h consigo ir direto do trabalho."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] disabled:opacity-50 transition shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
                >
                  <BellRing className="w-4 h-4" />
                  <span>{submitting ? 'Salvando...' : 'Entrar na Lista'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
