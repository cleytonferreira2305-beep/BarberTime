import React, { useState, useEffect } from 'react';
import { Profissional, DisponibilidadeRegra, Indisponibilidade } from '../../types';
import { db } from '../../services/db';
import { useToast } from '../../contexts/ToastContext';
import { getDiaSemanaNome, formatDateTimeBr } from '../../utils/formatters';
import { Clock, ShieldAlert, Plus, Trash2, Save, Calendar } from 'lucide-react';

interface Props {
  profissional: Profissional;
}

export const ProfessionalAvailability: React.FC<Props> = ({ profissional }) => {
  const { success, error: toastError } = useToast();
  const [regras, setRegras] = useState<DisponibilidadeRegra[]>([]);
  const [bloqueios, setBloqueios] = useState<Indisponibilidade[]>([]);
  const [loading, setLoading] = useState(true);

  // Form de novo bloqueio
  const [bloqueioInicio, setBloqueioInicio] = useState('');
  const [bloqueioFim, setBloqueioFim] = useState('');
  const [bloqueioMotivo, setBloqueioMotivo] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [rList, bList] = await Promise.all([
      db.getDisponibilidadeByProfissional(profissional.id),
      db.getBloqueiosByProfissional(profissional.id),
    ]);
    setRegras(rList.sort((a, b) => (a.dia_semana === 0 ? 7 : a.dia_semana) - (b.dia_semana === 0 ? 7 : b.dia_semana)));
    setBloqueios(bList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profissional.id]);

  const handleUpdateRegra = (diaSemana: number, field: keyof DisponibilidadeRegra, value: any) => {
    setRegras((prev) =>
      prev.map((r) => (r.dia_semana === diaSemana ? { ...r, [field]: value } : r))
    );
  };

  const handleSalvarRegras = async () => {
    try {
      await db.salvarDisponibilidades(profissional.id, regras);
      success('Horários Salvos', 'A grade de horários semanais foi atualizada.');
    } catch {
      toastError('Erro', 'Falha ao salvar horários de atendimento.');
    }
  };

  const handleCriarBloqueio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloqueioInicio || !bloqueioFim) {
      toastError('Campos obrigatórios', 'Informe o início e término do bloqueio.');
      return;
    }

    const dInicio = new Date(bloqueioInicio);
    const dFim = new Date(bloqueioFim);

    if (dFim <= dInicio) {
      toastError('Intervalo inválido', 'O término do bloqueio deve ser posterior ao início.');
      return;
    }

    try {
      await db.salvarBloqueio({
        profissional_id: profissional.id,
        data_inicio: dInicio.toISOString(),
        data_fim: dFim.toISOString(),
        motivo: bloqueioMotivo || 'Bloqueio de agenda',
      });

      success('Período Bloqueado', 'Horários foram bloqueados para agendamentos públicos.');
      setBloqueioInicio('');
      setBloqueioFim('');
      setBloqueioMotivo('');
      const bList = await db.getBloqueiosByProfissional(profissional.id);
      setBloqueios(bList);
    } catch {
      toastError('Erro', 'Falha ao cadastrar bloqueio.');
    }
  };

  const handleExcluirBloqueio = async (id: string) => {
    try {
      await db.excluirBloqueio(id);
      success('Bloqueio Removido', 'O período foi liberado novamente na agenda.');
      setBloqueios((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toastError('Erro', 'Falha ao remover bloqueio.');
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Grade Semanal de Atendimento */}
      <div className="p-6 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-serif-luxury flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              Expediente Semanal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina os dias em que você atende, horário de início, término e intervalo de almoço
            </p>
          </div>

          <button
            onClick={handleSalvarRegras}
            className="py-2.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition flex items-center justify-center gap-2 shadow-md shadow-[#D4AF37]/15"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Salvar Horários</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-slate-900/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {regras.map((r) => (
              <div
                key={r.dia_semana}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  r.ativo
                    ? 'bg-slate-950/70 border-slate-800'
                    : 'bg-slate-950/30 border-slate-900 opacity-60'
                }`}
              >
                {/* Checkbox e Nome do dia */}
                <div className="flex items-center gap-3 w-44">
                  <input
                    type="checkbox"
                    checked={r.ativo}
                    onChange={(e) => handleUpdateRegra(r.dia_semana, 'ativo', e.target.checked)}
                    className="rounded text-[#D4AF37] focus:ring-[#D4AF37] h-4 w-4 bg-slate-900 border-slate-800"
                  />
                  <span className="text-sm font-semibold text-white">
                    {getDiaSemanaNome(r.dia_semana)}
                  </span>
                </div>

                {/* Horários se ativo */}
                {r.ativo ? (
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Atendimento:</span>
                      <input
                        type="time"
                        value={r.hora_inicio}
                        onChange={(e) => handleUpdateRegra(r.dia_semana, 'hora_inicio', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                      />
                      <span className="text-slate-500">às</span>
                      <input
                        type="time"
                        value={r.hora_fim}
                        onChange={(e) => handleUpdateRegra(r.dia_semana, 'hora_fim', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                      <span className="text-slate-400">Intervalo / Almoço:</span>
                      <input
                        type="time"
                        value={r.pausa_inicio || ''}
                        onChange={(e) => handleUpdateRegra(r.dia_semana, 'pausa_inicio', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                      />
                      <span className="text-slate-500">às</span>
                      <input
                        type="time"
                        value={r.pausa_fim || ''}
                        onChange={(e) => handleUpdateRegra(r.dia_semana, 'pausa_fim', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">Fechado para clientes</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Bloqueios e Indisponibilidades Específicas */}
      <div className="p-6 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white font-serif-luxury flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Bloqueios de Agenda & Folgas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bloqueie períodos pontuais para férias, feriados, cursos ou compromissos pessoais
          </p>
        </div>

        {/* Form para novo bloqueio */}
        <form
          onSubmit={handleCriarBloqueio}
          className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Início do Bloqueio
            </label>
            <input
              type="datetime-local"
              required
              value={bloqueioInicio}
              onChange={(e) => setBloqueioInicio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Fim do Bloqueio
            </label>
            <input
              type="datetime-local"
              required
              value={bloqueioFim}
              onChange={(e) => setBloqueioFim(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Motivo (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Treinamento / Folga"
              value={bloqueioMotivo}
              onChange={(e) => setBloqueioMotivo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition flex items-center justify-center gap-1.5 shadow-md shadow-[#D4AF37]/15 h-[38px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Bloqueio</span>
            </button>
          </div>
        </form>

        {/* Lista de bloqueios */}
        <div className="space-y-2">
          {bloqueios.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">
              Nenhum bloqueio cadastrado. Toda a sua grade padrão está disponível.
            </p>
          ) : (
            bloqueios.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {formatDateTimeBr(b.data_inicio)} até {formatDateTimeBr(b.data_fim)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold uppercase text-[10px]">
                      {b.motivo || 'Bloqueio'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleExcluirBloqueio(b.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/20 transition"
                  title="Remover bloqueio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
