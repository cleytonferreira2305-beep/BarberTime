// Helper para gerar links compartilháveis e links curtos de perfil
import { Profissional } from '../types';

export interface ShareLinks {
  // URL canônica com hash para o SPA: ex: https://app.com/#/p/dom-barba ou /#/profissional/dom-barba
  fullUrl: string;
  // Link encurtado estilizado amigável para bio e redes: ex: barbertime.app/p/dom-barba
  displayShortUrl: string;
  // Link direto para WhatsApp com mensagem personalizada pronta
  whatsappShareUrl: string;
  // Link para compartilhamento no Telegram
  telegramShareUrl: string;
  // Texto formatado pronto para copiar na Bio do Instagram
  instagramBioText: string;
  // Mensagem pronta para stories / feed
  promoMessage: string;
}

export function getProfileShareLinks(profissional: Profissional): ShareLinks {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://barbertime.app';
  
  // Rota de link curto compatível com SPA: #/p/:slug ou #/profissional/:slug
  const shortPath = `#/p/${profissional.slug}`;
  const fullUrl = `${origin}/${shortPath}`;
  
  // Formato limpo e atraente para exibição em bio e materiais impressos
  const cleanHost = origin.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const displayShortUrl = `${cleanHost}/#p/${profissional.slug}`;

  const defaultMsg = `💈 *Agende seu horário com ${profissional.nome_publico}!*\n\nEscolha o serviço e horário direto no BarberTime:\n👉 ${fullUrl}`;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(defaultMsg)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(`Agende seu horário com ${profissional.nome_publico} pelo BarberTime`)}`;

  const instagramBioText = `💈 Agendamento Online:\n👉 ${displayShortUrl}`;
  const promoMessage = `Fala galera! Meu link de agendamento online está no ar. Escolha seus serviços e garanta seu horário em segundos: ${fullUrl}`;

  return {
    fullUrl,
    displayShortUrl,
    whatsappShareUrl,
    telegramShareUrl,
    instagramBioText,
    promoMessage,
  };
}
