import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PerfilUsuario, Profissional, TipoPerfil } from '../types';
import { db } from '../services/db';
import { getSupabaseClient } from '../services/supabase';

interface AuthContextData {
  user: { id: string; email: string } | null;
  perfil: PerfilUsuario | null;
  profissional: Profissional | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    nome: string;
    email: string;
    senha: string;
    tipo_perfil: TipoPerfil;
    nome_estabelecimento?: string;
    categoria_slug?: string;
    whatsapp?: string;
    cidade?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoProfessional: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const LOCAL_AUTH_KEY = 'barbertime_auth_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string, email: string) => {
    setUser({ id: userId, email });

    // Buscar perfil do usuário
    const storedPerfilJson = localStorage.getItem(`barbertime_user_profile_${userId}`);
    let userPerfil: PerfilUsuario | null = null;
    if (storedPerfilJson) {
      try {
        userPerfil = JSON.parse(storedPerfilJson);
      } catch {
        userPerfil = null;
      }
    }

    if (!userPerfil) {
      userPerfil = {
        id: `perf-${userId}`,
        user_id: userId,
        nome: email.split('@')[0] || 'Usuário',
        email,
        tipo_perfil: userId.includes('dombarba') ? 'profissional' : 'cliente',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(`barbertime_user_profile_${userId}`, JSON.stringify(userPerfil));
    }
    setPerfil(userPerfil);

    // Se for profissional, carregar dados do profissional
    if (userPerfil.tipo_perfil === 'profissional') {
      let prof = await db.getProfissionalByUserId(userId);
      if (!prof && userId.includes('dombarba')) {
        prof = await db.getProfissionalById('prof-dombarba');
      }
      setProfissional(prof);
    } else {
      setProfissional(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserData(user.id, user.email);
    }
  }, [user, loadUserData]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verificar Supabase Auth se configurado
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            await loadUserData(data.session.user.id, data.session.user.email || '');
            setLoading(false);
            return;
          }
        }

        // Caso contrário, verificar sessão salva local
        const savedSession = localStorage.getItem(LOCAL_AUTH_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          await loadUserData(parsed.id, parsed.email);
        }
      } catch (err) {
        console.error('Erro ao restaurar sessão:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [loadUserData]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          await loadUserData(data.user.id, data.user.email || email);
          setLoading(false);
          return { success: true };
        }
      }

      // Login local seguro com credenciais salvas
      const usersRegistry = JSON.parse(localStorage.getItem('barbertime_registered_users') || '[]');
      const found = usersRegistry.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

      if (found) {
        if (found.senha !== pass) {
          setLoading(false);
          return { success: false, error: 'Senha incorreta. Verifique suas credenciais.' };
        }
        const session = { id: found.id, email: found.email };
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(session));
        await loadUserData(found.id, found.email);
        setLoading(false);
        return { success: true };
      }

      // Se for email demo dombarba
      if (email.toLowerCase().includes('dombarba') || email.toLowerCase().includes('barba')) {
        await loginAsDemoProfessional();
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Usuário não encontrado. Crie uma conta ou entre como profissional demo.' };
    } catch (e: any) {
      setLoading(false);
      return { success: false, error: e.message || 'Erro durante a autenticação.' };
    }
  };

  const register = async (data: {
    nome: string;
    email: string;
    senha: string;
    tipo_perfil: TipoPerfil;
    nome_estabelecimento?: string;
    categoria_slug?: string;
    whatsapp?: string;
    cidade?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      let newUserId = `user-${Date.now()}`;

      if (supabase) {
        const res = await supabase.auth.signUp({
          email: data.email,
          password: data.senha,
        });
        if (res.error) {
          setLoading(false);
          return { success: false, error: res.error.message };
        }
        if (res.data.user) {
          newUserId = res.data.user.id;
        }
      }

      // Salvar registro de usuário local
      const usersRegistry = JSON.parse(localStorage.getItem('barbertime_registered_users') || '[]');
      if (usersRegistry.some((u: any) => u.email.toLowerCase() === data.email.toLowerCase())) {
        setLoading(false);
        return { success: false, error: 'Este e-mail já está em uso.' };
      }

      usersRegistry.push({
        id: newUserId,
        email: data.email,
        senha: data.senha,
        nome: data.nome,
        tipo_perfil: data.tipo_perfil,
      });
      localStorage.setItem('barbertime_registered_users', JSON.stringify(usersRegistry));

      // Criar perfil do usuário
      const novoPerfil: PerfilUsuario = {
        id: `perf-${newUserId}`,
        user_id: newUserId,
        nome: data.nome,
        email: data.email,
        telefone: data.whatsapp,
        tipo_perfil: data.tipo_perfil,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(`barbertime_user_profile_${newUserId}`, JSON.stringify(novoPerfil));

      // Se for profissional, criar o registro na tabela profissionais e disponibilidade básica
      if (data.tipo_perfil === 'profissional') {
        const slug = (data.nome_estabelecimento || data.nome)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const novoProf = await db.salvarProfissional({
          user_id: newUserId,
          nome_publico: data.nome_estabelecimento || data.nome,
          slug: `${slug}-${Math.floor(Math.random() * 900 + 100)}`,
          categoria_id: 'cat-1',
          categoria_nome: data.categoria_slug === 'manicure' ? 'Manicure & Pedicure' : data.categoria_slug === 'cabeleireiro' ? 'Cabeleireiro' : 'Barbearia',
          descricao: `Bem-vindo ao espaço de ${data.nome}. Agende seu horário com praticidade.`,
          foto: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
          endereco: 'Atendimento com horário marcado',
          cidade: data.cidade || 'São Paulo',
          estado: 'SP',
          whatsapp: data.whatsapp || '11999999999',
          publicado: true,
        });

        // Criar um serviço inicial para o profissional
        await db.salvarServico({
          profissional_id: novoProf.id,
          nome: 'Atendimento Principal',
          descricao: 'Serviço personalizado com atendimento exclusivo.',
          duracao_minutos: 45,
          preco: 50.0,
          ativo: true,
        });

        setProfissional(novoProf);
      }

      // Concluir login
      const session = { id: newUserId, email: data.email };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(session));
      setUser(session);
      setPerfil(novoPerfil);

      setLoading(false);
      return { success: true };
    } catch (e: any) {
      setLoading(false);
      return { success: false, error: e.message || 'Falha ao registrar conta.' };
    }
  };

  const loginAsDemoProfessional = async () => {
    setLoading(true);
    const demoUser = {
      id: 'user-dombarba',
      email: 'contato@dombarba.com.br',
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(demoUser));
    await loadUserData(demoUser.id, demoUser.email);
    setLoading(false);
  };

  const logout = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {}
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setUser(null);
    setPerfil(null);
    setProfissional(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        profissional,
        loading,
        login,
        register,
        loginAsDemoProfessional,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
