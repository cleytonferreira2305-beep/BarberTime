export function formatMoney(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatDuration(minutos: number): string {
  if (!minutos || minutos <= 0) return '0 min';
  const horas = Math.floor(minutos / 60);
  const rest = minutos % 60;
  if (horas === 0) return `${rest} min`;
  if (rest === 0) return `${horas}h`;
  return `${horas}h ${rest}min`;
}

export function formatDateBr(isoOrDate: string | Date): string {
  const d = new Date(isoOrDate);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTimeBr(isoOrDate: string | Date): string {
  const d = new Date(isoOrDate);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeOnly(isoOrDate: string | Date): string {
  const d = new Date(isoOrDate);
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatWhatsApp(telefone: string): string {
  const clean = telefone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return telefone;
}

export function cleanPhone(telefone: string): string {
  return telefone.replace(/\D/g, '');
}

export function generateWhatsAppLink(
  numero: string,
  mensagem: string
): string {
  let clean = cleanPhone(numero);
  // Se não começar com 55 e tiver 10 ou 11 dígitos, adiciona DDI do Brasil
  if ((clean.length === 10 || clean.length === 11) && !clean.startsWith('55')) {
    clean = `55${clean}`;
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(mensagem)}`;
}

export function getDiaSemanaNome(dia: number): string {
  const dias = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  return dias[dia] || '';
}
