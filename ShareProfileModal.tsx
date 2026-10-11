import React, { useState } from 'react';
import { Profissional } from '../../types';
import { getProfileShareLinks } from '../../utils/shareUtils';
import { useToast } from '../../contexts/ToastContext';
import {
  X,
  Copy,
  Check,
  Share2,
  Instagram,
  MessageCircle,
  ExternalLink,
  QrCode,
  Sparkles,
  Send,
} from 'lucide-react';

interface Props {
  profissional: Profissional;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareProfileModal: React.FC<Props> = ({ profissional, isOpen, onClose }) => {
  const { success } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBio, setCopiedBio] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen) return null;

  const links = getProfileShareLinks(profissional);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(links.fullUrl);
    setCopiedLink(true);
    success('Link Copiado!', 'Link direto de agendamento copiado com sucesso.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyBio = () => {
    navigator.clipboard.writeText(links.instagramBioText);
    setCopiedBio(true);
    success('Texto para Bio Copiado!', 'Cole na biografia do seu perfil do Instagram.');
    setTimeout(() => setCopiedBio(false), 2500);
  };

  const handleCopyPromo = () => {
    navigator.clipboard.writeText(links.promoMessage);
    setCopiedPromo(true);
    success('Mensagem Divulgação Copiada!', 'Cole no WhatsApp ou nos stories.');
    setTimeout(() => setCopiedPromo(false), 2500);
  };

  // QR code gerado dinamicamente via serviço público de API com o link real
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    links.fullUrl
  )}&bgcolor=0F1420&color=D4AF37&margin=10`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-lg bg-[#0F1420] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative my-8">
        {/* Header com gradiente dourado */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-[#1a140a] to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-serif-luxury">
                  Divulgar Agenda & Link Público
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] px-2 py-0.5 rounded-full bg-[#D4AF37]/15">
                  Bio & Zap
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Compartilhe com seus clientes para receber agendamentos automáticos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs">
          {/* Card do Link Encurtado Principal */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-[#D4AF37]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Seu Link Exclusivo de Agendamento
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Ativo
              </span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800">
              <input
                type="text"
                readOnly
                value={links.fullUrl}
                className="w-full bg-transparent text-slate-200 font-mono text-xs focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-1.5 px-3 rounded-lg font-bold text-[11px] uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition flex items-center gap-1 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Link encurtado amigável para divulgar:{' '}
              <span className="font-mono text-[#D4AF37] font-semibold">{links.displayShortUrl}</span>
            </p>
          </div>

          {/* Ações Rápidas de Compartilhamento Direto */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-300">
              Compartilhar direto nas Redes Sociais:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* WhatsApp */}
              <a
                href={links.whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-emerald-300 font-semibold flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                    <MessageCircle className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white group-hover:text-emerald-300">WhatsApp</span>
                    <span className="text-[10px] text-slate-400">Enviar para contatos</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-300" />
              </a>

              {/* Instagram Stories / Bio */}
              <button
                type="button"
                onClick={handleCopyBio}
                className="p-3 rounded-xl bg-gradient-to-r from-fuchsia-500/10 to-rose-500/10 hover:from-fuchsia-500/20 hover:to-rose-500/20 border border-fuchsia-500/30 text-rose-300 font-semibold flex items-center justify-between transition group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center text-rose-400">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white group-hover:text-rose-300">Bio do Instagram</span>
                    <span className="text-[10px] text-slate-400">
                      {copiedBio ? 'Copiado para colar!' : 'Copiar texto formatado'}
                    </span>
                  </div>
                </div>
                {copiedBio ? <Check className="w-3.5 h-3.5 text-rose-400 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-300" />}
              </button>

              {/* Telegram */}
              <a
                href={links.telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-semibold flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white group-hover:text-sky-300">Telegram</span>
                    <span className="text-[10px] text-slate-400">Grupos e canais</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-300" />
              </a>

              {/* QR Code Toggle */}
              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className={`p-3 rounded-xl border flex items-center justify-between transition text-left ${
                  showQrCode
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white">QR Code de Balcão</span>
                    <span className="text-[10px] text-slate-400">Para cartões ou balcão</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#D4AF37]">
                  {showQrCode ? 'Ocultar' : 'Ver QR'}
                </span>
              </button>
            </div>
          </div>

          {/* Bloco QR Code Expansível */}
          {showQrCode && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center space-y-3 animate-fade-in">
              <span className="text-xs font-bold text-white">
                Escaneie com a câmera do celular para abrir a agenda:
              </span>
              <div className="p-3 bg-[#0F1420] border-2 border-[#D4AF37]/40 rounded-2xl shadow-xl inline-block">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code para ${profissional.nome_publico}`}
                  className="w-44 h-44 rounded-lg object-contain"
                />
              </div>
              <p className="text-[10px] text-slate-400 max-w-xs">
                Ideal para imprimir e colocar no espelho da cadeira, balcão ou cartões de visita!
              </p>
            </div>
          )}

          {/* Modelo pronto de Mensagem para Clientes */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">
                Mensagem Pronta para Envio em Massa (WhatsApp/Direct):
              </span>
              <button
                type="button"
                onClick={handleCopyPromo}
                className="text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold"
              >
                {copiedPromo ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPromo ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-300 text-[11px] leading-relaxed font-mono">
              {links.promoMessage}
            </div>
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
