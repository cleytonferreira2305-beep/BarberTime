import React, { useState, useEffect } from 'react';
import { Profissional, Servico } from '../../types';
import { db } from '../../services/db';
import { useToast } from '../../contexts/ToastContext';
import { formatMoney, formatDuration } from '../../utils/formatters';
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Package,
  Clock,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface Props {
  profissional: Profissional;
}

export const ProfessionalServices: React.FC<Props> = ({ profissional }) => {
  const { success, error: toastError } = useToast();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de edição / criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Servico> | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [duracaoMinutos, setDuracaoMinutos] = useState(40);
  const [preco, setPreco] = useState(50);
  const [ativo, setAtivo] = useState(true);
  const [isPacote, setIsPacote] = useState(false);
  const [servicosInclusos, setServicosInclusos] = useState<string[]>([]);

  const fetchServicos = async () => {
    setLoading(true);
    const list = await db.getServicosByProfissional(profissional.id);
    setServicos(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchServicos();
  }, [profissional.id]);

  const handleOpenNew = () => {
    setEditingService(null);
    setNome('');
    setDescricao('');
    setDuracaoMinutos(40);
    setPreco(50);
    setAtivo(true);
    setIsPacote(false);
    setServicosInclusos([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Servico) => {
    setEditingService(s);
    setNome(s.nome);
    setDescricao(s.descricao || '');
    setDuracaoMinutos(s.duracao_minutos);
    setPreco(s.preco);
    setAtivo(s.ativo);
    setIsPacote(Boolean(s.is_pacote));
    setServicosInclusos(s.servicos_inclusos || []);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toastError('Nome obrigatório', 'Informe o nome do serviço.');
      return;
    }
    if (duracaoMinutos <= 0) {
      toastError('Duração inválida', 'A duração deve ser maior que zero minutos.');
      return;
    }
    if (preco < 0) {
      toastError('Preço inválido', 'O preço não pode ser negativo.');
      return;
    }

    try {
      const saved = await db.salvarServico({
        id: editingService?.id,
        profissional_id: profissional.id,
        nome: nome.trim(),
        descricao: descricao.trim(),
        duracao_minutos: Number(duracaoMinutos),
        preco: Number(preco),
        ativo,
        is_pacote: isPacote,
        servicos_inclusos: isPacote ? servicosInclusos : [],
      });

      success(
        editingService ? 'Serviço Atualizado' : 'Serviço Criado',
        `O serviço "${saved.nome}" foi salvo com sucesso.`
      );
      setIsModalOpen(false);
      fetchServicos();
    } catch {
      toastError('Erro', 'Não foi possível salvar o serviço.');
    }
  };

  const handleDelete = async (id: string, nomeServico: string) => {
    if (!confirm(`Deseja realmente remover o serviço "${nomeServico}"?`)) {
      return;
    }
    try {
      await db.excluirServico(id);
      success('Serviço Removido', `O serviço "${nomeServico}" foi excluído.`);
      fetchServicos();
    } catch {
      toastError('Erro', 'Falha ao excluir o serviço.');
    }
  };

  const handleToggleAtivo = async (s: Servico) => {
    try {
      await db.salvarServico({
        ...s,
        ativo: !s.ativo,
      });
      success(
        s.ativo ? 'Serviço Desativado' : 'Serviço Ativado',
        `O status do serviço "${s.nome}" foi alterado.`
      );
      fetchServicos();
    } catch {
      toastError('Erro', 'Falha ao alterar status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0F1420] border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white font-serif-luxury">
            Gestão de Serviços & Pacotes ({servicos.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre os cortes, tratamentos e combos que os clientes podem selecionar
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition flex items-center justify-center gap-2 shadow-md shadow-[#D4AF37]/15"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Services List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : servicos.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <Scissors className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">Nenhum serviço cadastrado</h3>
          <p className="text-xs text-slate-400">
            Adicione seu primeiro serviço para liberar o agendamento aos clientes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {servicos.map((s) => (
            <div
              key={s.id}
              className={`p-4 rounded-2xl bg-[#0F1420] border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                s.ativo
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-900 opacity-60 bg-slate-950/40'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">{s.nome}</h3>
                  {s.is_pacote && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center gap-1">
                      <Package className="w-3 h-3" /> Pacote
                    </span>
                  )}
                  {!s.ativo && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      Inativo
                    </span>
                  )}
                </div>

                {s.descricao && (
                  <p className="text-xs text-slate-400 leading-relaxed">{s.descricao}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {formatDuration(s.duracao_minutos)}
                  </span>
                  <span className="text-base font-extrabold text-[#D4AF37]">
                    {formatMoney(s.preco)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <button
                  onClick={() => handleToggleAtivo(s)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition ${
                    s.ativo
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
                  }`}
                >
                  {s.ativo ? 'Pausar' : 'Ativar'}
                </button>

                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Editar serviço"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(s.id, s.nome)}
                  className="p-2 rounded-xl bg-rose-950/20 border border-rose-900/40 hover:bg-rose-950/40 text-rose-400 transition"
                  title="Excluir serviço"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0F1420] border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 bg-[#0B0F17] flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-serif-luxury">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Serviço <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degrade Navalhado"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição dos detalhes
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Lavagem com shampoo mentolado, finalização com pomada e toalha quente."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Duração em Minutos <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    required
                    value={duracaoMinutos}
                    onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {formatDuration(duracaoMinutos)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preço (R$) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={preco}
                    onChange={(e) => setPreco(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {formatMoney(preco)}
                  </span>
                </div>
              </div>

              {/* Pacote / Combo */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPacote}
                    onChange={(e) => setIsPacote(e.target.checked)}
                    className="rounded text-[#D4AF37] focus:ring-[#D4AF37] h-4 w-4 bg-slate-950 border-slate-800"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    Este serviço é um Pacote / Combo composto por outros itens?
                  </span>
                </label>

                {isPacote && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <p className="text-[11px] text-slate-400">
                      Selecione os serviços que este pacote já inclui (evita que o cliente adicione avulsos redundantes):
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {servicos
                        .filter((s) => s.id !== editingService?.id && !s.is_pacote)
                        .map((s) => {
                          const included = servicosInclusos.includes(s.id);
                          return (
                            <label
                              key={s.id}
                              className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={included}
                                onChange={() => {
                                  if (included) {
                                    setServicosInclusos((prev) => prev.filter((id) => id !== s.id));
                                  } else {
                                    setServicosInclusos((prev) => [...prev, s.id]);
                                  }
                                }}
                              />
                              <span>{s.nome}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Ativo */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="rounded text-[#D4AF37] focus:ring-[#D4AF37] h-4 w-4 bg-slate-950 border-slate-800"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    Serviço ativo para agendamento público
                  </span>
                </label>
              </div>

              {/* Botões */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] transition shadow-md shadow-[#D4AF37]/15"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
