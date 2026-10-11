import {
  ListaEsperaItem,
  StatusListaEspera,
  Agendamento,
  Profissional,
} from '../types';
import { db } from './db';
import {
  formatDateBr,
  formatTimeOnly,
  generateWhatsAppLink,
  cleanPhone,
} from '../utils/formatters';

const STORAGE_KEYS = {
  LISTA_ESPERA: 'barbertime_lista_espera_v1',
};

// Seed inicial para demonstração e testes práticos
const getSeedListaEspera = (): ListaEsperaItem[] => {
  const hoje = new Date();
  const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(
    hoje.getDate()
  ).padStart(2, '0')}`;

  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);
  const amanhaIso = `${amanha.getFullYear()}-${String(amanha.getMonth() + 1).padStart(2, '0')}-${String(
    amanha.getDate()
  ).padStart(2, '0')}`;

  return [
    {
      id: 'wait-1',
      profissional_id: 'prof-dombarba',
      profissional_nome: 'Barbearia Dom Barba & Lounge',
      cliente_nome: 'Lucas Silveira',
      cliente_whatsapp: '11988887766',
      cliente_email: 'lucas.silveira@email.com',
      data_desejada: amanhaIso,
      horario_desejado: '14:00',
      servico_id: 'serv-1',
      servico_nome: 'Corte Clássico Executivo',
      observacao: 'Preferência por horário após o almoço caso alguém cancele.',
      status: 'aguardando',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'wait-2',
      profissional_id: 'prof-dombarba',
      profissional_nome: 'Barbearia Dom Barba & Lounge',
      cliente_nome: 'Felipe Albuquerque',
      cliente_whatsapp: '11977776655',
      cliente_email: 'felipe.albuquerque@email.com',
      data_desejada: amanhaIso,
      horario_desejado: 'qualquer',
      servico_id: 'serv-3',
      servico_nome: 'Combo Cabelo & Barboterapia',
      observacao: 'Qualquer horário vago à tarde me serve.',
      status: 'aguardando',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'wait-3',
      profissional_id: 'prof-dombarba',
      profissional_nome: 'Barbearia Dom Barba & Lounge',
      cliente_nome: 'Rodrigo Mendonça',
      cliente_whatsapp: '11966665544',
      cliente_email: 'rodrigo.m@email.com',
      data_desejada: hojeIso,
      horario_desejado: '10:00',
      servico_id: 'serv-2',
      servico_nome: 'Barba Terapia com Toalha Quente',
      status: 'notificado',
      horario_liberado: '10:00 às 10:45',
      notificado_em: new Date(Date.now() - 3600000 * 2).toISOString(),
      mensagem_notificacao: 'Olá Rodrigo! Uma vaga foi liberada para hoje às 10:00.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'wait-4',
      profissional_id: 'prof-elegance',
      profissional_nome: 'Studio Elegance Hair & Visagismo',
      cliente_nome: 'Mariana Duarte',
      cliente_whatsapp: '11955554433',
      cliente_email: 'mariana.duarte@email.com',
      data_desejada: amanhaIso,
      horario_desejado: '16:00',
      servico_id: 'serv-5',
      servico_nome: 'Corte & Visagismo Feminino',
      observacao: 'Tenho evento à noite, preciso de vaga com urgência.',
      status: 'aguardando',
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
  ];
};

class WaitlistService {
  private getLocalList(): ListaEsperaItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LISTA_ESPERA);
      if (raw) {
        return JSON.parse(raw);
      }
      const initial = getSeedListaEspera();
      localStorage.setItem(STORAGE_KEYS.LISTA_ESPERA, JSON.stringify(initial));
      return initial;
    } catch {
      return getSeedListaEspera();
    }
  }

  private setLocalList(list: ListaEsperaItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LISTA_ESPERA, JSON.stringify(list));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('barbertime_lista_espera_atualizada', { detail: list })
        );
      }
    } catch (e) {
      console.error('Erro ao salvar lista de espera:', e);
    }
  }

  // Obter lista filtrada por profissional e status
  public async getLista(
    profissionalId?: string,
    status?: StatusListaEspera
  ): Promise<ListaEsperaItem[]> {
    const list = this.getLocalList();
    return list.filter((item) => {
      if (profissionalId && item.profissional_id !== profissionalId) return false;
      if (status && item.status !== status) return false;
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Obter lista de espera de um cliente específico (pelo whatsapp)
  public async getListaByCliente(whatsapp: string): Promise<ListaEsperaItem[]> {
    const cleaned = cleanPhone(whatsapp);
    const list = this.getLocalList();
    return list.filter((item) => cleanPhone(item.cliente_whatsapp) === cleaned);
  }

  // Adicionar um novo cliente à lista de espera
  public async entrarListaEspera(
    payload: Omit<ListaEsperaItem, 'id' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<ListaEsperaItem> {
    const list = this.getLocalList();

    const novoItem: ListaEsperaItem = {
      ...payload,
      id: `wait-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'aguardando',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    list.unshift(novoItem);
    this.setLocalList(list);

    // Gerar notificação interna para o profissional
    const dataFormatada = formatDateBr(novoItem.data_desejada);
    const horaFormatada = novoItem.horario_desejado && novoItem.horario_desejado !== 'qualquer'
      ? `para às ${novoItem.horario_desejado}`
      : 'para qualquer horário vago';

    await db.criarNotificacao({
      profissional_id: novoItem.profissional_id,
      agendamento_id: '',
      titulo: 'Novo Cliente na Lista de Espera',
      mensagem: `${novoItem.cliente_nome} entrou na lista de espera para ${dataFormatada} (${horaFormatada}).`,
      cliente_nome: novoItem.cliente_nome,
      valor_total: 0,
      data_agendamento: novoItem.data_desejada,
      lida: false,
    });

    return novoItem;
  }

  // Atualizar o status de um item (ex: 'agendado', 'cancelado')
  public async atualizarStatus(
    id: string,
    novoStatus: StatusListaEspera
  ): Promise<ListaEsperaItem | null> {
    const list = this.getLocalList();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      status: novoStatus,
      updated_at: new Date().toISOString(),
    };

    this.setLocalList(list);
    return list[index];
  }

  // Remover item da lista
  public async remover(id: string): Promise<boolean> {
    const list = this.getLocalList();
    const filtered = list.filter((item) => item.id !== id);
    if (filtered.length !== list.length) {
      this.setLocalList(filtered);
      return true;
    }
    return false;
  }

  // Montar texto de notificação de vaga liberada
  public gerarMensagemVagaLiberada(
    item: ListaEsperaItem,
    dataLiberada: string,
    horarioLiberado: string,
    profissionalNome: string,
    linkPerfil?: string
  ): string {
    const dataFmt = formatDateBr(dataLiberada);
    const link = linkPerfil || (typeof window !== 'undefined' ? window.location.origin : 'https://barbertime.app');

    return `Olá, *${item.cliente_nome}*! 👋 Boas notícias da *${profissionalNome}*! 💈\n\nUma vaga que você aguardava na nossa *Lista de Espera* acabou de ser liberada por desistência/cancelamento:\n\n📅 *Data:* ${dataFmt}\n⏰ *Horário Liberado:* ${horarioLiberado}${item.servico_nome ? `\n✂️ *Serviço de interesse:* ${item.servico_nome}` : ''}\n\nGaranta sua vaga agora mesmo acessando o link:\n👉 ${link}\n\n_Horário sujeito a preenchimento por ordem de resposta._ Te esperamos!`;
  }

  // Disparar notificação individual com geração de link WhatsApp
  public notificarClienteIndividual(
    item: ListaEsperaItem,
    horarioLiberado: string,
    linkPerfil?: string
  ): { linkWhatsApp: string; mensagem: string } {
    const mensagem = this.gerarMensagemVagaLiberada(
      item,
      item.data_desejada,
      horarioLiberado,
      item.profissional_nome,
      linkPerfil
    );

    const linkWhatsApp = generateWhatsAppLink(item.cliente_whatsapp, mensagem);

    // Atualiza status para 'notificado'
    this.atualizarStatus(item.id, 'notificado');

    return { linkWhatsApp, mensagem };
  }

  /**
   * CORE AUTOMATION:
   * Processar um agendamento recém-cancelado e notificar automaticamente todos
   * os clientes na lista de espera que solicitaram aquela data e horário.
   */
  public async processarCancelamentoEnotificar(
    agendamentoCancelado: Agendamento,
    linkPerfilBase?: string
  ): Promise<{
    notificados: ListaEsperaItem[];
    totalNotificados: number;
    horarioLiberado: string;
    dataLiberada: string;
  }> {
    if (!agendamentoCancelado) {
      return { notificados: [], totalNotificados: 0, horarioLiberado: '', dataLiberada: '' };
    }

    const dataInicioObj = new Date(agendamentoCancelado.data_inicio);
    const dataFimObj = new Date(agendamentoCancelado.data_fim);

    // Formatar data no padrão YYYY-MM-DD
    const ano = dataInicioObj.getFullYear();
    const mes = String(dataInicioObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataInicioObj.getDate()).padStart(2, '0');
    const dataCanceladaIso = `${ano}-${mes}-${dia}`;

    const horaInicioStr = formatTimeOnly(agendamentoCancelado.data_inicio);
    const horaFimStr = formatTimeOnly(agendamentoCancelado.data_fim);
    const faixaHorarioLiberado = `${horaInicioStr} às ${horaFimStr}`;

    const list = this.getLocalList();

    // Filtrar candidatos na lista de espera:
    // 1. Mesmo profissional
    // 2. Mesma data desejada
    // 3. Status 'aguardando'
    // 4. Horário compatível (qualquer horário OU horário desejado bate com início ou turno)
    const horaInicioNum = dataInicioObj.getHours();

    const candidatos = list.filter((item) => {
      if (item.profissional_id !== agendamentoCancelado.profissional_id) return false;
      if (item.data_desejada !== dataCanceladaIso) return false;
      if (item.status !== 'aguardando') return false;

      // Se não especificou horário ou marcou 'qualquer'
      if (!item.horario_desejado || item.horario_desejado === 'qualquer') return true;

      // Se marcou turno
      if (item.horario_desejado === 'manha' && horaInicioNum < 12) return true;
      if (item.horario_desejado === 'tarde' && horaInicioNum >= 12 && horaInicioNum < 18) return true;
      if (item.horario_desejado === 'noite' && horaInicioNum >= 18) return true;

      // Se especificou horário exato ou próximo (tolerância de +- 30 minutos)
      const [hDesejado, mDesejado] = item.horario_desejado.split(':').map(Number);
      if (!isNaN(hDesejado)) {
        const minDesejado = hDesejado * 60 + (mDesejado || 0);
        const minLiberado = dataInicioObj.getHours() * 60 + dataInicioObj.getMinutes();
        const diff = Math.abs(minDesejado - minLiberado);
        if (diff <= 45) return true;
      }

      return false;
    });

    if (candidatos.length === 0) {
      return {
        notificados: [],
        totalNotificados: 0,
        horarioLiberado: faixaHorarioLiberado,
        dataLiberada: dataCanceladaIso,
      };
    }

    const agoraIso = new Date().toISOString();
    const notificadosAtualizados: ListaEsperaItem[] = [];

    // Atualizar cada candidato encontrado
    for (const cand of candidatos) {
      const index = list.findIndex((x) => x.id === cand.id);
      if (index !== -1) {
        const mensagemTexto = this.gerarMensagemVagaLiberada(
          cand,
          dataCanceladaIso,
          faixaHorarioLiberado,
          cand.profissional_nome || agendamentoCancelado.profissional_nome || 'BarberTime',
          linkPerfilBase
        );

        const atualizado: ListaEsperaItem = {
          ...list[index],
          status: 'notificado',
          notificado_em: agoraIso,
          horario_liberado: faixaHorarioLiberado,
          agendamento_origem_id: agendamentoCancelado.id,
          mensagem_notificacao: mensagemTexto,
          updated_at: agoraIso,
        };

        list[index] = atualizado;
        notificadosAtualizados.push(atualizado);
      }
    }

    // Persistir lista com novos status
    this.setLocalList(list);

    // Criar notificação para o painel do profissional
    const dataBr = formatDateBr(dataCanceladaIso);
    await db.criarNotificacao({
      profissional_id: agendamentoCancelado.profissional_id,
      agendamento_id: agendamentoCancelado.id,
      titulo: '🔔 Lista de Espera: Vaga Liberada!',
      mensagem: `O cancelamento de ${agendamentoCancelado.cliente_nome} liberou o horário das ${faixaHorarioLiberado} em ${dataBr}. ${notificadosAtualizados.length} cliente(s) da Lista de Espera foram notificados automaticamente!`,
      cliente_nome: notificadosAtualizados.map((c) => c.cliente_nome).join(', '),
      valor_total: agendamentoCancelado.valor_total,
      data_agendamento: agendamentoCancelado.data_inicio,
      lida: false,
    });

    // Disparar evento global para alerta em tempo real na interface
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('barbertime_vaga_liberada_alerta', {
          detail: {
            horarioLiberado: faixaHorarioLiberado,
            dataLiberada: dataBr,
            notificados: notificadosAtualizados,
          },
        })
      );
    }

    return {
      notificados: notificadosAtualizados,
      totalNotificados: notificadosAtualizados.length,
      horarioLiberado: faixaHorarioLiberado,
      dataLiberada: dataCanceladaIso,
    };
  }
}

export const waitlistService = new WaitlistService();
