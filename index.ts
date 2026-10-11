export type TipoPerfil = 'cliente' | 'profissional' | 'admin';

export type StatusAgendamento = 
  | 'pendente' 
  | 'confirmado' 
  | 'concluido' 
  | 'cancelado' 
  | 'faltou';

export interface PerfilUsuario {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo_perfil: TipoPerfil;
  created_at: string;
  updated_at?: string;
}

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  icone: string;
  ativo: boolean;
}

export interface Profissional {
  id: string;
  user_id: string;
  nome_publico: string;
  slug: string;
  categoria_id: string;
  categoria_nome: string;
  descricao: string;
  foto: string;
  capa?: string;
  endereco: string;
  bairro?: string;
  cidade: string;
  estado: string;
  whatsapp: string;
  publicado: boolean;
  avaliacao_media?: number;
  total_avaliacoes?: number;
  created_at: string;
  updated_at?: string;
}

export interface Servico {
  id: string;
  profissional_id: string;
  nome: string;
  descricao: string;
  duracao_minutos: number;
  preco: number;
  ativo: boolean;
  ordem?: number;
  is_pacote?: boolean;
  servicos_inclusos?: string[]; // IDs de serviços que compõem este pacote
  created_at: string;
  updated_at?: string;
}

export interface DisponibilidadeRegra {
  id: string;
  profissional_id: string;
  dia_semana: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  hora_inicio: string; // "09:00"
  hora_fim: string; // "19:00"
  ativo: boolean;
  pausa_inicio?: string; // "12:00"
  pausa_fim?: string; // "13:00"
}

export interface Indisponibilidade {
  id: string;
  profissional_id: string;
  data_inicio: string; // ISO string ou YYYY-MM-DDTHH:mm
  data_fim: string;
  motivo?: string;
  created_at: string;
}

export interface AgendamentoServicoItem {
  id: string;
  agendamento_id?: string;
  servico_id: string;
  nome_servico: string;
  preco: number;
  duracao_minutos: number;
  ordem: number;
}

export interface Agendamento {
  id: string;
  profissional_id: string;
  profissional_nome?: string;
  profissional_whatsapp?: string;
  cliente_id?: string;
  cliente_nome: string;
  cliente_whatsapp: string;
  cliente_email?: string;
  data_inicio: string; // ISO UTC ou ISO com timezone
  data_fim: string; // ISO
  duracao_total: number; // em minutos
  valor_total: number; // em Reais (BRL)
  status: StatusAgendamento;
  observacao?: string;
  servicos: AgendamentoServicoItem[];
  avaliacao_nota?: number; // 1 a 5 estrelas
  avaliacao_comentario?: string;
  created_at: string;
  updated_at?: string;
}

export interface TimeSlot {
  hora_inicio: string; // "14:00"
  hora_fim: string; // "15:15"
  disponivel: boolean;
  motivo_indisponivel?: string;
}

export interface Notificacao {
  id: string;
  profissional_id: string;
  agendamento_id: string;
  titulo: string;
  mensagem: string;
  cliente_nome: string;
  valor_total: number;
  data_agendamento: string;
  lida: boolean;
  created_at: string;
}

export type StatusLembreteWhatsApp = 'pendente' | 'enviando' | 'enviado' | 'falha' | 'cancelado';

export interface LembreteWhatsAppItem {
  id: string;
  agendamento_id: string;
  profissional_id: string;
  profissional_nome: string;
  cliente_nome: string;
  cliente_whatsapp: string;
  data_agendamento: string; // ISO
  servicos_nomes: string;
  valor_total: number;
  mensagem_texto: string;
  link_whatsapp: string;
  status: StatusLembreteWhatsApp;
  data_alvo: string; // YYYY-MM-DD do agendamento (dia seguinte da verificação)
  tentativas: number;
  enviado_em?: string;
  erro_mensagem?: string;
  created_at: string;
  updated_at?: string;
}

export interface FilaLembreteConfig {
  autoVerificar: boolean;
  diasAntecedencia: number; // 1 = dia seguinte (D+1)
  horarioDisparoPreferencia?: string; // ex: "08:00"
  templateMensagemPadrao: string;
}

export type StatusListaEspera = 'aguardando' | 'notificado' | 'agendado' | 'cancelado';

export interface ListaEsperaItem {
  id: string;
  profissional_id: string;
  profissional_nome: string;
  cliente_nome: string;
  cliente_whatsapp: string;
  cliente_email?: string;
  data_desejada: string; // YYYY-MM-DD
  horario_desejado?: string; // "14:00" ou "qualquer" / "manha" / "tarde"
  servico_id?: string;
  servico_nome?: string;
  observacao?: string;
  status: StatusListaEspera;
  notificado_em?: string;
  horario_liberado?: string; // Ex: "15:00" ou "15:00 às 15:45"
  agendamento_origem_id?: string;
  mensagem_notificacao?: string;
  created_at: string;
  updated_at?: string;
}

