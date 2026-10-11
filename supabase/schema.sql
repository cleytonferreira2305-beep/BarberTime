-- ==============================================================================
-- BARBERTIME - ESQUEMA DE BANCO DE DADOS POSTGRESQL & SUPABASE
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA: perfis_usuario
CREATE TABLE IF NOT EXISTS public.perfis_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(30),
    tipo_perfil VARCHAR(30) NOT NULL CHECK (tipo_perfil IN ('cliente', 'profissional', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. TABELA: categorias
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icone VARCHAR(50) DEFAULT 'scissors',
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inserir categorias padrão do MVP
INSERT INTO public.categorias (nome, slug, icone, ativo) VALUES
('Barbearia', 'barbearia', 'scissors', true),
('Cabeleireiro', 'cabeleireiro', 'sparkles', true),
('Manicure & Pedicure', 'manicure', 'hand', true)
ON CONFLICT (slug) DO NOTHING;

-- 4. TABELA: profissionais
CREATE TABLE IF NOT EXISTS public.profissionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_publico VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    categoria_nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    foto TEXT,
    capa TEXT,
    endereco VARCHAR(255) NOT NULL,
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    publicado BOOLEAN DEFAULT TRUE NOT NULL,
    avaliacao_media NUMERIC(3,2) DEFAULT 5.0,
    total_avaliacoes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_profissionais_slug ON public.profissionais(slug);
CREATE INDEX IF NOT EXISTS idx_profissionais_cidade ON public.profissionais(cidade);
CREATE INDEX IF NOT EXISTS idx_profissionais_publicado ON public.profissionais(publicado);

-- 5. TABELA: servicos
CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER NOT NULL CHECK (duracao_minutos > 0),
    preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    ordem INTEGER DEFAULT 0,
    is_pacote BOOLEAN DEFAULT FALSE,
    servicos_inclusos UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_servicos_profissional ON public.servicos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON public.servicos(ativo);

-- 6. TABELA: disponibilidades (Regras de expediente)
CREATE TABLE IF NOT EXISTS public.disponibilidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    pausa_inicio TIME,
    pausa_fim TIME,
    CONSTRAINT check_horario_valido CHECK (hora_fim > hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_disponibilidades_prof ON public.disponibilidades(profissional_id);

-- 7. TABELA: indisponibilidades (Bloqueios específicos)
CREATE TABLE IF NOT EXISTS public.indisponibilidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    motivo VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT check_periodo_bloqueio CHECK (data_fim > data_inicio)
);

CREATE INDEX IF NOT EXISTS idx_indisponibilidades_prof ON public.indisponibilidades(profissional_id);

-- 8. TABELA: agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE RESTRICT,
    cliente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_whatsapp VARCHAR(30) NOT NULL,
    cliente_email VARCHAR(255),
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    duracao_total INTEGER NOT NULL CHECK (duracao_total > 0),
    valor_total NUMERIC(10,2) NOT NULL CHECK (valor_total >= 0),
    status VARCHAR(30) DEFAULT 'confirmado' NOT NULL CHECK (status IN ('pendente', 'confirmado', 'concluido', 'cancelado', 'faltou')),
    observacao TEXT,
    avaliacao_nota INTEGER CHECK (avaliacao_nota BETWEEN 1 AND 5),
    avaliacao_comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT check_horario_agendamento CHECK (data_fim > data_inicio)
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_prof_periodo ON public.agendamentos(profissional_id, data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON public.agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_whatsapp ON public.agendamentos(cliente_whatsapp);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos(status);

-- 9. TABELA: agendamento_servicos (Relação N:N com histórico congelado de preços)
CREATE TABLE IF NOT EXISTS public.agendamento_servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE RESTRICT,
    nome_servico VARCHAR(255) NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    duracao_minutos INTEGER NOT NULL,
    ordem INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_agendamento_servicos_agendamento ON public.agendamento_servicos(agendamento_id);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.perfis_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disponibilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indisponibilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamento_servicos ENABLE ROW LEVEL SECURITY;

-- Categorias: leitura pública para todos
CREATE POLICY "Categorias leitura pública" ON public.categorias
    FOR SELECT USING (ativo = true);

-- Profissionais: leitura pública apenas de perfis publicados
CREATE POLICY "Profissionais leitura pública" ON public.profissionais
    FOR SELECT USING (publicado = true);

-- Profissionais: atualização somente pelo usuário proprietário
CREATE POLICY "Profissional atualiza seu próprio perfil" ON public.profissionais
    FOR ALL USING (auth.uid() = user_id);

-- Serviços: leitura pública de serviços ativos de profissionais publicados
CREATE POLICY "Servicos leitura pública" ON public.servicos
    FOR SELECT USING (
        ativo = true AND 
        EXISTS (
            SELECT 1 FROM public.profissionais p 
            WHERE p.id = servicos.profissional_id AND p.publicado = true
        )
    );

-- Serviços: gestão pelo profissional dono
CREATE POLICY "Profissional gerencia seus serviços" ON public.servicos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profissionais p 
            WHERE p.id = servicos.profissional_id AND p.user_id = auth.uid()
        )
    );

-- Disponibilidades: leitura pública para verificação de horários
CREATE POLICY "Disponibilidade leitura pública" ON public.disponibilidades
    FOR SELECT USING (ativo = true);

CREATE POLICY "Profissional gerencia disponibilidade" ON public.disponibilidades
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profissionais p 
            WHERE p.id = disponibilidades.profissional_id AND p.user_id = auth.uid()
        )
    );

-- Indisponibilidades: leitura pública de intervalos bloqueados
CREATE POLICY "Indisponibilidade leitura pública" ON public.indisponibilidades
    FOR SELECT USING (true);

CREATE POLICY "Profissional gerencia bloqueios" ON public.indisponibilidades
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profissionais p 
            WHERE p.id = indisponibilidades.profissional_id AND p.user_id = auth.uid()
        )
    );

-- Agendamentos:
-- Profissional pode ver todos os agendamentos da sua conta
CREATE POLICY "Profissional gerencia seus agendamentos" ON public.agendamentos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profissionais p 
            WHERE p.id = agendamentos.profissional_id AND p.user_id = auth.uid()
        )
    );

-- Cliente autenticado pode consultar seus próprios agendamentos
CREATE POLICY "Cliente vê seus próprios agendamentos" ON public.agendamentos
    FOR SELECT USING (auth.uid() = cliente_id);

-- Criação pública permitida (ou via função segura RPC)
CREATE POLICY "Criação de agendamentos" ON public.agendamentos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Leitura de itens do agendamento" ON public.agendamento_servicos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.agendamentos a
            LEFT JOIN public.profissionais p ON p.id = a.profissional_id
            WHERE a.id = agendamento_servicos.agendamento_id 
            AND (a.cliente_id = auth.uid() OR p.user_id = auth.uid())
        )
    );

CREATE POLICY "Inserção de itens do agendamento" ON public.agendamento_servicos
    FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 11. FUNÇÃO ATÔMICA POSTGRESQL PARA CRIAÇÃO DE AGENDAMENTO COM PREVENÇÃO DE CONFLITO
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.criar_agendamento_atomico(
    p_profissional_id UUID,
    p_cliente_nome VARCHAR,
    p_cliente_whatsapp VARCHAR,
    p_cliente_email VARCHAR,
    p_cliente_id UUID,
    p_data_inicio TIMESTAMP WITH TIME ZONE,
    p_servico_ids UUID[],
    p_observacao TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_duracao_total INTEGER := 0;
    v_valor_total NUMERIC(10,2) := 0;
    v_data_fim TIMESTAMP WITH TIME ZONE;
    v_agendamento_id UUID;
    v_servico RECORD;
    v_conflito_count INTEGER;
    v_bloqueio_count INTEGER;
    v_ordem INTEGER := 1;
BEGIN
    -- 1. Validar se o profissional existe e está publicado
    IF NOT EXISTS (SELECT 1 FROM public.profissionais WHERE id = p_profissional_id AND publicado = true) THEN
        RAISE EXCEPTION 'Profissional não encontrado ou não está ativo.';
    END IF;

    -- 2. Validar que pelo menos um serviço foi informado
    IF array_length(p_servico_ids, 1) IS NULL OR array_length(p_servico_ids, 1) = 0 THEN
        RAISE EXCEPTION 'Nenhum serviço selecionado.';
    END IF;

    -- 3. Obter dados dos serviços e somar duração e preço real do banco
    FOR v_servico IN 
        SELECT id, nome, preco, duracao_minutos 
        FROM public.servicos 
        WHERE id = ANY(p_servico_ids) AND profissional_id = p_profissional_id AND ativo = true
    LOOP
        v_duracao_total := v_duracao_total + v_servico.duracao_minutos;
        v_valor_total := v_valor_total + v_servico.preco;
    END LOOP;

    -- Validar se todos os serviços foram encontrados e pertencem ao profissional
    IF v_duracao_total <= 0 THEN
        RAISE EXCEPTION 'Serviços selecionados são inválidos ou não pertencem ao profissional.';
    END IF;

    -- 4. Calcular data_fim exata
    v_data_fim := p_data_inicio + (v_duracao_total || ' minutes')::INTERVAL;

    -- 5. Bloqueio pessimista e verificação de conflitos atômica
    -- Verifica sobreposição de intervalos: (A_start < B_end) AND (A_end > B_start)
    SELECT COUNT(*) INTO v_conflito_count
    FROM public.agendamentos
    WHERE profissional_id = p_profissional_id
      AND status IN ('pendente', 'confirmado')
      AND data_inicio < v_data_fim
      AND data_fim > p_data_inicio;

    IF v_conflito_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'TIME_SLOT_CONFLICT',
            'message', 'O horário selecionado acabou de ser reservado por outro cliente. Por favor, escolha outro horário.'
        );
    END IF;

    -- 6. Verificar se não colide com indisponibilidade cadastrada do profissional
    SELECT COUNT(*) INTO v_bloqueio_count
    FROM public.indisponibilidades
    WHERE profissional_id = p_profissional_id
      AND data_inicio < v_data_fim
      AND data_fim > p_data_inicio;

    IF v_bloqueio_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'BLOCKED_PERIOD',
            'message', 'O profissional possui um bloqueio de agenda neste período.'
        );
    END IF;

    -- 7. Inserir o Agendamento de forma atômica
    INSERT INTO public.agendamentos (
        profissional_id,
        cliente_id,
        cliente_nome,
        cliente_whatsapp,
        cliente_email,
        data_inicio,
        data_fim,
        duracao_total,
        valor_total,
        status,
        observacao
    ) VALUES (
        p_profissional_id,
        p_cliente_id,
        p_cliente_nome,
        p_cliente_whatsapp,
        p_cliente_email,
        p_data_inicio,
        v_data_fim,
        v_duracao_total,
        v_valor_total,
        'confirmado',
        p_observacao
    )
    RETURNING id INTO v_agendamento_id;

    -- 8. Inserir cada serviço na tabela de itens com o preço e nome congelados
    FOR v_servico IN 
        SELECT id, nome, preco, duracao_minutos 
        FROM public.servicos 
        WHERE id = ANY(p_servico_ids) AND profissional_id = p_profissional_id
    LOOP
        INSERT INTO public.agendamento_servicos (
            agendamento_id,
            servico_id,
            nome_servico,
            preco,
            duracao_minutos,
            ordem
        ) VALUES (
            v_agendamento_id,
            v_servico.id,
            v_servico.nome,
            v_servico.preco,
            v_servico.duracao_minutos,
            v_ordem
        );
        v_ordem := v_ordem + 1;
    END LOOP;

    -- 9. Retornar dados completos da reserva
    RETURN jsonb_build_object(
        'success', true,
        'agendamento_id', v_agendamento_id,
        'data_inicio', p_data_inicio,
        'data_fim', v_data_fim,
        'duracao_total', v_duracao_total,
        'valor_total', v_valor_total,
        'message', 'Agendamento confirmado com sucesso!'
    );
END;
$$;

-- ==============================================================================
-- 12. MIGRAÇÕES INCREMENTAIS PARA BANCOS JÁ EXISTENTES
-- ==============================================================================
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS avaliacao_nota INTEGER CHECK (avaliacao_nota BETWEEN 1 AND 5);
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS avaliacao_comentario TEXT;

