import React, { useState, useEffect } from 'react';
import { Profissional, Categoria } from '../../types';
import { db } from '../../services/db';
import { Search, MapPin, Star, Filter, Scissors, Sparkles, Hand, ArrowRight } from 'lucide-react';

interface Props {
  initialQuery?: string;
  initialCategoria?: string;
  onSelectProfessional: (prof: Profissional) => void;
  onNavigate: (view: string, params?: any) => void;
}

export const SearchPage: React.FC<Props> = ({
  initialQuery = '',
  initialCategoria = 'todos',
  onSelectProfessional,
  onNavigate,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [categoria, setCategoria] = useState(initialCategoria);
  const [cidade, setCidade] = useState('');
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    setLoading(true);
    const [profs, cats] = await Promise.all([
      db.getProfissionais({
        query,
        categoriaSlug: categoria,
        cidade,
      }),
      db.getCategorias(),
    ]);
    setProfissionais(profs);
    setCategorias(cats);
    setLoading(false);
  };

  useEffect(() => {
    fetchResults();
  }, [categoria, cidade]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'barbearia':
        return <Scissors className="w-4 h-4 text-[#D4AF37]" />;
      case 'cabeleireiro':
        return <Sparkles className="w-4 h-4 text-[#D4AF37]" />;
      case 'manicure':
        return <Hand className="w-4 h-4 text-[#D4AF37]" />;
      default:
        return <Scissors className="w-4 h-4 text-[#D4AF37]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Search Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-serif-luxury">
            Explorar Profissionais & Barbearias
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Encontre serviços perto de você e reserve horários em instantes.
          </p>
        </div>

        {/* Filter Controls */}
        <form
          onSubmit={handleSearchSubmit}
          className="p-4 rounded-2xl bg-[#0F1420] border border-slate-800 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Query */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Nome do profissional, corte, barba..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>

            {/* City */}
            <div className="md:col-span-4 relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Cidade (ex: São Paulo, Curitiba...)"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition"
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition flex items-center justify-center gap-2 shadow-md shadow-[#D4AF37]/15 h-full"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Filtrar</span>
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-[#D4AF37]" /> Categoria:
            </span>
            <button
              type="button"
              onClick={() => setCategoria('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                categoria === 'todos'
                  ? 'bg-[#D4AF37] text-black shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoria(c.slug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  categoria === c.slug
                    ? 'bg-[#D4AF37] text-black shadow'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {getCategoryIcon(c.slug)}
                <span>{c.nome}</span>
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {loading ? 'Buscando...' : `${profissionais.length} estabelecimentos encontrados`}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-72 bg-slate-900/50 rounded-2xl animate-pulse border border-slate-800"
              />
            ))}
          </div>
        ) : profissionais.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3 max-w-md mx-auto">
            <Search className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Nenhum profissional encontrado</h3>
            <p className="text-xs text-slate-400">
              Tente buscar por termos mais genéricos, remover o filtro de cidade ou conferir outras categorias.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setCidade('');
                setCategoria('todos');
              }}
              className="px-4 py-2 text-xs font-semibold text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl hover:bg-[#D4AF37]/10 transition"
            >
              Limpar todos os filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profissionais.map((prof) => (
              <div
                key={prof.id}
                className="group rounded-2xl bg-[#0F1420] border border-slate-800 hover:border-[#D4AF37]/50 transition-all duration-300 overflow-hidden flex flex-col shadow-lg"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                  <img
                    src={prof.foto}
                    alt={prof.nome_publico}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1420] via-transparent to-black/30" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30">
                      {prof.categoria_nome}
                    </span>
                  </div>
                  {prof.avaliacao_media && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-black/80 backdrop-blur-md text-amber-300 border border-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{prof.avaliacao_media.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white group-hover:text-[#D4AF37] transition">
                      {prof.nome_publico}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {prof.descricao}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span className="truncate">
                        {prof.endereco}, {prof.cidade} - {prof.estado}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('professional-profile', { slug: prof.slug })}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition text-center"
                    >
                      Ver Serviços
                    </button>
                    <button
                      onClick={() => onSelectProfessional(prof)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition text-center shadow-md shadow-[#D4AF37]/15"
                    >
                      Agendar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
