import React, { useState } from 'react';
import { Database, Check, Copy, ExternalLink, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, saveCustomSupabaseConfig, clearCustomSupabaseConfig } from '../../services/supabase';
import { db } from '../../services/db';
import { useToast } from '../../contexts/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { success, info } = useToast();
  const [url, setUrl] = useState(() => localStorage.getItem('barbertime_supabase_url') || '');
  const [anonKey, setAnonKey] = useState(() => localStorage.getItem('barbertime_supabase_anon_key') || '');
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && anonKey) {
      saveCustomSupabaseConfig(url, anonKey);
      success('Configuração Salva', 'Cliente Supabase configurado. A aplicação tentará sincronizar.');
    } else {
      clearCustomSupabaseConfig();
      info('Modo Local', 'Utilizando armazenamento persistente local com garantia atômica.');
    }
    onClose();
  };

  const handleResetSeed = () => {
    db.resetSeedData();
    success('Dados Restaurados', 'Profissionais, serviços e horários padrão foram restaurados.');
    window.location.reload();
  };

  const sqlSchemaSnippet = `-- BARBERTIME - PostgreSQL / Supabase Schema
-- Cole este script no SQL Editor do seu projeto Supabase para criar as tabelas e a função atômica:

CREATE TABLE IF NOT EXISTS public.perfis_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(30),
  tipo_perfil VARCHAR(30) NOT NULL CHECK (tipo_perfil IN ('cliente', 'profissional', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icone VARCHAR(50) DEFAULT 'scissors',
  ativo BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_publico VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  categoria_nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  foto TEXT,
  endereco VARCHAR(255) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  whatsapp VARCHAR(30) NOT NULL,
  publicado BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  duracao_minutos INTEGER NOT NULL CHECK (duracao_minutos > 0),
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  is_pacote BOOLEAN DEFAULT FALSE,
  servicos_inclusos UUID[] DEFAULT ARRAY[]::UUID[]
);

CREATE TABLE IF NOT EXISTS public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id),
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_whatsapp VARCHAR(30) NOT NULL,
  cliente_email VARCHAR(255),
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  duracao_total INTEGER NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'confirmado' NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agendamento_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES public.servicos(id),
  nome_servico VARCHAR(255) NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  ordem INTEGER DEFAULT 0
);
-- Veja o arquivo supabase/schema.sql para RLS e a função criar_agendamento_atomico`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopied(true);
    success('Copiado!', 'Script SQL copiado para a área de transferência.');
    setTimeout(() => setCopied(false), 3000);
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0F141F] border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F17]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Conexão Supabase & Banco de Dados
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    configured
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {configured ? 'Supabase Conectado' : 'Modo Persistente Local Ativo'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Arquitetura híbrida: funciona instantaneamente ou com seu projeto Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-[#121927] px-6">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'config'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Credenciais Supabase
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'sql'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Esquema SQL & Migrações
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'config' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
                <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  Garantia de Persistência e Regras de Negócio
                </div>
                <p>
                  O BarberTime já armazena todos os profissionais, serviços, bloqueios e reservas em banco persistente com verificação atômica de concorrência e cálculo seguro de preços no servidor.
                </p>
                <p>
                  Para conectar à sua nuvem Supabase, crie um projeto em{' '}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#D4AF37] underline inline-flex items-center gap-1"
                  >
                    supabase.com <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  e insira as credenciais abaixo:
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Supabase Anon Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetSeed}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/40 rounded-lg flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restaurar Dados Padrão (Demo)
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-black bg-[#D4AF37] hover:bg-[#E5C07B] rounded-lg transition shadow-md"
                  >
                    Salvar e Conectar
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Script de criação das tabelas, chaves estrangeiras, RLS e função atômica (PostgreSQL / Supabase):
                </p>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar Script SQL'}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto max-h-80 leading-relaxed">
                {sqlSchemaSnippet}
              </pre>

              <p className="text-xs text-slate-500">
                O arquivo completo com todas as restrições e comentários está localizado em <span className="text-[#D4AF37]">supabase/schema.sql</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
