import { db } from '../src/services/db';
import { checkRedundantServices, calculateAvailableSlots } from '../src/utils/availability';

// Test runner minimalista e autônomo em TypeScript
async function runAcceptanceTests() {
  console.log('================================================================');
  console.log('BARBERTIME — SUÍTE DE TESTES DE ACEITAÇÃO & AUDITORIA DE REGRAS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       Detalhe: ${detail}`);
      failed++;
    }
  }

  // Inicializar banco
  db.init();

  try {
    // -------------------------------------------------------------
    // TESTE 1: Cadastro e autenticação / Perfil profissional
    // -------------------------------------------------------------
    const profs = await db.getProfissionais();
    const domBarba = profs.find((p) => p.slug === 'dom-barba');
    assert(Boolean(domBarba), 'Teste 1: Profissional mestre cadastrado e recuperável');

    // -------------------------------------------------------------
    // TESTE 2: Criação e edição de serviços
    // -------------------------------------------------------------
    const novoServico = await db.salvarServico({
      profissional_id: domBarba!.id,
      nome: 'Alinhamento de Barba Express',
      descricao: 'Acabamento rápido',
      duracao_minutos: 20,
      preco: 30.0,
      ativo: true,
    });
    assert(
      novoServico.nome === 'Alinhamento de Barba Express' && novoServico.preco === 30,
      'Teste 2a: Criação de serviço com preço e duração corretos'
    );

    const servicoEditado = await db.salvarServico({
      ...novoServico,
      preco: 35.0,
      duracao_minutos: 25,
    });
    assert(
      servicoEditado.preco === 35 && servicoEditado.duracao_minutos === 25,
      'Teste 2b: Edição de preço e duração do serviço persistida'
    );

    // -------------------------------------------------------------
    // TESTE 3: Pesquisa de profissionais publicados
    // -------------------------------------------------------------
    const buscaSp = await db.getProfissionais({ cidade: 'São Paulo' });
    assert(
      buscaSp.length > 0 && buscaSp.every((p) => p.cidade.includes('São Paulo') && p.publicado),
      'Teste 3a: Pesquisa por cidade retorna apenas profissionais publicados'
    );

    const buscaCat = await db.getProfissionais({ categoriaSlug: 'barbearia' });
    assert(
      buscaCat.length > 0 && buscaCat.some((p) => p.slug === 'dom-barba'),
      'Teste 3b: Filtro por categoria "barbearia" funciona corretamente'
    );

    // -------------------------------------------------------------
    // TESTE 4: Agendamento com um serviço (Público, sem conta)
    // -------------------------------------------------------------
    const amanhã = new Date();
    amanhã.setDate(amanhã.getDate() + 2);
    // Ajustar para dia útil (Segunda a Sábado)
    if (amanhã.getDay() === 0) amanhã.setDate(amanhã.getDate() + 1);
    amanhã.setHours(10, 0, 0, 0);

    const resSingle = await db.criarAgendamentoAtomico({
      profissional_id: domBarba!.id,
      cliente_nome: 'Marcos Vinicius',
      cliente_whatsapp: '11988887777',
      data_inicio: amanhã.toISOString(),
      servico_ids: ['srv-corte-dom'],
    });

    assert(
      resSingle.success && resSingle.agendamento !== undefined,
      'Teste 4: Agendamento com serviço único criado e persistido sem conta'
    );

    // -------------------------------------------------------------
    // TESTE 5 & 6: Agendamento com múltiplos serviços & Recálculo no backend
    // -------------------------------------------------------------
    const dataMulti = new Date(amanhã);
    dataMulti.setHours(14, 0, 0, 0);

    const resMulti = await db.criarAgendamentoAtomico({
      profissional_id: domBarba!.id,
      cliente_nome: 'Julio Cesar',
      cliente_whatsapp: '11977776666',
      data_inicio: dataMulti.toISOString(),
      servico_ids: ['srv-corte-dom', 'srv-sobrancelha-dom'], // Corte (50, 40m) + Sobrancelha (25, 15m)
    });

    const multiOk =
      resMulti.success &&
      resMulti.agendamento?.valor_total === 75 &&
      resMulti.agendamento?.duracao_total === 55 &&
      resMulti.agendamento?.servicos.length === 2 &&
      resMulti.agendamento?.servicos[0].ordem === 1 &&
      resMulti.agendamento?.servicos[1].ordem === 2;

    assert(
      multiOk,
      'Teste 5 & 6: Múltiplos serviços com soma correta no backend (R$ 75, 55min) e ordem preservada'
    );

    // -------------------------------------------------------------
    // TESTE 7: Recusa de horários fora do expediente
    // -------------------------------------------------------------
    const dataForaExpediente = new Date(amanhã);
    dataForaExpediente.setHours(23, 0, 0, 0); // 23h da noite (fechado)

    const resFora = await db.criarAgendamentoAtomico({
      profissional_id: domBarba!.id,
      cliente_nome: 'Tentativa Noturna',
      cliente_whatsapp: '11911112222',
      data_inicio: dataForaExpediente.toISOString(),
      servico_ids: ['srv-corte-dom'],
    });

    assert(
      !resFora.success && resFora.code === 'OUTSIDE_BUSINESS_HOURS',
      'Teste 7: Backend recusa agendamento fora do expediente de atendimento'
    );

    // -------------------------------------------------------------
    // TESTE 8: Recusa de horários durante pausas / almoço
    // -------------------------------------------------------------
    const dataAlmoco = new Date(amanhã);
    dataAlmoco.setHours(12, 45, 0, 0); // Dom Barba pausa das 12:30 às 13:30

    const resAlmoco = await db.criarAgendamentoAtomico({
      profissional_id: domBarba!.id,
      cliente_nome: 'Tentativa Almoço',
      cliente_whatsapp: '11911112222',
      data_inicio: dataAlmoco.toISOString(),
      servico_ids: ['srv-corte-dom'],
    });

    assert(
      !resAlmoco.success && resAlmoco.code === 'LUNCH_BREAK_CONFLICT',
      'Teste 8: Backend recusa agendamento no intervalo de pausa/almoço'
    );

    // -------------------------------------------------------------
    // TESTE 9: Prevenção de reservas sobrepostas (Duplo Agendamento)
    // -------------------------------------------------------------
    // Tentar reservar no mesmo horário que o resMulti (14:00 às 14:55)
    const dataSobreposta = new Date(dataMulti);
    dataSobreposta.setMinutes(dataSobreposta.getMinutes() + 15); // 14:15 colide diretamente

    const resSobreposta = await db.criarAgendamentoAtomico({
      profissional_id: domBarba!.id,
      cliente_nome: 'Cliente Conflitante',
      cliente_whatsapp: '11999990000',
      data_inicio: dataSobreposta.toISOString(),
      servico_ids: ['srv-corte-dom'],
    });

    assert(
      !resSobreposta.success && resSobreposta.code === 'TIME_SLOT_CONFLICT',
      'Teste 9: Prevenção atômica de reservas sobrepostas no mesmo profissional'
    );

    // -------------------------------------------------------------
    // TESTE 10: Tratamento de duas tentativas simultâneas de reserva
    // -------------------------------------------------------------
    const dataConcorrente = new Date(amanhã);
    dataConcorrente.setHours(16, 0, 0, 0);

    const [tentativaA, tentativaB] = await Promise.all([
      db.criarAgendamentoAtomico({
        profissional_id: domBarba!.id,
        cliente_nome: 'Cliente Alpha',
        cliente_whatsapp: '11911111111',
        data_inicio: dataConcorrente.toISOString(),
        servico_ids: ['srv-corte-dom'],
      }),
      db.criarAgendamentoAtomico({
        profissional_id: domBarba!.id,
        cliente_nome: 'Cliente Beta',
        cliente_whatsapp: '11922222222',
        data_inicio: dataConcorrente.toISOString(),
        servico_ids: ['srv-corte-dom'],
      }),
    ]);

    const sucessoCount = (tentativaA.success ? 1 : 0) + (tentativaB.success ? 1 : 0);
    const conflitoCount = (!tentativaA.success ? 1 : 0) + (!tentativaB.success ? 1 : 0);

    assert(
      sucessoCount === 1 && conflitoCount === 1,
      'Teste 10: Disputa simultânea permite apenas 1 reserva e bloqueia a segunda com conflito'
    );

    // -------------------------------------------------------------
    // TESTE 11: Agendamento público sem conta
    // -------------------------------------------------------------
    assert(
      resSingle.agendamento?.cliente_id === undefined &&
        resSingle.agendamento?.cliente_nome === 'Marcos Vinicius',
      'Teste 11: Agendamento funciona perfeitamente sem necessidade de conta de cliente'
    );

    // -------------------------------------------------------------
    // TESTE 12: Isolamento de dados entre clientes e profissionais
    // -------------------------------------------------------------
    const agsClienteMarcos = await db.getAgendamentosByCliente({
      whatsapp: '11988887777',
    });
    const agsOutroCliente = await db.getAgendamentosByCliente({
      whatsapp: '11999991234',
    });

    const isolamentoClienteOk =
      agsClienteMarcos.some((a) => a.cliente_nome === 'Marcos Vinicius') &&
      !agsOutroCliente.some((a) => a.cliente_nome === 'Marcos Vinicius');

    assert(
      isolamentoClienteOk,
      'Teste 12: Isolamento de dados: cliente não visualiza agendamentos de outros telefones'
    );

    // -------------------------------------------------------------
    // TESTE 13: Regras mobile e detecção de redundância de pacotes
    // -------------------------------------------------------------
    const servicosDom = await db.getServicosByProfissional(domBarba!.id);
    const checkRedundancia = checkRedundantServices(
      servicosDom,
      ['srv-combo-dom'], // Pacote Combo Corte + Barba já selecionado
      'srv-corte-dom' // Tentando adicionar Corte avulso
    );

    assert(
      checkRedundancia.redundante === true,
      'Teste 13: Detecção de redundância impede selecionar serviço avulso já contido no combo'
    );

    // -------------------------------------------------------------
    // TESTE 14: Avaliação real de agendamento concluído
    // -------------------------------------------------------------
    // Criar um agendamento e marcá-lo como concluído
    const agConcluidoId = 'ag-demo-1';
    await db.atualizarStatusAgendamento(agConcluidoId, 'concluido');
    const resAval = await db.avaliarAgendamento(agConcluidoId, 5, 'Excelente atendimento!');

    const profAtualizado = await db.getProfissionalById(domBarba!.id);
    assert(
      resAval.success && (profAtualizado?.total_avaliacoes || 0) >= 1,
      'Teste 14: Avaliação de agendamento concluído atualiza média e total de avaliações do profissional'
    );

    // -------------------------------------------------------------
    // TESTE 15: Reagendamento atômico
    // -------------------------------------------------------------
    const dataReagendamento = new Date(amanhã);
    dataReagendamento.setHours(17, 0, 0, 0);

    const resReagendar = await db.reagendarAgendamento(resSingle.agendamento!.id, {
      profissional_id: domBarba!.id,
      cliente_nome: 'Marcos Vinicius',
      cliente_whatsapp: '11988887777',
      data_inicio: dataReagendamento.toISOString(),
      servico_ids: ['srv-corte-dom'],
    });

    const agsAntigo = await db.getAgendamentosByProfissional(domBarba!.id);
    const antigoCancelado = agsAntigo.find((a) => a.id === resSingle.agendamento!.id);

    assert(
      resReagendar.success && antigoCancelado?.status === 'cancelado',
      'Teste 15: Reagendamento cria nova reserva e cancela a anterior atomicamente'
    );

  } catch (err: any) {
    console.error('Erro na execução dos testes:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TOTAL DE TESTES: ${passed + failed}`);
  console.log(`APROVADOS: ${passed}`);
  console.log(`FALHAS: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTests();
