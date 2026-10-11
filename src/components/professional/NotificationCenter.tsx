import React, { useState, useEffect, useRef } from 'react';
import { Notificacao, Profissional } from '../../types';
import { db } from '../../services/db';
import { useToast } from '../../contexts/ToastContext';
import { formatMoney, formatDateTimeBr } from '../../utils/formatters';
import {
  Bell,
  CheckCheck,
  Calendar,
  DollarSign,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Clock,
  User,
} from 'lucide-react';

interface Props {
  profissional: Profissional;
  onNavigateToAgenda?: () => void;
}

// Síntese de som suave de sino via Web Audio API para não depender de arquivos externos
function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25); // D6

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch {
    // Silencioso se bloqueado por autoplay policy do navegador
  }
}

export const NotificationCenter: React.FC<Props> = ({ profissional, onNavigateToAgenda }) => {
  const { info, success } = useToast();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotificacoes = async () => {
    const list = await db.getNotificacoesByProfissional(profissional.id);
    setNotificacoes(list);
  };

  useEffect(() => {
    fetchNotificacoes();

    // Ouvir novos agendamentos em tempo real
    const handleNovaNotificacao = (e: any) => {
      const nova: Notificacao = e.detail;
      if (nova && nova.profissional_id === profissional.id) {
        setNotificacoes((prev) => [nova, ...prev]);
        if (soundEnabled) {
          playChimeSound();
        }
        info('🔔 ' + nova.titulo, nova.mensagem);
      }
    };

    const handleAtualizacao = () => {
      fetchNotificacoes();
    };

    window.addEventListener('barbertime_nova_notificacao', handleNovaNotificacao);
    window.addEventListener('barbertime_notificacoes_atualizadas', handleAtualizacao);

    return () => {
      window.removeEventListener('barbertime_nova_notificacao', handleNovaNotificacao);
      window.removeEventListener('barbertime_notificacoes_atualizadas', handleAtualizacao);
    };
  }, [profissional.id, soundEnabled, info]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  const handleMarcarComoLida = async (id: string) => {
    await db.marcarNotificacaoComoLida(id);
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const handleMarcarTodasComoLidas = async () => {
    await db.marcarTodasNotificacoesComoLidas(profissional.id);
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    success('Notificações', 'Todas as notificações foram marcadas como lidas.');
  };

  // Botão para demonstrar / simular um novo agendamento recebido em tempo real
  const handleSimularNovoAgendamento = async () => {
    const nomesFicticios = ['Marcos Silva', 'Felipe Araújo', 'Bruno Castro', 'Diego Rocha', 'Thiago Lima'];
    const servicosDemo = ['Corte Clássico', 'Barba Terapia', 'Combo Corte + Barba', 'Design de Sobrancelha'];

    const nome = nomesFicticios[Math.floor(Math.random() * nomesFicticios.length)];
    const servico = servicosDemo[Math.floor(Math.random() * servicosDemo.length)];
    const valor = Math.floor(Math.random() * 40 + 45);

    const hoje = new Date();
    hoje.setHours(hoje.getHours() + Math.floor(Math.random() * 4 + 1));
    hoje.setMinutes(0);

    const dataFormatada = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const horaFormatada = hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    await db.criarNotificacao({
      profissional_id: profissional.id,
      agendamento_id: `ag-sim-${Date.now()}`,
      titulo: 'Novo Agendamento Recebido!',
      mensagem: `${nome} acabou de agendar "${servico}" para ${dataFormatada} às ${horaFormatada}.`,
      cliente_nome: nome,
      valor_total: valor,
      data_agendamento: hoje.toISOString(),
      lida: false,
    });
  };

  const formatTempoRelativo = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `Há ${diffHoras}h`;
    const diffDias = Math.floor(diffHoras / 24);
    return `Há ${diffDias}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notificações de Novos Agendamentos"
        className={`relative p-2.5 rounded-xl border transition flex items-center justify-center ${
          unreadCount > 0
            ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/25'
            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
        }`}
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-extrabold shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Painel de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0F1420] border border-[#D4AF37]/40 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-fadeIn">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-[#0B0F17] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Notificações
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {unreadCount} novas
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Som ativado (clique para mutar)' : 'Som mutado'}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="px-4 py-2 bg-[#121826] border-b border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleMarcarTodasComoLidas}
              disabled={unreadCount === 0}
              className="text-[#D4AF37] hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1 font-semibold"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar todas como lidas</span>
            </button>

            <button
              type="button"
              onClick={handleSimularNovoAgendamento}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-medium"
              title="Dispara uma notificação instantânea para testar o som e a interface"
            >
              <Sparkles className="w-3 h-3" />
              <span>Simular reserva</span>
            </button>
          </div>

          {/* Lista de Notificações */}
          <div className="divide-y divide-slate-800/70 overflow-y-auto flex-1 max-h-96">
            {notificacoes.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
                <p className="text-xs text-slate-400 font-medium">Nenhuma notificação recebida</p>
                <p className="text-[11px] text-slate-500">
                  Quando clientes agendarem horários na sua página, você receberá alertas aqui.
                </p>
              </div>
            ) : (
              notificacoes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    handleMarcarComoLida(item.id);
                    if (onNavigateToAgenda) {
                      onNavigateToAgenda();
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 transition cursor-pointer hover:bg-slate-900/80 flex items-start gap-3 ${
                    !item.lida ? 'bg-[#D4AF37]/5' : 'bg-transparent'
                  }`}
                >
                  {/* Status Indicator */}
                  <div className="mt-1 shrink-0">
                    {!item.lida ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] block shadow-md shadow-[#D4AF37]/50 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-700 block" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{item.titulo}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTempoRelativo(item.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-snug">{item.mensagem}</p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <User className="w-3 h-3 text-[#D4AF37]" />
                        {item.cliente_nome}
                      </span>
                      <span className="text-[#D4AF37] font-bold">
                        {formatMoney(item.valor_total)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {onNavigateToAgenda && (
            <div className="p-2.5 bg-[#0B0F17] border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  onNavigateToAgenda();
                  setIsOpen(false);
                }}
                className="text-xs text-[#D4AF37] hover:underline font-semibold flex items-center justify-center gap-1 w-full py-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Ver todos na Agenda</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
