import React from 'react';
import { Profissional, Servico } from '../../types';
import { formatMoney, formatDuration, formatWhatsApp, formatDateBr } from '../../utils/formatters';
import { User, Phone, Mail, MessageSquare, ShieldCheck, Clock, MapPin } from 'lucide-react';

interface Props {
  profissional: Profissional;
  servicosSelecionados: Servico[];
  dataEscolhida: string;
  horarioEscolhido: string;
  nome: string;
  onChangeNome: (val: string) => void;
  whatsapp: string;
  onChangeWhatsapp: (val: string) => void;
  email: string;
  onChangeEmail: (val: string) => void;
  observacao: string;
  onChangeObservacao: (val: string) => void;
}

export const ClientInfoForm: React.FC<Props> = ({
  profissional,
  servicosSelecionados,
  dataEscolhida,
  horarioEscolhido,
  nome,
  onChangeNome,
  whatsapp,
  onChangeWhatsapp,
  email,
  onChangeEmail,
  observacao,
  onChangeObservacao,
}) => {
  const duracaoTotal = servicosSelecionados.reduce((acc, s) => acc + s.duracao_minutos, 0);
  const precoTotal = servicosSelecionados.reduce((acc, s) => acc + s.preco, 0);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatWhatsApp(raw);
    onChangeWhatsapp(formatted);
  };

  return (
    <div className="space-y-6">
      {/* Resumo da Reserva */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white">{profissional.nome_publico}</h4>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#D4AF37]" />
              {profissional.endereco}, {profissional.cidade}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-slate-400 block">Total</span>
            <span className="text-base font-extrabold text-[#D4AF37]">
              {formatMoney(precoTotal)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Serviços ({servicosSelecionados.length}):</span>
            <span className="text-right font-medium text-white max-w-[200px] truncate">
              {servicosSelecionados.map((s) => s.nome).join(', ')}
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Data e Horário:</span>
            <span className="font-semibold text-white">
              {formatDateBr(dataEscolhida)} às {horarioEscolhido}
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Duração Estimada:</span>
            <span className="text-slate-200">{formatDuration(duracaoTotal)}</span>
          </div>
        </div>
      </div>

      {/* Formulário de Identificação */}
      <div className="space-y-3.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Seus Dados para o Agendamento
        </h4>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Nome Completo <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder="Ex: Matheus Oliveira"
              value={nome}
              onChange={(e) => onChangeNome(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            WhatsApp para Confirmação e Lembretes <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="tel"
              required
              placeholder="(11) 98765-4321"
              maxLength={15}
              value={whatsapp}
              onChange={handlePhoneChange}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Não enviamos spam. Apenas aviso do horário agendado.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            E-mail (opcional)
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => onChangeEmail(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Observações ou preferências (opcional)
          </label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <textarea
              rows={2}
              placeholder="Ex: Corte com navalha, barba curta, preferência por toalha fria..."
              value={observacao}
              onChange={(e) => onChangeObservacao(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition resize-none"
            />
          </div>
        </div>

        <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Reserva instantânea garantida sem necessidade de pagamento antecipado.</span>
        </div>
      </div>
    </div>
  );
};
