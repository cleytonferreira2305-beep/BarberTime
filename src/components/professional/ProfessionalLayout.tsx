import React, { useState } from 'react';
import { Profissional } from '../../types';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Clock,
  Settings,
  ExternalLink,
  Share2,
  MessageSquare,
  BellRing,
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { ShareProfileModal } from '../ui/ShareProfileModal';

interface Props {
  profissional: Profissional;
  activeTab:
    | 'dashboard'
    | 'agenda'
    | 'servicos'
    | 'disponibilidade'
    | 'perfil'
    | 'lembretes'
    | 'lista_espera';
  onChangeTab: (
    tab:
      | 'dashboard'
      | 'agenda'
      | 'servicos'
      | 'disponibilidade'
      | 'perfil'
      | 'lembretes'
      | 'lista_espera'
  ) => void;
  onViewPublicProfile: (slug: string) => void;
  children: React.ReactNode;
}


export const ProfessionalLayout: React.FC<Props> = ({
  profissional,
  activeTab,
  onChangeTab,
  onViewPublicProfile,
  children,
}) => {
  const [shareModalOpen, setShareModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Top Banner with Professional Info */}
      <div className="p-6 rounded-3xl bg-[#0F1420] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={profissional.foto}
            alt={profissional.nome_publico}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37]/40 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-serif-luxury">
                {profissional.nome_publico}
              </h1>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  profissional.publicado
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {profissional.publicado ? 'Publicado' : 'Rascunho'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {profissional.categoria_nome} &bull; {profissional.cidade} - {profissional.estado}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <NotificationCenter
            profissional={profissional}
            onNavigateToAgenda={() => onChangeTab('agenda')}
          />
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#E5C07B] flex items-center gap-1.5 transition shadow-sm shadow-[#D4AF37]/20"
            title="Divulgar link no Instagram e WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Divulgar Link</span>
          </button>
          <button
            onClick={() => onViewPublicProfile(profissional.slug)}
            className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 transition"
          >
            <span>Ver Página</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`py-3 px-4 rounded-xl flex items-center gap-2 transition shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => onChangeTab('agenda')}
          className={`py-3 px-4 rounded-xl flex items-center gap-2 transition shrink-0 ${
            activeTab === 'agenda'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda & Atendimentos</span>
        </button>

        <button
          onClick={() => onChangeTab('servicos')}
          className={`py-3 px-4 rounded-xl flex items-center gap-2 transition shrink-0 ${
            activeTab === 'servicos'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Serviços & Preços</span>
        </button>

        <button
          onClick={() => onChangeTab('disponibilidade')}
          className={`py-3 px-4 rounded-xl flex items-center gap-2 transition shrink-0 ${
            activeTab === 'disponibilidade'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Horários & Bloqueios</span>
        </button>

        <button
          onClick={() => onChangeTab('lembretes')}
          className={`py-3 px-4 rounded-xl flex items-center gap-2 transition shrink-0 ${
            activeTab === 'lembretes'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Lembretes WhatsApp</span>
        </button>

        <button
          onClick={() => onChangeTab('lista_espera')}
          className={`py-3 px-4 rounded-xl flex items-center gap-2 transition shrink-0 ${
            activeTab === 'lista_espera'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Lista de Espera</span>
        </button>

        <button
          onClick={() => onChangeTab('perfil')}
          className={`py-3 px-4 rounded-xl flex items-center gap-2 transition shrink-0 ${
            activeTab === 'perfil'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurar Perfil</span>
        </button>
      </div>

      {/* Tab content */}
      <div>{children}</div>

      {/* Modal de Divulgação do Perfil */}
      <ShareProfileModal
        profissional={profissional}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
};
