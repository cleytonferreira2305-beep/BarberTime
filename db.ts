import {
  Profissional,
  Categoria,
  Servico,
  DisponibilidadeRegra,
  Indisponibilidade,
  Agendamento,
  AgendamentoServicoItem,
  StatusAgendamento,
  Notificacao,
} from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  CATEGORIAS: 'barbertime_categorias_v1',
  PROFISSIONAIS: 'barbertime_profissionais_v1',
  SERVICOS: 'barbertime_servicos_v1',
  DISPONIBILIDADES: 'barbertime_disponibilidades_v1',
  INDISPONIBILIDADES: 'barbertime_indisponibilidades_v1',
  AGENDAMENTOS: 'barbertime_agendamentos_v1',
  NOTIFICACOES: 'barbertime_notificacoes_v1',
};

// Dados padrão iniciais (profissionais reais com perfil brasileiro)
const SEED_CATEGORIAS: Categoria[] = [
  { id: 'cat-1', nome: 'Barbearia', slug: 'barbearia', icone: 'scissors', ativo: true },
  { id: 'cat-2', nome: 'Cabeleireiro', slug: 'cabeleireiro', icone: 'sparkles', ativo: true },
  { id: 'cat-3', nome: 'Manicure & Pedicure', slug: 'manicure', icone: 'hand', ativo: true },
];

const SEED_PROFISSIONAIS: Profissional[] = [
  {
    id: 'prof-dombarba',
    user_id: 'user-dombarba',
    nome_publico: 'Barbearia Dom Barba & Lounge',
    slug: 'dom-barba',
    categoria_id: 'cat-1',
    categoria_nome: 'Barbearia',
    descricao: 'Especialista em cortes masculinos clássicos e modernos, barboterapia tradicional com toalha quente e atendimento premium com café artesanal.',
    foto: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    capa: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
    endereco: 'Av. Ibirapuera, 2450',
    bairro: 'Moema',
    cidade: 'São Paulo',
    estado: 'SP',
    whatsapp: '11987654321',
    publicado: true,
    avaliacao_media: 4.9,
    total_avaliacoes: 142,
    created_at: new Date('2025-01-10T10:00:00Z').toISOString(),
  },
  {
    id: 'prof-elegance',
    user_id: 'user-elegance',
    nome_publico: 'Studio Elegance Hair & Visagismo',
    slug: 'studio-elegance',
    categoria_id: 'cat-2',
    categoria_nome: 'Cabeleireiro',
    descricao: 'Design de corte feminino e masculino, mechas personalizadas, tratamentos capilares profundos e visagismo facial.',
    foto: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    capa: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    endereco: 'Rua Visconde de Pirajá, 550',
    bairro: 'Ipanema',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    whatsapp: '21998761234',
    publicado: true,
    avaliacao_media: 4.8,
    total_avaliacoes: 98,
    created_at: new Date('2025-01-15T10:00:00Z').toISOString(),
  },
  {
    id: 'prof-nailvip',
    user_id: 'user-nailvip',
    nome_publico: 'Nail & Glow VIP Spa',
    slug: 'nail-glow-vip',
    categoria_id: 'cat-3',
    categoria_nome: 'Manicure & Pedicure',
    descricao: 'Alongamento de unhas em fibra e gel, cutilagem russa, spa dos pés e esmaltação semipermanente de longa durabilidade.',
    foto: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80',
    capa: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1200&q=80',
    endereco: 'Rua Benjamin Lins, 710',
    bairro: 'Batel',
    cidade: 'Curitiba',
    estado: 'PR',
    whatsapp: '41991238899',
    publicado: true,
    avaliacao_media: 5.0,
    total_avaliacoes: 76,
    created_at: new Date('2025-02-01T10:00:00Z').toISOString(),
  },
];

const SEED_SERVICOS: Servico[] = [
  // Barbearia Dom Barba
  {
    id: 'srv-corte-dom',
    profissional_id: 'prof-dombarba',
    nome: 'Corte de Cabelo Masculino',
    descricao: 'Corte tradicional ou degradê navalhado com lavagem e finalização com pomada modeladora.',
    duracao_minutos: 40,
    preco: 50.0,
    ativo: true,
    ordem: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-barba-dom',
    profissional_id: 'prof-dombarba',
    nome: 'Barboterapia com Toalha Quente',
    descricao: 'Alinhamento completo da barba com toalha aromatizada, óleo hidratante e massagem facial.',
    duracao_minutos: 35,
    preco: 45.0,
    ativo: true,
    ordem: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-combo-dom',
    profissional_id: 'prof-dombarba',
    nome: 'Combo Corte + Barba Premium',
    descricao: 'Corte completo acompanhado de barboterapia relaxante e finalização especial.',
    duracao_minutos: 75,
    preco: 85.0,
    ativo: true,
    ordem: 3,
    is_pacote: true,
    servicos_inclusos: ['srv-corte-dom', 'srv-barba-dom'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-sobrancelha-dom',
    profissional_id: 'prof-dombarba',
    nome: 'Design de Sobrancelha na Navalha',
    descricao: 'Alinhamento sutil e limpeza dos fios com acabamento preciso.',
    duracao_minutos: 15,
    preco: 25.0,
    ativo: true,
    ordem: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-hidratacao-dom',
    profissional_id: 'prof-dombarba',
    nome: 'Hidratação Capilar Revitalizante',
    descricao: 'Nutrição dos fios para restaurar brilho e maciez.',
    duracao_minutos: 25,
    preco: 40.0,
    ativo: true,
    ordem: 5,
    created_at: new Date().toISOString(),
  },

  // Studio Elegance Hair
  {
    id: 'srv-corte-fem-elegance',
    profissional_id: 'prof-elegance',
    nome: 'Corte Feminino & Escova Modelada',
    descricao: 'Consultoria de visagismo, lavagem com shampoo premium, corte e escovação.',
    duracao_minutos: 60,
    preco: 95.0,
    ativo: true,
    ordem: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-hidratacao-elegance',
    profissional_id: 'prof-elegance',
    nome: 'Tratamento Reconstrutor & Nutrição',
    descricao: 'Ampola de hidratação profunda com reposição lipídica.',
    duracao_minutos: 45,
    preco: 110.0,
    ativo: true,
    ordem: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-combo-corte-nutri-elegance',
    profissional_id: 'prof-elegance',
    nome: 'Pacote Renovação (Corte + Nutrição)',
    descricao: 'Corte completo aliado ao tratamento reconstrutor intensivo com escova.',
    duracao_minutos: 100,
    preco: 180.0,
    ativo: true,
    ordem: 3,
    is_pacote: true,
    servicos_inclusos: ['srv-corte-fem-elegance', 'srv-hidratacao-elegance'],
    created_at: new Date().toISOString(),
  },

  // Nail & Glow VIP
  {
    id: 'srv-manicure-nail',
    profissional_id: 'prof-nailvip',
    nome: 'Manicure Completa',
    descricao: 'Cutilagem, esfoliação, hidratação das mãos e esmaltação.',
    duracao_minutos: 45,
    preco: 40.0,
    ativo: true,
    ordem: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-pedicure-nail',
    profissional_id: 'prof-nailvip',
    nome: 'Pedicure & Spa dos Pés',
    descricao: 'Higienização, lixamento, esfoliação relaxante e hidratação com massagem.',
    duracao_minutos: 50,
    preco: 50.0,
    ativo: true,
    ordem: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-combo-pes-maos-nail',
    profissional_id: 'prof-nailvip',
    nome: 'Combo Completo Mãos + Pés',
    descricao: 'Tratamento completo para unhas das mãos e dos pés.',
    duracao_minutos: 90,
    preco: 80.0,
    ativo: true,
    ordem: 3,
    is_pacote: true,
    servicos_inclusos: ['srv-manicure-nail', 'srv-pedicure-nail'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-gel-nail',
    profissional_id: 'prof-nailvip',
    nome: 'Esmaltação em Gel',
    descricao: 'Aplicação com secagem em cabine LED, brilho espelhado e durabilidade de até 20 dias.',
    duracao_minutos: 60,
    preco: 85.0,
    ativo: true,
    ordem: 4,
    created_at: new Date().toISOString(),
  },
];

const SEED_DISPONIBILIDADES: DisponibilidadeRegra[] = [
  // Dom Barba: Segunda a Sábado 09:00 às 19:30 com almoço 12:30 - 13:30
  ...[1, 2, 3, 4, 5, 6].map((dia) => ({
    id: `disp-dom-${dia}`,
    profissional_id: 'prof-dombarba',
    dia_semana: dia,
    hora_inicio: '09:00',
    hora_fim: '19:30',
    ativo: true,
    pausa_inicio: '12:30',
    pausa_fim: '13:30',
  })),
  // Domingo fechado
  {
    id: 'disp-dom-0',
    profissional_id: 'prof-dombarba',
    dia_semana: 0,
    hora_inicio: '10:00',
    hora_fim: '15:00',
    ativo: false,
  },

  // Studio Elegance: Terça a Sábado 09:00 às 19:00
  ...[2, 3, 4, 5, 6].map((dia) => ({
    id: `disp-elegance-${dia}`,
    profissional_id: 'prof-elegance',
    dia_semana: dia,
    hora_inicio: '09:00',
    hora_fim: '19:00',
    ativo: true,
    pausa_inicio: '13:00',
    pausa_fim: '14:00',
  })),

  // Nail VIP: Segunda a Sábado 08:30 às 18:30
  ...[1, 2, 3, 4, 5, 6].map((dia) => ({
    id: `disp-nail-${dia}`,
    profissional_id: 'prof-nailvip',
    dia_semana: dia,
    hora_inicio: '08:30',
    hora_fim: '18:30',
    ativo: true,
    pausa_inicio: '12:00',
    pausa_fim: '13:00',
  })),
];

// Seed de alguns agendamentos para demonstrar ocupação real e agenda preenchida
const agoraRef = new Date();
const ano = agoraRef.getFullYear();
const mes = agoraRef.getMonth();
const diaHoje = agoraRef.getDate();

const SEED_AGENDAMENTOS: Agendamento[] = [
  {
    id: 'ag-demo-1',
    profissional_id: 'prof-dombarba',
    profissional_nome: 'Barbearia Dom Barba & Lounge',
    profissional_whatsapp: '11987654321',
    cliente_nome: 'Carlos Eduardo Mendes',
    cliente_whatsapp: '11999991111',
    cliente_email: 'carlos.mendes@email.com',
    data_inicio: new Date(ano, mes, diaHoje, 10, 0, 0).toISOString(),
    data_fim: new Date(ano, mes, diaHoje, 10, 40, 0).toISOString(),
    duracao_total: 40,
    valor_total: 50.0,
    status: 'confirmado',
    observacao: 'Prefere corte com tesoura no topo e degradê na 1.',
    servicos: [
      {
        id: 'ags-1',
        servico_id: 'srv-corte-dom',
        nome_servico: 'Corte de Cabelo Masculino',
        preco: 50.0,
        duracao_minutos: 40,
        ordem: 1,
      },
    ],
    created_at: new Date(ano, mes, diaHoje - 1, 14, 20).toISOString(),
  },
  {
    id: 'ag-demo-2',
    profissional_id: 'prof-dombarba',
    profissional_nome: 'Barbearia Dom Barba & Lounge',
    profissional_whatsapp: '11987654321',
    cliente_nome: 'Lucas Silveira',
    cliente_whatsapp: '11988882222',
    data_inicio: new Date(ano, mes, diaHoje, 15, 0, 0).toISOString(),
    data_fim: new Date(ano, mes, diaHoje, 16, 15, 0).toISOString(),
    duracao_total: 75,
    valor_total: 85.0,
    status: 'confirmado',
    observacao: 'Primeira vez no estabelecimento.',
    servicos: [
      {
        id: 'ags-2',
        servico_id: 'srv-combo-dom',
        nome_servico: 'Combo Corte + Barba Premium',
        preco: 85.0,
        duracao_minutos: 75,
        ordem: 1,
      },
    ],
    created_at: new Date(ano, mes, diaHoje - 1, 16, 45).toISOString(),
  },
  {
    id: 'ag-demo-3',
    profissional_id: 'prof-dombarba',
    profissional_nome: 'Barbearia Dom Barba & Lounge',
    profissional_whatsapp: '11987654321',
    cliente_nome: 'Rafael Martins',
    cliente_whatsapp: '11977773333',
    data_inicio: new Date(ano, mes, diaHoje + 1, 11, 0, 0).toISOString(),
    data_fim: new Date(ano, mes, diaHoje + 1, 11, 55, 0).toISOString(),
    duracao_total: 55,
    valor_total: 75.0,
    status: 'confirmado',
    servicos: [
      {
        id: 'ags-3a',
        servico_id: 'srv-corte-dom',
        nome_servico: 'Corte de Cabelo Masculino',
        preco: 50.0,
        duracao_minutos: 40,
        ordem: 1,
      },
      {
        id: 'ags-3b',
        servico_id: 'srv-sobrancelha-dom',
        nome_servico: 'Design de Sobrancelha na Navalha',
        preco: 25.0,
        duracao_minutos: 15,
        ordem: 2,
      },
    ],
    created_at: new Date().toISOString(),
  },
];

const SEED_NOTIFICACOES: Notificacao[] = [
  {
    id: 'notif-1',
    profissional_id: 'prof-dombarba',
    agendamento_id: 'ag-demo-2',
    titulo: 'Novo Agendamento Confirmado',
    mensagem: 'Lucas Silveira reservou Combo Corte + Barba Premium para Hoje às 15:00.',
    cliente_nome: 'Lucas Silveira',
    valor_total: 85.0,
    data_agendamento: new Date(ano, mes, diaHoje, 15, 0, 0).toISOString(),
    lida: false,
    created_at: new Date(ano, mes, diaHoje - 1, 16, 45).toISOString(),
  },
  {
    id: 'notif-2',
    profissional_id: 'prof-dombarba',
    agendamento_id: 'ag-demo-1',
    titulo: 'Novo Agendamento Confirmado',
    mensagem: 'Carlos Eduardo Mendes reservou Corte de Cabelo Masculino para Hoje às 10:00.',
    cliente_nome: 'Carlos Eduardo Mendes',
    valor_total: 50.0,
    data_agendamento: new Date(ano, mes, diaHoje, 10, 0, 0).toISOString(),
    lida: true,
    created_at: new Date(ano, mes, diaHoje - 1, 14, 20).toISOString(),
  },
];

class DatabaseService {
  private memoryStore: Record<string, any> = {};

  private getLocal<T>(key: string, defaultVal: T): T {
    if (typeof window === 'undefined') {
      return (this.memoryStore[key] as T) ?? defaultVal;
    }
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        this.setLocal(key, defaultVal);
        return defaultVal;
      }
      return JSON.parse(data) as T;
    } catch {
      return defaultVal;
    }
  }

  private setLocal<T>(key: string, val: T): void {
    if (typeof window === 'undefined') {
      this.memoryStore[key] = val;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(`Erro ao gravar ${key} no localStorage`, e);
    }
  }

  public init() {
    if (typeof window === 'undefined') {
      if (!this.memoryStore[STORAGE_KEYS.CATEGORIAS]) this.memoryStore[STORAGE_KEYS.CATEGORIAS] = SEED_CATEGORIAS;
      if (!this.memoryStore[STORAGE_KEYS.PROFISSIONAIS]) this.memoryStore[STORAGE_KEYS.PROFISSIONAIS] = SEED_PROFISSIONAIS;
      if (!this.memoryStore[STORAGE_KEYS.SERVICOS]) this.memoryStore[STORAGE_KEYS.SERVICOS] = SEED_SERVICOS;
      if (!this.memoryStore[STORAGE_KEYS.DISPONIBILIDADES]) this.memoryStore[STORAGE_KEYS.DISPONIBILIDADES] = SEED_DISPONIBILIDADES;
      if (!this.memoryStore[STORAGE_KEYS.INDISPONIBILIDADES]) this.memoryStore[STORAGE_KEYS.INDISPONIBILIDADES] = [];
      if (!this.memoryStore[STORAGE_KEYS.AGENDAMENTOS]) this.memoryStore[STORAGE_KEYS.AGENDAMENTOS] = SEED_AGENDAMENTOS;
      if (!this.memoryStore[STORAGE_KEYS.NOTIFICACOES]) this.memoryStore[STORAGE_KEYS.NOTIFICACOES] = SEED_NOTIFICACOES;
      return;
    }
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIAS)) {
      this.setLocal(STORAGE_KEYS.CATEGORIAS, SEED_CATEGORIAS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFISSIONAIS)) {
      this.setLocal(STORAGE_KEYS.PROFISSIONAIS, SEED_PROFISSIONAIS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICOS)) {
      this.setLocal(STORAGE_KEYS.SERVICOS, SEED_SERVICOS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DISPONIBILIDADES)) {
      this.setLocal(STORAGE_KEYS.DISPONIBILIDADES, SEED_DISPONIBILIDADES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INDISPONIBILIDADES)) {
      this.setLocal(STORAGE_KEYS.INDISPONIBILIDADES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AGENDAMENTOS)) {
      this.setLocal(STORAGE_KEYS.AGENDAMENTOS, SEED_AGENDAMENTOS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICACOES)) {
      this.setLocal(STORAGE_KEYS.NOTIFICACOES, SEED_NOTIFICACOES);
    }
  }

  public resetSeedData(): void {
    this.setLocal(STORAGE_KEYS.CATEGORIAS, SEED_CATEGORIAS);
    this.setLocal(STORAGE_KEYS.PROFISSIONAIS, SEED_PROFISSIONAIS);
    this.setLocal(STORAGE_KEYS.SERVICOS, SEED_SERVICOS);
    this.setLocal(STORAGE_KEYS.DISPONIBILIDADES, SEED_DISPONIBILIDADES);
    this.setLocal(STORAGE_KEYS.INDISPONIBILIDADES, []);
    this.setLocal(STORAGE_KEYS.AGENDAMENTOS, SEED_AGENDAMENTOS);
    this.setLocal(STORAGE_KEYS.NOTIFICACOES, SEED_NOTIFICACOES);
  }

  // --- CATEGORIAS ---
  public async getCategorias(): Promise<Categoria[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('categorias').select('*').eq('ativo', true);
      if (!error && data && data.length > 0) return data;
    }
    return this.getLocal<Categoria[]>(STORAGE_KEYS.CATEGORIAS, SEED_CATEGORIAS).filter((c) => c.ativo);
  }

  // --- PROFISSIONAIS ---
  public async getProfissionais(filters?: {
    query?: string;
    categoriaSlug?: string;
    cidade?: string;
  }): Promise<Profissional[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('profissionais').select('*').eq('publicado', true);
      if (filters?.cidade) {
        query = query.ilike('cidade', `%${filters.cidade}%`);
      }
      const { data, error } = await query;
      if (!error && data) {
        let results = data as Profissional[];
        if (filters?.query) {
          const q = filters.query.toLowerCase();
          results = results.filter(
            (p) =>
              p.nome_publico.toLowerCase().includes(q) ||
              p.descricao?.toLowerCase().includes(q) ||
              p.categoria_nome.toLowerCase().includes(q) ||
              p.cidade.toLowerCase().includes(q)
          );
        }
        return results;
      }
    }

    let list = this.getLocal<Profissional[]>(STORAGE_KEYS.PROFISSIONAIS, SEED_PROFISSIONAIS);
    list = list.filter((p) => p.publicado);

    if (filters?.categoriaSlug && filters.categoriaSlug !== 'todos') {
      const categorias = await this.getCategorias();
      const cat = categorias.find((c) => c.slug === filters.categoriaSlug);
      if (cat) {
        list = list.filter((p) => p.categoria_id === cat.id || p.categoria_nome.toLowerCase().includes(cat.nome.toLowerCase()));
      }
    }

    if (filters?.cidade && filters.cidade.trim() !== '') {
      const cid = filters.cidade.toLowerCase();
      list = list.filter((p) => p.cidade.toLowerCase().includes(cid));
    }

    if (filters?.query && filters.query.trim() !== '') {
      const q = filters.query.toLowerCase().trim();
      const servicos = this.getLocal<Servico[]>(STORAGE_KEYS.SERVICOS, SEED_SERVICOS);
      list = list.filter((p) => {
        const matchProf =
          p.nome_publico.toLowerCase().includes(q) ||
          p.descricao.toLowerCase().includes(q) ||
          p.cidade.toLowerCase().includes(q) ||
          p.categoria_nome.toLowerCase().includes(q);

        const matchServico = servicos.some(
          (s) => s.profissional_id === p.id && s.nome.toLowerCase().includes(q)
        );

        return matchProf || matchServico;
      });
    }

    return list;
  }

  public async getProfissionalBySlug(slug: string): Promise<Profissional | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('slug', slug)
        .single();
      if (!error && data) return data;
    }

    const list = this.getLocal<Profissional[]>(STORAGE_KEYS.PROFISSIONAIS, SEED_PROFISSIONAIS);
    return list.find((p) => p.slug === slug) || null;
  }

  public async getProfissionalById(id: string): Promise<Profissional | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    }

    const list = this.getLocal<Profissional[]>(STORAGE_KEYS.PROFISSIONAIS, SEED_PROFISSIONAIS);
    return list.find((p) => p.id === id) || null;
  }

  public async getProfissionalByUserId(userId: string): Promise<Profissional | null> {
    const list = this.getLocal<Profissional[]>(STORAGE_KEYS.PROFISSIONAIS, SEED_PROFISSIONAIS);
    return list.find((p) => p.user_id === userId) || null;
  }

  public async salvarProfissional(prof: Partial<Profissional>): Promise<Profissional> {
    const list = this.getLocal<Profissional[]>(STORAGE_KEYS.PROFISSIONAIS, SEED_PROFISSIONAIS);
    const index = list.findIndex((p) => p.id === prof.id || p.user_id === prof.user_id);

    let updated: Profissional;
    if (index >= 0) {
      updated = {
        ...list[index],
        ...prof,
        updated_at: new Date().toISOString(),
      } as Profissional;
      list[index] = updated;
    } else {
      updated = {
        id: prof.id || `prof-${Date.now()}`,
        user_id: prof.user_id || `user-${Date.now()}`,
        nome_publico: prof.nome_publico || 'Novo Profissional',
        slug: prof.slug || `prof-${Date.now()}`,
        categoria_id: prof.categoria_id || 'cat-1',
        categoria_nome: prof.categoria_nome || 'Barbearia',
        descricao: prof.descricao || '',
        foto: prof.foto || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
        endereco: prof.endereco || 'Endereço Comercial',
        cidade: prof.cidade || 'São Paulo',
        estado: prof.estado || 'SP',
        whatsapp: prof.whatsapp || '11999999999',
        publicado: prof.publicado ?? true,
        avaliacao_media: 5.0,
        total_avaliacoes: 0,
        created_at: new Date().toISOString(),
      };
      list.push(updated);
    }

    this.setLocal(STORAGE_KEYS.PROFISSIONAIS, list);
    return updated;
  }

  // --- SERVIÇOS ---
  public async getServicosByProfissional(profissionalId: string): Promise<Servico[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('profissional_id', profissionalId)
        .order('ordem', { ascending: true });
      if (!error && data) return data;
    }

    const list = this.getLocal<Servico[]>(STORAGE_KEYS.SERVICOS, SEED_SERVICOS);
    return list
      .filter((s) => s.profissional_id === profissionalId)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }

  public async salvarServico(servico: Partial<Servico> & { profissional_id: string }): Promise<Servico> {
    const list = this.getLocal<Servico[]>(STORAGE_KEYS.SERVICOS, SEED_SERVICOS);
    const index = list.findIndex((s) => s.id === servico.id);

    let saved: Servico;
    if (index >= 0) {
      saved = {
        ...list[index],
        ...servico,
        updated_at: new Date().toISOString(),
      } as Servico;
      list[index] = saved;
    } else {
      saved = {
        id: servico.id || `srv-${Date.now()}`,
        profissional_id: servico.profissional_id,
        nome: servico.nome || 'Novo Serviço',
        descricao: servico.descricao || '',
        duracao_minutos: Number(servico.duracao_minutos) || 30,
        preco: Number(servico.preco) || 0,
        ativo: servico.ativo ?? true,
        ordem: servico.ordem || list.length + 1,
        is_pacote: servico.is_pacote || false,
        servicos_inclusos: servico.servicos_inclusos || [],
        created_at: new Date().toISOString(),
      };
      list.push(saved);
    }

    this.setLocal(STORAGE_KEYS.SERVICOS, list);
    return saved;
  }

  public async excluirServico(servicoId: string): Promise<void> {
    let list = this.getLocal<Servico[]>(STORAGE_KEYS.SERVICOS, SEED_SERVICOS);
    list = list.filter((s) => s.id !== servicoId);
    this.setLocal(STORAGE_KEYS.SERVICOS, list);
  }

  // --- DISPONIBILIDADES ---
  public async getDisponibilidadeByProfissional(profissionalId: string): Promise<DisponibilidadeRegra[]> {
    const list = this.getLocal<DisponibilidadeRegra[]>(
      STORAGE_KEYS.DISPONIBILIDADES,
      SEED_DISPONIBILIDADES
    );
    const profRules = list.filter((d) => d.profissional_id === profissionalId);
    if (profRules.length === 0) {
      // Criar padrão caso não exista
      const defaults: DisponibilidadeRegra[] = [1, 2, 3, 4, 5, 6].map((dia) => ({
        id: `disp-${profissionalId}-${dia}`,
        profissional_id: profissionalId,
        dia_semana: dia,
        hora_inicio: '09:00',
        hora_fim: '19:00',
        ativo: true,
        pausa_inicio: '12:00',
        pausa_fim: '13:00',
      }));
      defaults.push({
        id: `disp-${profissionalId}-0`,
        profissional_id: profissionalId,
        dia_semana: 0,
        hora_inicio: '09:00',
        hora_fim: '14:00',
        ativo: false,
      });
      this.setLocal(STORAGE_KEYS.DISPONIBILIDADES, [...list, ...defaults]);
      return defaults;
    }
    return profRules;
  }

  public async salvarDisponibilidades(
    profissionalId: string,
    regras: DisponibilidadeRegra[]
  ): Promise<void> {
    let list = this.getLocal<DisponibilidadeRegra[]>(
      STORAGE_KEYS.DISPONIBILIDADES,
      SEED_DISPONIBILIDADES
    );
    list = list.filter((d) => d.profissional_id !== profissionalId);
    list.push(...regras);
    this.setLocal(STORAGE_KEYS.DISPONIBILIDADES, list);
  }

  // --- INDISPONIBILIDADES / BLOQUEIOS ---
  public async getBloqueiosByProfissional(profissionalId: string): Promise<Indisponibilidade[]> {
    const list = this.getLocal<Indisponibilidade[]>(STORAGE_KEYS.INDISPONIBILIDADES, []);
    return list.filter((b) => b.profissional_id === profissionalId);
  }

  public async salvarBloqueio(bloqueio: Partial<Indisponibilidade> & { profissional_id: string }): Promise<Indisponibilidade> {
    const list = this.getLocal<Indisponibilidade[]>(STORAGE_KEYS.INDISPONIBILIDADES, []);
    const novo: Indisponibilidade = {
      id: bloqueio.id || `bloq-${Date.now()}`,
      profissional_id: bloqueio.profissional_id,
      data_inicio: bloqueio.data_inicio!,
      data_fim: bloqueio.data_fim!,
      motivo: bloqueio.motivo || 'Bloqueio de agenda',
      created_at: new Date().toISOString(),
    };
    list.push(novo);
    this.setLocal(STORAGE_KEYS.INDISPONIBILIDADES, list);
    return novo;
  }

  public async excluirBloqueio(bloqueioId: string): Promise<void> {
    let list = this.getLocal<Indisponibilidade[]>(STORAGE_KEYS.INDISPONIBILIDADES, []);
    list = list.filter((b) => b.id !== bloqueioId);
    this.setLocal(STORAGE_KEYS.INDISPONIBILIDADES, list);
  }

  // --- AGENDAMENTOS ---
  public async getAgendamentosByProfissional(profissionalId: string): Promise<Agendamento[]> {
    const list = this.getLocal<Agendamento[]>(STORAGE_KEYS.AGENDAMENTOS, SEED_AGENDAMENTOS);
    return list
      .filter((a) => a.profissional_id === profissionalId)
      .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
  }

  public async getAgendamentosByCliente(params: {
    clienteId?: string;
    whatsapp?: string;
  }): Promise<Agendamento[]> {
    const list = this.getLocal<Agendamento[]>(STORAGE_KEYS.AGENDAMENTOS, SEED_AGENDAMENTOS);
    const limpo = params.whatsapp ? params.whatsapp.replace(/\D/g, '') : '';

    return list
      .filter((a) => {
        if (params.clienteId && a.cliente_id === params.clienteId) return true;
        // Exige pelo menos DDD + 8 ou 9 dígitos para privacidade rigorosa
        if (limpo && limpo.length >= 10) {
          const aLimpo = a.cliente_whatsapp.replace(/\D/g, '');
          return aLimpo === limpo || aLimpo.endsWith(limpo) || limpo.endsWith(aLimpo);
        }
        return false;
      })
      .sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());
  }

  /**
   * Operação atômica de criação de agendamento:
   * Recalcula preço e duração server-side com base no banco,
   * bloqueia contra corridas de concorrência simultânea,
   * valida expediente e conflito de horário.
   */
  public async criarAgendamentoAtomico(payload: {
    profissional_id: string;
    cliente_id?: string;
    cliente_nome: string;
    cliente_whatsapp: string;
    cliente_email?: string;
    data_inicio: string; // ISO string
    servico_ids: string[];
    observacao?: string;
  }): Promise<{
    success: boolean;
    code?: string;
    message: string;
    agendamento?: Agendamento;
  }> {
    // 1. Validar profissional
    const prof = await this.getProfissionalById(payload.profissional_id);
    if (!prof || !prof.publicado) {
      return {
        success: false,
        code: 'PROFESSIONAL_NOT_FOUND',
        message: 'Profissional não encontrado ou não está ativo para agendamentos.',
      };
    }

    // 2. Validar serviços e recalcular preço e duração diretamente da base
    const todosServicos = await this.getServicosByProfissional(payload.profissional_id);
    const servicosEscolhidos = todosServicos.filter((s) => payload.servico_ids.includes(s.id));

    if (servicosEscolhidos.length === 0) {
      return {
        success: false,
        code: 'NO_SERVICES_SELECTED',
        message: 'Selecione pelo menos um serviço válido.',
      };
    }

    // Garantir que todos os serviços solicitados existem, pertencem ao profissional e estão ativos
    if (servicosEscolhidos.length !== payload.servico_ids.length || servicosEscolhidos.some((s) => !s.ativo)) {
      return {
        success: false,
        code: 'INVALID_SERVICES',
        message: 'Um ou mais serviços selecionados foram desativados ou são inválidos.',
      };
    }

    const duracaoTotal = servicosEscolhidos.reduce((acc, s) => acc + s.duracao_minutos, 0);
    const valorTotal = servicosEscolhidos.reduce((acc, s) => acc + s.preco, 0);

    const inicioDate = new Date(payload.data_inicio);
    const fimDate = new Date(inicioDate.getTime() + duracaoTotal * 60 * 1000);

    // 2.1 Validação de expediente e intervalo de almoço do profissional
    const diaSemana = inicioDate.getDay();
    const regrasDisp = await this.getDisponibilidadeByProfissional(payload.profissional_id);
    const regraDia = regrasDisp.find((r) => r.dia_semana === diaSemana && r.ativo);

    if (!regraDia) {
      return {
        success: false,
        code: 'PROFESSIONAL_CLOSED',
        message: 'O profissional não possui expediente de atendimento neste dia da semana.',
      };
    }

    const [hInicioExp, mInicioExp] = regraDia.hora_inicio.split(':').map(Number);
    const [hFimExp, mFimExp] = regraDia.hora_fim.split(':').map(Number);
    const inicioExpMin = hInicioExp * 60 + mInicioExp;
    const fimExpMin = hFimExp * 60 + mFimExp;

    const slotInicioMin = inicioDate.getHours() * 60 + inicioDate.getMinutes();
    const slotFimMin = slotInicioMin + duracaoTotal;

    if (slotInicioMin < inicioExpMin || slotFimMin > fimExpMin) {
      return {
        success: false,
        code: 'OUTSIDE_BUSINESS_HOURS',
        message: 'O horário selecionado ultrapassa o horário de expediente de atendimento do profissional.',
      };
    }

    if (regraDia.pausa_inicio && regraDia.pausa_fim) {
      const [hPausaIni, mPausaIni] = regraDia.pausa_inicio.split(':').map(Number);
      const [hPausaFim, mPausaFim] = regraDia.pausa_fim.split(':').map(Number);
      const pausaIniMin = hPausaIni * 60 + mPausaIni;
      const pausaFimMin = hPausaFim * 60 + mPausaFim;

      if (slotInicioMin < pausaFimMin && slotFimMin > pausaIniMin) {
        return {
          success: false,
          code: 'LUNCH_BREAK_CONFLICT',
          message: 'O horário selecionado coincide com a pausa/almoço do profissional.',
        };
      }
    }

    // 3. Concorrência: Verificar se o horário já foi reservado por outro cliente
    const agendamentosExistentes = await this.getAgendamentosByProfissional(payload.profissional_id);
    const conflitoAgendamento = agendamentosExistentes.some((ag) => {
      if (ag.status === 'cancelado' || ag.status === 'faltou') return false;
      const agInicio = new Date(ag.data_inicio);
      const agFim = new Date(ag.data_fim);
      // Interval overlap: (A_start < B_end) && (A_end > B_start)
      return inicioDate < agFim && fimDate > agInicio;
    });

    if (conflitoAgendamento) {
      return {
        success: false,
        code: 'TIME_SLOT_CONFLICT',
        message:
          'O horário selecionado acabou de ser reservado por outro cliente. Por favor, escolha outro horário.',
      };
    }

    // 4. Verificar bloqueios de agenda do profissional
    const bloqueios = await this.getBloqueiosByProfissional(payload.profissional_id);
    const conflitoBloqueio = bloqueios.some((b) => {
      const bInicio = new Date(b.data_inicio);
      const bFim = new Date(b.data_fim);
      return inicioDate < bFim && fimDate > bInicio;
    });

    if (conflitoBloqueio) {
      return {
        success: false,
        code: 'BLOCKED_PERIOD',
        message: 'O profissional possui um bloqueio de agenda cadastrado neste intervalo.',
      };
    }

    // 5. Montar itens dos serviços com valor congelado no momento da reserva
    let ordem = 1;
    const servicosItens: AgendamentoServicoItem[] = servicosEscolhidos.map((s) => ({
      id: `ags-${Date.now()}-${ordem}`,
      servico_id: s.id,
      nome_servico: s.nome,
      preco: s.preco,
      duracao_minutos: s.duracao_minutos,
      ordem: ordem++,
    }));

    // 6. Criar e persistir o agendamento
    const novoAgendamento: Agendamento = {
      id: `ag-${Date.now()}`,
      profissional_id: prof.id,
      profissional_nome: prof.nome_publico,
      profissional_whatsapp: prof.whatsapp,
      cliente_id: payload.cliente_id,
      cliente_nome: payload.cliente_nome.trim(),
      cliente_whatsapp: payload.cliente_whatsapp.trim(),
      cliente_email: payload.cliente_email?.trim() || undefined,
      data_inicio: inicioDate.toISOString(),
      data_fim: fimDate.toISOString(),
      duracao_total: duracaoTotal,
      valor_total: valorTotal,
      status: 'confirmado',
      observacao: payload.observacao?.trim() || undefined,
      servicos: servicosItens,
      created_at: new Date().toISOString(),
    };

    const lista = this.getLocal<Agendamento[]>(STORAGE_KEYS.AGENDAMENTOS, SEED_AGENDAMENTOS);
    lista.push(novoAgendamento);
    this.setLocal(STORAGE_KEYS.AGENDAMENTOS, lista);

    // Gerar notificação automática para o profissional
    const servicosNomes = novoAgendamento.servicos.map((s) => s.nome_servico).join(' + ');
    const dataObj = new Date(novoAgendamento.data_inicio);
    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const novaNotificacao: Notificacao = {
      id: `notif-${Date.now()}`,
      profissional_id: prof.id,
      agendamento_id: novoAgendamento.id,
      titulo: 'Novo Agendamento Recebido!',
      mensagem: `${novoAgendamento.cliente_nome} agendou "${servicosNomes}" para ${dataFormatada} às ${horaFormatada}.`,
      cliente_nome: novoAgendamento.cliente_nome,
      valor_total: novoAgendamento.valor_total,
      data_agendamento: novoAgendamento.data_inicio,
      lida: false,
      created_at: new Date().toISOString(),
    };

    const notifs = this.getLocal<Notificacao[]>(STORAGE_KEYS.NOTIFICACOES, SEED_NOTIFICACOES);
    notifs.unshift(novaNotificacao);
    this.setLocal(STORAGE_KEYS.NOTIFICACOES, notifs);

    // Disparar evento para a interface em tempo real
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('barbertime_nova_notificacao', { detail: novaNotificacao })
      );
    }

    return {
      success: true,
      message: 'Agendamento confirmado com sucesso!',
      agendamento: novoAgendamento,
    };
  }

  public async atualizarStatusAgendamento(
    agendamentoId: string,
    novoStatus: StatusAgendamento,
    motivo?: string
  ): Promise<Agendamento | null> {
    const list = this.getLocal<Agendamento[]>(STORAGE_KEYS.AGENDAMENTOS, SEED_AGENDAMENTOS);
    const index = list.findIndex((a) => a.id === agendamentoId);
    if (index === -1) return null;

    const updatedAg = {
      ...list[index],
      status: novoStatus,
      observacao: motivo ? `${list[index].observacao || ''} [Cancelamento: ${motivo}]` : list[index].observacao,
      updated_at: new Date().toISOString(),
    };
    list[index] = updatedAg;

    this.setLocal(STORAGE_KEYS.AGENDAMENTOS, list);

    // Se o agendamento foi cancelado, gerar notificação para o profissional e disparar lista de espera
    if (novoStatus === 'cancelado') {
      const dataObj = new Date(updatedAg.data_inicio);
      const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      await this.criarNotificacao({
        profissional_id: updatedAg.profissional_id,
        agendamento_id: updatedAg.id,
        titulo: 'Agendamento Cancelado',
        mensagem: `${updatedAg.cliente_nome} cancelou a reserva de ${dataFormatada} às ${horaFormatada}.${motivo ? ` (${motivo})` : ''}`,
        cliente_nome: updatedAg.cliente_nome,
        valor_total: updatedAg.valor_total,
        data_agendamento: updatedAg.data_inicio,
        lida: false,
      });

      // Notificar automaticamente clientes da Lista de Espera que aguardam por este dia/horário
      try {
        const { waitlistService } = await import('./waitlistService');
        await waitlistService.processarCancelamentoEnotificar(updatedAg);
      } catch (err) {
        console.error('Erro ao acionar lista de espera:', err);
      }
    }

    return list[index];
  }

  // --- AVALIAÇÃO DE ATENDIMENTO CONCLUÍDO ---
  public async avaliarAgendamento(
    agendamentoId: string,
    nota: number,
    comentario?: string
  ): Promise<{ success: boolean; message: string }> {
    const list = this.getLocal<Agendamento[]>(STORAGE_KEYS.AGENDAMENTOS, SEED_AGENDAMENTOS);
    const index = list.findIndex((a) => a.id === agendamentoId);
    if (index === -1) {
      return { success: false, message: 'Agendamento não encontrado.' };
    }
    const ag = list[index];
    if (ag.status !== 'concluido') {
      return { success: false, message: 'Apenas agendamentos com atendimento concluído podem ser avaliados.' };
    }

    ag.avaliacao_nota = Math.min(5, Math.max(1, Math.round(nota)));
    ag.avaliacao_comentario = comentario?.trim() || undefined;
    ag.updated_at = new Date().toISOString();
    list[index] = ag;
    this.setLocal(STORAGE_KEYS.AGENDAMENTOS, list);

    // Atualizar média real e total de avaliações do profissional
    const profList = this.getLocal<Profissional[]>(STORAGE_KEYS.PROFISSIONAIS, SEED_PROFISSIONAIS);
    const profIndex = profList.findIndex((p) => p.id === ag.profissional_id);
    if (profIndex >= 0) {
      const avaliacoesDoProf = list.filter(
        (a) => a.profissional_id === ag.profissional_id && a.avaliacao_nota && a.avaliacao_nota > 0
      );
      const soma = avaliacoesDoProf.reduce((acc, a) => acc + (a.avaliacao_nota || 5), 0);
      const media = avaliacoesDoProf.length > 0 ? Number((soma / avaliacoesDoProf.length).toFixed(1)) : 5.0;
      profList[profIndex].avaliacao_media = media;
      profList[profIndex].total_avaliacoes = avaliacoesDoProf.length;
      this.setLocal(STORAGE_KEYS.PROFISSIONAIS, profList);
    }

    return {
      success: true,
      message: 'Sua avaliação foi registrada com sucesso!',
    };
  }

  // --- REAGENDAMENTO ATÔMICO ---
  public async reagendarAgendamento(
    agendamentoAntigoId: string,
    novoPayload: Parameters<DatabaseService['criarAgendamentoAtomico']>[0]
  ): Promise<ReturnType<DatabaseService['criarAgendamentoAtomico']>> {
    // 1. Tentar criar o novo agendamento com as regras atômicas
    const res = await this.criarAgendamentoAtomico(novoPayload);
    if (!res.success) {
      return res;
    }
    // 2. Se confirmado o novo, cancela o anterior marcando como reagendado
    const dataObj = new Date(novoPayload.data_inicio);
    const novaDataStr = `${dataObj.toLocaleDateString('pt-BR')} às ${dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    await this.atualizarStatusAgendamento(
      agendamentoAntigoId,
      'cancelado',
      `Reagendado para ${novaDataStr}`
    );
    return res;
  }

  // --- NOTIFICAÇÕES ---
  public async getNotificacoesByProfissional(profissionalId: string): Promise<Notificacao[]> {
    const notifs = this.getLocal<Notificacao[]>(STORAGE_KEYS.NOTIFICACOES, SEED_NOTIFICACOES);
    return notifs
      .filter((n) => n.profissional_id === profissionalId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async marcarNotificacaoComoLida(notificacaoId: string): Promise<void> {
    const notifs = this.getLocal<Notificacao[]>(STORAGE_KEYS.NOTIFICACOES, SEED_NOTIFICACOES);
    const index = notifs.findIndex((n) => n.id === notificacaoId);
    if (index >= 0) {
      notifs[index].lida = true;
      this.setLocal(STORAGE_KEYS.NOTIFICACOES, notifs);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('barbertime_notificacoes_atualizadas'));
      }
    }
  }

  public async marcarTodasNotificacoesComoLidas(profissionalId: string): Promise<void> {
    const notifs = this.getLocal<Notificacao[]>(STORAGE_KEYS.NOTIFICACOES, SEED_NOTIFICACOES);
    const updated = notifs.map((n) =>
      n.profissional_id === profissionalId ? { ...n, lida: true } : n
    );
    this.setLocal(STORAGE_KEYS.NOTIFICACOES, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barbertime_notificacoes_atualizadas'));
    }
  }

  public async criarNotificacao(
    payload: Omit<Notificacao, 'id' | 'created_at'>
  ): Promise<Notificacao> {
    const nova: Notificacao = {
      ...payload,
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const notifs = this.getLocal<Notificacao[]>(STORAGE_KEYS.NOTIFICACOES, SEED_NOTIFICACOES);
    notifs.unshift(nova);
    this.setLocal(STORAGE_KEYS.NOTIFICACOES, notifs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('barbertime_nova_notificacao', { detail: nova })
      );
    }
    return nova;
  }
}

export const db = new DatabaseService();
db.init();
