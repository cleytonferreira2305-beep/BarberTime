import React, { useState } from 'react';
import { Scissors, Calendar, Search, User, Menu, X, Database, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../services/supabase';
import { NotificationCenter } from '../professional/NotificationCenter';

interface Props {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  onOpenSupabaseModal: () => void;
}

export const Navbar: React.FC<Props> = ({ currentView, onNavigate, onOpenSupabaseModal }) => {
  const { user, perfil, profissional, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabaseConnected = isSupabaseConfigured();

  const handleNav = (view: string, params?: any) => {
    onNavigate(view, params);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] flex items-center justify-center text-black font-bold shadow-lg shadow-[#D4AF37]/20 group-hover:scale-105 transition">
            <Scissors className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1 font-serif-luxury">
              BARBER<span className="text-[#D4AF37]">TIME</span>
            </span>
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
              Encontre &bull; Escolha &bull; Agende
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => handleNav('home')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
              currentView === 'home'
                ? 'text-[#D4AF37] bg-[#D4AF37]/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Início
          </button>
          <button
            onClick={() => handleNav('search')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              currentView === 'search'
                ? 'text-[#D4AF37] bg-[#D4AF37]/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-4 h-4" />
            Explorar
          </button>
          <button
            onClick={() => handleNav('my-appointments')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              currentView === 'my-appointments'
                ? 'text-[#D4AF37] bg-[#D4AF37]/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Meus Agendamentos
          </button>
        </nav>

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Supabase Status / DB Settings */}
          <button
            onClick={onOpenSupabaseModal}
            title="Configurações de Banco de Dados & Supabase"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden xl:inline">Banco:</span>
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] text-slate-400">
              {supabaseConnected ? 'Supabase' : 'Postgres/Local'}
            </span>
          </button>

          {/* User Auth state */}
          {user ? (
            <div className="flex items-center gap-2">
              {perfil?.tipo_perfil === 'profissional' && profissional ? (
                <>
                  <NotificationCenter
                    profissional={profissional}
                    onNavigateToAgenda={() => handleNav('professional-dashboard', { tab: 'agenda' })}
                  />
                  <button
                    onClick={() => handleNav('professional-dashboard')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                      currentView.startsWith('professional')
                        ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                        : 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/25'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Painel Profissional
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {perfil?.nome || user.email.split('@')[0]}
                </span>
              )}

              <button
                onClick={() => logout()}
                title="Sair da conta"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNav('auth', { mode: 'login' })}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                Entrar
              </button>
              <button
                onClick={() => handleNav('auth', { mode: 'register-pro' })}
                className="px-4 py-2 text-xs font-bold tracking-wide uppercase text-black bg-[#D4AF37] hover:bg-[#E5C07B] rounded-xl transition shadow-md shadow-[#D4AF37]/15"
              >
                Sou Profissional
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          {perfil?.tipo_perfil === 'profissional' && profissional && (
            <NotificationCenter
              profissional={profissional}
              onNavigateToAgenda={() => handleNav('professional-dashboard', { tab: 'agenda' })}
            />
          )}
          <button
            onClick={onOpenSupabaseModal}
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300"
          >
            <Database className="w-4 h-4 text-[#D4AF37]" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0E131E] px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleNav('home')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium ${
                currentView === 'home' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-slate-300'
              }`}
            >
              Início
            </button>
            <button
              onClick={() => handleNav('search')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                currentView === 'search' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-slate-300'
              }`}
            >
              <Search className="w-4 h-4" />
              Explorar Profissionais
            </button>
            <button
              onClick={() => handleNav('my-appointments')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                currentView === 'my-appointments' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Meus Agendamentos
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            {user ? (
              <>
                {perfil?.tipo_perfil === 'profissional' && (
                  <button
                    onClick={() => handleNav('professional-dashboard')}
                    className="w-full py-3 rounded-xl text-center text-sm font-bold bg-[#D4AF37] text-black"
                  >
                    Painel do Profissional ({profissional?.nome_publico || 'Meu Negócio'})
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-xs text-rose-400 bg-rose-950/20 border border-rose-900/40"
                >
                  Sair da Conta ({user.email})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNav('auth', { mode: 'login' })}
                  className="w-full py-3 rounded-xl text-center text-sm font-medium text-slate-200 bg-slate-900 border border-slate-800"
                >
                  Fazer Login
                </button>
                <button
                  onClick={() => handleNav('auth', { mode: 'register-pro' })}
                  className="w-full py-3 rounded-xl text-center text-sm font-bold text-black bg-[#D4AF37]"
                >
                  Cadastrar como Profissional
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
