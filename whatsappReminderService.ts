import {
  Agendamento,
  Profissional,
  LembreteWhatsAppItem,
  FilaLembreteConfig,
} from '../types';
import { db } from './db';
import {
  formatDateBr,
  formatTimeOnly,
  formatMoney,
  cleanPhone,
  generateWhatsAppLink,
} from '../utils/formatters';

const STORAGE_KEYS = {
  FILA_LEMBRETES: 'barbertime_fila_lembretes_whatsapp_v1',
  CONFIG_LEMBRETES: 'barbertime_config_lembretes_whatsapp_v1',
};

const DEFAULT_CONFIG: FilaLembreteConfig = {
  autoVerificar: true,
  diasAntecedencia: 1, // 1 dia = agendamentos do dia seguinte
  horarioDisparoPreferencia: '08:00',
  templateMensagemPadrao:
    'Olá, {cliente_nome}! 👋 Passando para lembrar do seu agendamento no *{profissional_nome}* amanhã ({data}) às *{horario}*.\n\n✂️ *Serviço(s):* {servicos}\n💰 *Valor:* {valor}\n\nPor favor, nos avise se precisar reagendar ou se tiver qualquer imprevisto. Te esperamos!',
};

class WhatsAppReminderQueueService {
  private isProcessing = false;
  private intervalTimer: any = null;

  constructor() {
    this.init();
  }

  private init() {
    // Configura listeners ou verificação periódica caso em browser
    if (typeof window !== 'undefined') {
      // Inicia verificação leve periódica se configurado
      this.iniciarMonitoramentoAutomatico();
    }
  }

  public getConfig(): FilaLembreteConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG_LEMBRETES);
      if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  }

  public saveConfig(config: Partial<FilaLembreteConfig>): FilaLembreteConfig {
    const atual = this.getConfig();
    const merged = { ...atual, ...config };
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG_LEMBRETES, JSON.stringify(merged));
    } catch {
      // fallback
    }
    return merged;
  }

  public getFila(profissionalId?: string): LembreteWhatsAppItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FILA_LEMBRETES);
      if (raw) {
        const parsed: LembreteWhatsAppItem[] = JSON.parse(raw);
        if (profissionalId) {
          return parsed.filter((item) => item.profissional_id === profissionalId);
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  }

  private saveFila(fila: LembreteWhatsAppItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.FILA_LEMBRETES, JSON.stringify(fila));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('barbertime_fila_lembretes_atualizada'));
      }
    } catch {
      // ignore
    }
  }

  /**
   * Constrói a mensagem personalizada a partir do template e dados do agendamento
   */
  public comporMensagem(
    template: string,
    agendamento: Agendamento,
    profissionalNome: string
  ): string {
    const dataObj = new Date(agendamento.data_inicio);
    const dataFormatada = formatDateBr(dataObj);
    const horaFormatada = formatTimeOnly(dataObj);
    const servicosFormatados = agendamento.servicos.map((s) => s.nome_servico).join(' + ');
    const valorFormatado = formatMoney(agendamento.valor_total);

    return template
      .replace(/{cliente_nome}/g, agendamento.cliente_nome.split(' ')[0] || agendamento.cliente_nome)
      .replace(/{profissional_nome}/g, profissionalNome)
      .replace(/{data}/g, dataFormatada)
      .replace(/{horario}/g, horaFormatada)
      .replace(/{servicos}/g, servicosFormatados)
      .replace(/{valor}/g, valorFormatado);
  }

  /**
   * Calcula a data YYYY-MM-DD do dia seguinte relativa a uma data base
   */
  public getDataDiaSeguinte(dataReferencia: Date = new Date()): {
    dataStr: string; // "YYYY-MM-DD"
    inicioIso: string;
    fimIso: string;
  } {
    const amanha = new Date(dataReferencia);
    amanha.setDate(amanha.getDate() + 1);

    const ano = amanha.getFullYear();
    const mes = String(amanha.getMonth() + 1).padStart(2, '0');
    const dia = String(amanha.getDate()).padStart(2, '0');
    const dataStr = `${ano}-${mes}-${dia}`;

    const inicioIso = new Date(ano, amanha.getMonth(), amanha.getDate(), 0, 0, 0, 0).toISOString();
    const fimIso = new Date(ano, amanha.getMonth(), amanha.getDate(), 23, 59, 59, 999).toISOString();

    return { dataStr, inicioIso, fimIso };
  }

  /**
   * Varre todos os agendamentos ou de um profissional específico para o DIA SEGUINTE
   * e enfileira lembretes que ainda não foram criados ou disparados.
   */
  public async verificarAgendamentosDiaSeguinte(profissionalId?: string): Promise<{
    enfileirados: number;
    jaExistentes: number;
    totalAgendamentosAmanha: number;
    itens: LembreteWhatsAppItem[];
  }> {
    const config = this.getConfig();
    const { dataStr, inicioIso, fimIso } = this.getDataDiaSeguinte();
    const inicioTime = new Date(inicioIso).getTime();
    const fimTime = new Date(fimIso).getTime();

    // 1. Obter agendamentos do profissional ou de todos
    let agendamentos: Agendamento[] = [];
    if (profissionalId) {
      agendamentos = await db.getAgendamentosByProfissional(profissionalId);
    } else {
      // Todos os agendamentos registrados
      const raw = localStorage.getItem('barbertime_agendamentos_v1');
      if (raw) {
        agendamentos = JSON.parse(raw);
      }
    }

    // Filtrar agendamentos confirmados cujo início esteja dentro do dia seguinte
    const agendamentosAmanha = agendamentos.filter((ag) => {
      if (ag.status !== 'confirmado') return false;
      const t = new Date(ag.data_inicio).getTime();
      return t >= inicioTime && t <= fimTime;
    });

    const filaAtual = this.getFila();
    let novosItens: LembreteWhatsAppItem[] = [];
    let jaExistentes = 0;

    for (const ag of agendamentosAmanha) {
      // Checar se já existe lembrete para este agendamento na fila
      const jaExiste = filaAtual.some(
        (f) => f.agendamento_id === ag.id && (f.status === 'enviado' || f.status === 'pendente')
      );

      if (jaExiste) {
        jaExistentes++;
        continue;
      }

      // Buscar profissional para compor mensagem com nome correto
      const prof = await db.getProfissionalById(ag.profissional_id);
      const profNome = prof?.nome_publico || ag.profissional_nome || 'BarberTime';

      const textoMensagem = this.comporMensagem(config.templateMensagemPadrao, ag, profNome);
      const linkWhatsApp = generateWhatsAppLink(ag.cliente_whatsapp, textoMensagem);

      const novoLembrete: LembreteWhatsAppItem = {
        id: `lemb-${ag.id}-${Date.now()}`,
        agendamento_id: ag.id,
        profissional_id: ag.profissional_id,
        profissional_nome: profNome,
        cliente_nome: ag.cliente_nome,
        cliente_whatsapp: ag.cliente_whatsapp,
        data_agendamento: ag.data_inicio,
        servicos_nomes: ag.servicos.map((s) => s.nome_servico).join(', '),
        valor_total: ag.valor_total,
        mensagem_texto: textoMensagem,
        link_whatsapp: linkWhatsApp,
        status: 'pendente',
        data_alvo: dataStr,
        tentativas: 0,
        created_at: new Date().toISOString(),
      };

      novosItens.push(novoLembrete);
    }

    if (novosItens.length > 0) {
      const filaAtualizada = [...novosItens, ...filaAtual];
      this.saveFila(filaAtualizada);
    }

    const filaFinal = this.getFila(profissionalId);

    return {
      enfileirados: novosItens.length,
      jaExistentes,
      totalAgendamentosAmanha: agendamentosAmanha.length,
      itens: filaFinal,
    };
  }

  /**
   * Dispara um lembrete específico:
   * Abre o canal WhatsApp (Web/App) e atualiza o status na fila para 'enviado'.
   */
  public async dispararLembrete(lembreteId: string): Promise<LembreteWhatsAppItem | null> {
    const fila = this.getFila();
    const index = fila.findIndex((item) => item.id === lembreteId);
    if (index === -1) return null;

    const item = fila[index];
    item.status = 'enviando';
    item.tentativas = (item.tentativas || 0) + 1;
    this.saveFila(fila);

    try {
      // Disparo real: Abre o link oficial do WhatsApp na nova aba / app
      if (typeof window !== 'undefined') {
        const win = window.open(item.link_whatsapp, '_blank', 'noopener,noreferrer');
        if (!win) {
          // Se popup blocker bloquear, redireciona pelo location ou salva com tentativa
          window.location.href = item.link_whatsapp;
        }
      }

      item.status = 'enviado';
      item.enviado_em = new Date().toISOString();
      item.updated_at = new Date().toISOString();
      this.saveFila(fila);
      return item;
    } catch (err: any) {
      item.status = 'falha';
      item.erro_mensagem = err?.message || 'Falha ao acionar WhatsApp';
      item.updated_at = new Date().toISOString();
      this.saveFila(fila);
      return item;
    }
  }

  /**
   * Processa em lote toda a fila de pendentes
   */
  public async processarFilaPendente(profissionalId?: string): Promise<{
    processados: number;
    sucessos: number;
    erros: number;
  }> {
    if (this.isProcessing) {
      return { processados: 0, sucessos: 0, erros: 0 };
    }

    this.isProcessing = true;
    const fila = this.getFila(profissionalId);
    const pendentes = fila.filter((f) => f.status === 'pendente');

    let sucessos = 0;
    let erros = 0;

    for (const item of pendentes) {
      try {
        const res = await this.dispararLembrete(item.id);
        if (res && res.status === 'enviado') {
          sucessos++;
        } else {
          erros++;
        }
        // Pequena pausa entre aberturas de aba para conforto do navegador
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch {
        erros++;
      }
    }

    this.isProcessing = false;
    return {
      processados: pendentes.length,
      sucessos,
      erros,
    };
  }

  /**
   * Cancela ou remove um item da fila
   */
  public cancelarLembrete(lembreteId: string): boolean {
    const fila = this.getFila();
    const index = fila.findIndex((f) => f.id === lembreteId);
    if (index === -1) return false;

    fila[index].status = 'cancelado';
    fila[index].updated_at = new Date().toISOString();
    this.saveFila(fila);
    return true;
  }

  /**
   * Limpa itens concluídos ou cancelados da fila
   */
  public limparFilaConcluida(profissionalId?: string) {
    const fila = this.getFila();
    const restantes = fila.filter((item) => {
      if (profissionalId && item.profissional_id !== profissionalId) return true;
      return item.status === 'pendente';
    });
    this.saveFila(restantes);
  }

  /**
   * Inicia timer leve no cliente para monitoramento em segundo plano
   */
  public iniciarMonitoramentoAutomatico() {
    if (this.intervalTimer) return;
    // Checagem a cada 5 minutos
    this.intervalTimer = setInterval(() => {
      const cfg = this.getConfig();
      if (cfg.autoVerificar) {
        this.verificarAgendamentosDiaSeguinte().catch(() => {});
      }
    }, 5 * 60 * 1000);
  }

  public pararMonitoramentoAutomatico() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }
}

export const whatsAppReminderService = new WhatsAppReminderQueueService();
