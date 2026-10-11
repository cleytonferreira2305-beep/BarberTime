import React from 'react';
import { Scissors, ShieldCheck, Clock, Zap } from 'lucide-react';

interface Props {
  onNavigate: (view: string, params?: any) => void;
  onOpenSupabaseModal: () => void;
}

export const Footer: React.FC<Props> = ({ onNavigate, onOpenSupabaseModal }) => {
  return (
    <footer className="w-full bg-[#070A10] border-t border-slate-900 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F5D77F] to-[#D4AF37] flex items-center justify-center text-black font-bold">
                <Scissors className="w-4 h-4 -rotate-45" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-serif-luxury">
                BARBER<span className="text-[#D4AF37]">TIME</span>
              </span>
              <span className="text-xs text-[#D4AF37] font-semibold border-l border-slate-700 pl-3 hidden sm:inline">
                Encontre. Escolha. Agende.
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Encontre profissionais locais, escolha seus serviços e agende horários em tempo real. Gestão inteligente para barbearias e salões sem espera no WhatsApp e com prevenção atômica de duplicidades.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                Persistência Segura
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                Zero Duplicidade de Horário
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Zap className="w-4 h-4 text-[#D4AF37]" />
                Reserva sem Conta Obrigatória
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Categorias Principais
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('search', { categoria: 'barbearia' })}
                  className="hover:text-[#D4AF37] transition"
                >
                  Barbearias & Barbeiros
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('search', { categoria: 'cabeleireiro' })}
                  className="hover:text-[#D4AF37] transition"
                >
                  Cabeleireiros & Salões
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('search', { categoria: 'manicure' })}
                  className="hover:text-[#D4AF37] transition"
                >
                  Manicures & Nail Designers
                </button>
              </li>
            </ul>
          </div>

          {/* For professionals & backend */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Para Profissionais & Tech
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('auth', { mode: 'register-pro' })}
                  className="hover:text-[#D4AF37] transition text-left"
                >
                  Cadastre sua Barbearia / Salão
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('auth', { mode: 'login' })}
                  className="hover:text-[#D4AF37] transition text-left"
                >
                  Acessar Painel Administrativo
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSupabaseModal}
                  className="text-[#D4AF37] hover:underline flex items-center gap-1 text-left"
                >
                  Esquema SQL & Supabase DB
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} BarberTime. Todos os direitos reservados.</p>
          <p className="text-slate-400">
            Design elegante &middot; Mobile-First &middot; PostgreSQL & Supabase Ready
          </p>
        </div>
      </div>
    </footer>
  );
};
