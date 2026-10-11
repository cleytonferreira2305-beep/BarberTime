import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { TipoPerfil } from '../../types';
import { Scissors, User, Mail, Lock, Phone, MapPin, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface Props {
  initialMode?: 'login' | 'register-client' | 'register-pro' | 'demo-pro';
  onSuccess: () => void;
  onCancel: () => void;
}

export const AuthPage: React.FC<Props> = ({ initialMode = 'login', onSuccess, onCancel }) => {
  const { login, register, loginAsDemoProfessional } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>(
    initialMode === 'login' ? 'login' : 'register'
  );
  const [tipoPerfil, setTipoPerfil] = useState<TipoPerfil>(
    initialMode === 'register-pro' || initialMode === 'demo-pro' ? 'profissional' : 'cliente'
  );

  // Form fields
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [categoriaSlug, setCategoriaSlug] = useState('barbearia');
  const [whatsapp, setWhatsapp] = useState('');
  const [cidade, setCidade] = useState('São Paulo');
  const [submitting, setSubmitting] = useState(false);

  // Se o modo inicial foi demo-pro, logar automaticamente
  React.useEffect(() => {
    if (initialMode === 'demo-pro') {
      handleDemoLogin();
    }
  }, [initialMode]);

  const handleDemoLogin = async () => {
    setSubmitting(true);
    try {
      await loginAsDemoProfessional();
      success('Bem-vindo!', 'Você entrou como Barbearia Dom Barba (Demonstração).');
      onSuccess();
    } catch {
      toastError('Erro', 'Falha ao acessar conta demo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, senha);
        if (res.success) {
          success('Autenticado com Sucesso', 'Bem-vindo de volta ao BarberTime!');
          onSuccess();
        } else {
          toastError('Falha no Login', res.error || 'Credenciais inválidas.');
        }
      } else {
        const res = await register({
          nome,
          email,
          senha,
          tipo_perfil: tipoPerfil,
          nome_estabelecimento: tipoPerfil === 'profissional' ? nomeEstabelecimento : undefined,
          categoria_slug: tipoPerfil === 'profissional' ? categoriaSlug : undefined,
          whatsapp,
          cidade,
        });

        if (res.success) {
          success(
            'Conta Criada com Sucesso!',
            tipoPerfil === 'profissional'
              ? 'Seu perfil profissional foi configurado com sucesso.'
              : 'Você já pode acompanhar suas reservas com sua conta.'
          );
          onSuccess();
        } else {
          toastError('Erro no Cadastro', res.error || 'Verifique os dados informados.');
        }
      }
    } catch (err: any) {
      toastError('Erro', err.message || 'Ocorreu um erro no processamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0F1420] border border-[#D4AF37]/30 shadow-2xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] mx-auto flex items-center justify-center text-black font-bold shadow-lg shadow-[#D4AF37]/20">
            <Scissors className="w-6 h-6 -rotate-45" />
          </div>
          <h2 className="text-2xl font-bold text-white font-serif-luxury">
            {mode === 'login' ? 'Acessar Conta' : 'Criar Nova Conta'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login'
              ? 'Entre para gerenciar seu estabelecimento ou consultar seus horários'
              : 'Junte-se ao BarberTime para agendamento simplificado'}
          </p>
        </div>

        {/* Demo Fast Access for Test/Review */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#171207] to-[#1F1709] border border-[#D4AF37]/40 flex items-center justify-between gap-3 shadow-md">
          <div className="text-left space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Teste Rápido
            </span>
            <p className="text-xs text-white font-semibold">Entrar como Profissional Demo</p>
            <p className="text-[10px] text-slate-400">Barbearia Dom Barba & Lounge</p>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="py-2 px-3 rounded-xl font-bold text-xs bg-[#D4AF37] hover:bg-[#E5C07B] text-black transition shrink-0 shadow"
          >
            Acessar Painel
          </button>
        </div>

        {/* Tabs Login vs Register */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-lg transition ${
              mode === 'login'
                ? 'bg-[#D4AF37] text-black shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 rounded-lg transition ${
              mode === 'register'
                ? 'bg-[#D4AF37] text-black shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              {/* Selector de Perfil */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de Conta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoPerfil('cliente')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      tipoPerfil === 'cliente'
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sou Cliente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoPerfil('profissional')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      tipoPerfil === 'profissional'
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Sou Profissional</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Seu Nome Completo <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Gabriel Souza"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {tipoPerfil === 'profissional' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome da Barbearia / Salão <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Barbearia Dom Barba"
                      value={nomeEstabelecimento}
                      onChange={(e) => setNomeEstabelecimento(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Categoria
                      </label>
                      <select
                        value={categoriaSlug}
                        onChange={(e) => setCategoriaSlug(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option value="barbearia">Barbearia</option>
                        <option value="cabeleireiro">Cabeleireiro</option>
                        <option value="manicure">Manicure</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        required
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp (com DDD)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="11987654321"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              E-mail <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Senha <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="Mínimo de 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] disabled:opacity-50 transition shadow-lg shadow-[#D4AF37]/25 flex items-center justify-center gap-2 mt-2"
          >
            <span>{submitting ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Cadastrar e Começar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 pt-1"
          >
            Voltar para a página inicial
          </button>
        </form>
      </div>
    </div>
  );
};
