import React, { useState, useEffect } from 'react';
import { Profissional, Categoria } from '../../types';
import { db } from '../../services/db';
import { formatMoney } from '../../utils/formatters';
import {
  Search,
  Scissors,
  Sparkles,
  Hand,
  MapPin,
  Star,
  Clock,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  CheckCircle,
} from 'lucide-react';

interface Props {
  onSelectProfessional: (prof: Profissional, initialServiceId?: string) => void;
  onNavigate: (view: string, params?: any) => void;
}

export const HomePage: React.FC<Props> = ({ onSelectProfessional, onNavigate }) => {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [profs, cats] = await Promise.all([
        db.getProfissionais(),
        db.getCategorias(),
      ]);
      setProfissionais(profs);
      setCategorias(cats);
      setLoading(false);
    };
    load();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('search', { query: searchQuery, categoria: selectedCategory });
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'barbearia':
        return <Scissors className="w-5 h-5 text-[#D4AF37]" />;
      case 'cabeleireiro':
        return <Sparkles className="w-5 h-5 text-[#D4AF37]" />;
      case 'manicure':
        return <Hand className="w-5 h-5 text-[#D4AF37]" />;
      default:
        return <Scissors className="w-5 h-5 text-[#D4AF37]" />;
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#D4AF37]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-[#D4AF37]/30 text-xs text-[#D4AF37] font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>Encontre &bull; Escolha &bull; Agende &bull; Sem Espera no WhatsApp</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight font-serif-luxury">
            Encontre os melhores barbeiros e agende em{' '}
            <span className="gold-gradient-text">segundos</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Veja serviços, preços e horários disponíveis em tempo real. Escolha múltiplos serviços e confirme sem precisar criar conta.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto mt-8 p-2 rounded-2xl bg-[#0F1420]/90 border border-[#D4AF37]/30 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-stretch gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4.5" />
              <input
                type="text"
                placeholder="Qual profissional ou serviço você procura?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="py-3.5 px-7 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition shadow-lg shadow-[#D4AF37]/25 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Buscar</span>
            </button>
          </form>

          {/* Quick Categories Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4">
            <button
              onClick={() => {
                setSelectedCategory('todos');
                onNavigate('search', { categoria: 'todos' });
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-[#D4AF37]/50 hover:text-white transition"
            >
              Todos os Serviços
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  onNavigate('search', { categoria: cat.slug });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition"
              >
                {getCategoryIcon(cat.slug)}
                <span>{cat.nome}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              <Sparkles className="w-4 h-4" />
              Destaques da Região
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 font-serif-luxury">
              Profissionais Disponíveis para Agendamento
            </h2>
          </div>
          <button
            onClick={() => onNavigate('search')}
            className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1 group"
          >
            <span>Ver todos os profissionais</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-slate-900/50 rounded-2xl animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profissionais.map((prof) => (
              <div
                key={prof.id}
                className="group rounded-2xl bg-[#0F1420] border border-slate-800/80 hover:border-[#D4AF37]/50 transition-all duration-300 overflow-hidden flex flex-col shadow-xl hover:shadow-2xl hover:shadow-[#D4AF37]/5"
              >
                {/* Photo & Badge */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={prof.foto}
                    alt={prof.nome_publico}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1420] via-transparent to-black/30" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30">
                      {prof.categoria_nome}
                    </span>
                  </div>
                  {prof.avaliacao_media && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-black/70 backdrop-blur-md text-amber-300 border border-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{prof.avaliacao_media.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400">({prof.total_avaliacoes})</span>
                    </div>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition">
                      {prof.nome_publico}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {prof.descricao}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span className="truncate">
                        {prof.bairro ? `${prof.bairro}, ` : ''}{prof.cidade} - {prof.estado}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('professional-profile', { slug: prof.slug })}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition text-center"
                    >
                      Ver Perfil
                    </button>
                    <button
                      onClick={() => onSelectProfessional(prof)}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition text-center shadow-md shadow-[#D4AF37]/15"
                    >
                      Agendar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Why BarberTime section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-[#121828] to-[#0A0D15] border border-slate-800/80 p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Experiência Sem Fricção
            </span>
            <h2 className="text-3xl font-extrabold text-white font-serif-luxury">
              Adeus espera no WhatsApp e confusão de horários.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              O BarberTime conecta clientes aos profissionais locais com disponibilidade transparente, cálculo atômico contra duplicidade de reservas e seleção de múltiplos serviços em um só agendamento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Disponibilidade Real</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Os horários exibidos respeitam pausas de almoço, expediente e reservas já confirmadas.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Múltiplos Serviços</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Combine corte, barba e sobrancelha. A duração é somada e o slot é reservado por completo.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Sem Cadastro Obrigatório</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clientes podem reservar apenas com Nome e WhatsApp, sem formulários longos ou fricção.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Banner para profissionais */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#171207] via-[#241A0B] to-[#120F08] border border-[#D4AF37]/30 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] px-2.5 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              Para Barbeiros e Profissionais da Beleza
            </span>
            <h3 className="text-2xl font-bold text-white font-serif-luxury">
              Tenha sua própria página de agendamento online hoje.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Compartilhe seu link exclusivo na bio do Instagram, configure seus horários, gerencie clientes e reduza em 80% o tempo perdido respondendo disponibilidade manualmente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => onNavigate('auth', { mode: 'register-pro' })}
              className="py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition text-center shadow-lg shadow-[#D4AF37]/25"
            >
              Criar Conta Grátis
            </button>
            <button
              onClick={() => onNavigate('auth', { mode: 'demo-pro' })}
              className="py-3 px-5 rounded-xl font-semibold text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition text-center"
            >
              Testar Painel Demo (Dom Barba)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
