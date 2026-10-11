import React, { useState, useEffect } from 'react';
import { Profissional, Servico, DisponibilidadeRegra } from '../../types';
import { db } from '../../services/db';
import { formatMoney, formatDuration, generateWhatsAppLink, getDiaSemanaNome } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import {
  MapPin,
  Star,
  Clock,
  MessageCircle,
  Share2,
  CalendarCheck,
  Package,
  Plus,
  Check,
  ArrowLeft,
  Sparkles,
  BellRing,
} from 'lucide-react';
import { ShareProfileModal } from '../ui/ShareProfileModal';
import { WaitlistModal } from '../booking/WaitlistModal';

interface Props {
  slug: string;
  onOpenBooking: (prof: Profissional, initialServiceId?: string) => void;
  onBack: () => void;
}

export const ProfessionalPublicProfile: React.FC<Props> = ({ slug, onOpenBooking, onBack }) => {
  const { success } = useToast();
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadeRegra[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const prof = await db.getProfissionalBySlug(slug);
      if (prof) {
        setProfissional(prof);
        const [srvs, disps] = await Promise.all([
          db.getServicosByProfissional(prof.id),
          db.getDisponibilidadeByProfissional(prof.id),
        ]);
        setServicos(srvs.filter((s) => s.ativo));
        setDisponibilidades(disps);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  // Atualização dinâmica de Meta Tags para SEO (Título, Descrição, OpenGraph, Twitter e JSON-LD)
  useEffect(() => {
    if (!profissional) return;

    const prevTitle = document.title;
    const descMeta = document.querySelector('meta[name="description"]');
    const prevDesc = descMeta?.getAttribute('content') || '';

    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
    const prevOgTitle = ogTitleMeta?.getAttribute('content') || '';

    const ogDescMeta = document.querySelector('meta[property="og:description"]');
    const prevOgDesc = ogDescMeta?.getAttribute('content') || '';

    const categoryName = profissional.categoria_nome || 'Barbearia';
    const dynamicTitle = `${profissional.nome_publico} — ${categoryName} | BarberTime`;
    
    const locationParts = [profissional.bairro, profissional.cidade, profissional.estado].filter(Boolean).join(', ');
    const dynamicDescription = `Agende online com ${profissional.nome_publico} (${categoryName})${locationParts ? ` em ${locationParts}` : ''}. Serviços, preços e horários livres no BarberTime.`;

    // Atualiza title do documento
    document.title = dynamicTitle;

    // Helper para atualizar ou criar meta tags
    const updateOrCreateMeta = (attrName: 'name' | 'property', attrValue: string, content: string) => {
      let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
      return meta;
    };

    updateOrCreateMeta('name', 'description', dynamicDescription);
    updateOrCreateMeta('property', 'og:title', dynamicTitle);
    updateOrCreateMeta('property', 'og:description', dynamicDescription);
    updateOrCreateMeta('property', 'og:type', 'profile');
    updateOrCreateMeta('property', 'og:url', window.location.href);

    if (profissional.foto) {
      updateOrCreateMeta('property', 'og:image', profissional.foto);
      updateOrCreateMeta('name', 'twitter:image', profissional.foto);
    }
    updateOrCreateMeta('name', 'twitter:title', dynamicTitle);
    updateOrCreateMeta('name', 'twitter:description', dynamicDescription);
    updateOrCreateMeta('name', 'twitter:card', 'summary_large_image');

    // Schema.org Structured Data (JSON-LD) para indexação rica em motores de busca
    let scriptTag = document.getElementById('seo-jsonld-barber') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'seo-jsonld-barber';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'HealthAndBeautyBusiness',
      name: profissional.nome_publico,
      description: dynamicDescription,
      image: profissional.foto,
      telephone: profissional.whatsapp,
      address: {
        '@type': 'PostalAddress',
        streetAddress: profissional.endereco,
        addressLocality: profissional.cidade,
        addressRegion: profissional.estado,
        addressCountry: 'BR',
      },
      priceRange: '$$',
      url: window.location.href,
    });

    // Cleanup ao desmontar ou trocar de perfil
    return () => {
      document.title = prevTitle || 'BarberTime — Encontre. Escolha. Agende.';
      if (descMeta && prevDesc) descMeta.setAttribute('content', prevDesc);
      if (ogTitleMeta && prevOgTitle) ogTitleMeta.setAttribute('content', prevOgTitle);
      if (ogDescMeta && prevOgDesc) ogDescMeta.setAttribute('content', prevOgDesc);
      const jsonLd = document.getElementById('seo-jsonld-barber');
      if (jsonLd) jsonLd.remove();
    };
  }, [profissional]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-64 bg-slate-900 rounded-3xl border border-slate-800" />
        <div className="h-32 bg-slate-900 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  if (!profissional) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Profissional não encontrado</h2>
        <p className="text-xs text-slate-400">
          O link pode estar incorreto ou o profissional não está publicado no momento.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl"
        >
          Voltar para a busca
        </button>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    success('Link Copiado!', 'O link deste perfil foi copiado para a área de transferência.');
  };

  const whatsappLink = generateWhatsAppLink(
    profissional.whatsapp,
    `Olá ${profissional.nome_publico}! Vi seu perfil no BarberTime e gostaria de tirar uma dúvida.`
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-28">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a busca
      </button>

      {/* Cover and Profile Header */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0F1420] border border-slate-800 shadow-2xl">
        {/* Cover Photo */}
        <div className="h-48 sm:h-64 w-full bg-slate-950 relative overflow-hidden">
          {profissional.capa ? (
            <img
              src={profissional.capa}
              alt={profissional.nome_publico}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 via-[#181C28] to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1420] via-transparent to-black/40" />
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-[#0F1420] bg-slate-950 shadow-2xl shrink-0">
              <img
                src={profissional.foto}
                alt={profissional.nome_publico}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name and Categories */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                  {profissional.categoria_nome}
                </span>
                {profissional.avaliacao_media && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {profissional.avaliacao_media.toFixed(1)} ({profissional.total_avaliacoes} avaliações)
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif-luxury">
                {profissional.nome_publico}
              </h1>

              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>
                  {profissional.endereco} &bull; {profissional.cidade} - {profissional.estado}
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
            {profissional.whatsapp && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition"
                title="Falar no WhatsApp"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
              </a>
            )}
            <button
              onClick={() => setShareModalOpen(true)}
              className="p-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] transition flex items-center gap-1.5"
              title="Compartilhar agenda e link curto"
            >
              <Share2 className="w-5 h-5" />
              <span className="hidden md:inline text-xs font-semibold">Compartilhar</span>
            </button>
            <button
              onClick={() => setWaitlistModalOpen(true)}
              className="p-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 transition flex items-center gap-1.5"
              title="Entrar na Lista de Espera caso não encontre vaga"
            >
              <BellRing className="w-5 h-5 text-[#D4AF37]" />
              <span className="hidden md:inline text-xs font-semibold">Lista de Espera</span>
            </button>
            <button
              onClick={() => onOpenBooking(profissional)}
              className="flex-1 sm:flex-initial py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition shadow-lg shadow-[#D4AF37]/25 flex items-center justify-center gap-2"
            >
              <CalendarCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Agendar Agora</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Services (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white font-serif-luxury">
                Serviços & Preços
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha um serviço para iniciar seu agendamento
              </p>
            </div>
            <span className="text-xs font-semibold text-[#D4AF37]">
              {servicos.length} disponíveis
            </span>
          </div>

          {/* Banner da Lista de Espera */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#0F1420] to-slate-900 border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0 text-[#D4AF37] mt-0.5">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  Lista de Espera Inteligente
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                    Desistências
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Não encontrou a data ou horário ideal? Cadastre-se para ser alertado no WhatsApp se houver cancelamento.
                </p>
              </div>
            </div>
            <button
              onClick={() => setWaitlistModalOpen(true)}
              className="py-2 px-3.5 rounded-xl text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 transition shrink-0 whitespace-nowrap flex items-center justify-center gap-1.5 self-start sm:self-center"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Entrar na Fila</span>
            </button>
          </div>

          <div className="space-y-3">
            {servicos.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-[#0F1420] border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white group-hover:text-[#D4AF37] transition">
                      {s.nome}
                    </h3>
                    {s.is_pacote && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                        <Package className="w-3 h-3" /> Pacote
                      </span>
                    )}
                  </div>
                  {s.descricao && (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {s.descricao}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {formatDuration(s.duracao_minutos)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  <span className="text-base font-extrabold text-[#D4AF37]">
                    {formatMoney(s.preco)}
                  </span>
                  <button
                    onClick={() => onOpenBooking(profissional, s.id)}
                    className="py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition flex items-center gap-1.5 shadow-md shadow-[#D4AF37]/15"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Agendar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: About & Opening Hours */}
        <div className="space-y-6">
          {/* About Box */}
          <div className="p-5 rounded-2xl bg-[#0F1420] border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Sobre o Estabelecimento
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {profissional.descricao || 'Atendimento de alta qualidade com foco em excelência e pontualidade.'}
            </p>
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Endereço de Atendimento:</span>
              <p>{profissional.endereco}</p>
              <p>{profissional.cidade} - {profissional.estado}</p>
            </div>
          </div>

          {/* Business Hours */}
          <div className="p-5 rounded-2xl bg-[#0F1420] border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              Horários de Atendimento
            </h3>
            <div className="space-y-2 text-xs">
              {[1, 2, 3, 4, 5, 6, 0].map((dia) => {
                const regra = disponibilidades.find((d) => d.dia_semana === dia);
                const aberto = regra && regra.ativo;

                return (
                  <div
                    key={dia}
                    className="flex items-center justify-between py-1 border-b border-slate-900 last:border-none"
                  >
                    <span className="text-slate-400">{getDiaSemanaNome(dia)}</span>
                    <span
                      className={`font-medium ${
                        aberto ? 'text-slate-200' : 'text-slate-600'
                      }`}
                    >
                      {aberto
                        ? `${regra.hora_inicio} às ${regra.hora_fim}${
                            regra.pausa_inicio ? ` (Pausa ${regra.pausa_inicio}-${regra.pausa_fim})` : ''
                          }`
                        : 'Fechado'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Booking Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0B0F17]/95 border-t border-slate-800 backdrop-blur-md z-30 sm:hidden flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            {profissional.nome_publico}
          </span>
          <span className="text-xs font-bold text-[#D4AF37]">
            {servicos.length} serviços disponíveis
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShareModalOpen(true)}
            className="p-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenBooking(profissional)}
            className="py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition shadow-lg shadow-[#D4AF37]/25"
          >
            Agendar
          </button>
        </div>
      </div>

      {/* Modal de Compartilhamento do Perfil */}
      <ShareProfileModal
        profissional={profissional}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* Modal da Lista de Espera */}
      <WaitlistModal
        isOpen={waitlistModalOpen}
        onClose={() => setWaitlistModalOpen(false)}
        profissional={profissional}
        servicos={servicos}
      />
    </div>
  );
};
