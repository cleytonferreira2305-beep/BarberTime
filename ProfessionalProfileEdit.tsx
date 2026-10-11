import React, { useState } from 'react';
import { Profissional, Categoria } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Save, Globe, Phone, MapPin, Image, Check, Eye, Copy, Share2, Sparkles, ExternalLink } from 'lucide-react';
import { getProfileShareLinks } from '../../utils/shareUtils';
import { ShareProfileModal } from '../ui/ShareProfileModal';

interface Props {
  profissional: Profissional;
}

export const ProfessionalProfileEdit: React.FC<Props> = ({ profissional }) => {
  const { refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [nomePublico, setNomePublico] = useState(profissional.nome_publico);
  const [slug, setSlug] = useState(profissional.slug);
  const [categoriaNome, setCategoriaNome] = useState(profissional.categoria_nome);
  const [descricao, setDescricao] = useState(profissional.descricao);
  const [foto, setFoto] = useState(profissional.foto);
  const [capa, setCapa] = useState(profissional.capa || '');
  const [endereco, setEndereco] = useState(profissional.endereco);
  const [bairro, setBairro] = useState(profissional.bairro || '');
  const [cidade, setCidade] = useState(profissional.cidade);
  const [estado, setEstado] = useState(profissional.estado);
  const [whatsapp, setWhatsapp] = useState(profissional.whatsapp);
  const [publicado, setPublicado] = useState(profissional.publicado);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const shareLinks = getProfileShareLinks(profissional);

  const handleCopyCurrentShortLink = () => {
    navigator.clipboard.writeText(shareLinks.fullUrl);
    setCopiedLink(true);
    success('Link Copiado!', 'Link direto copiado para a área de transferência.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomePublico.trim()) {
      toastError('Nome obrigatório', 'Informe o nome público do estabelecimento.');
      return;
    }
    if (!slug.trim()) {
      toastError('Slug obrigatório', 'Informe um link exclusivo para seu perfil.');
      return;
    }

    setSaving(true);
    try {
      const updated = await db.salvarProfissional({
        id: profissional.id,
        user_id: profissional.user_id,
        nome_publico: nomePublico.trim(),
        slug: slug.trim().toLowerCase(),
        categoria_nome: categoriaNome,
        descricao: descricao.trim(),
        foto: foto.trim(),
        capa: capa.trim() || undefined,
        endereco: endereco.trim(),
        bairro: bairro.trim() || undefined,
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        whatsapp: whatsapp.replace(/\D/g, ''),
        publicado,
      });

      await refreshProfile();
      success('Perfil Atualizado', 'As informações públicas do seu perfil foram salvas com sucesso.');
    } catch {
      toastError('Erro', 'Falha ao salvar as alterações do perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-[#0F1420] border border-slate-800 space-y-6">
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-serif-luxury">
            Configurações do Perfil Público
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalize como seu negócio aparece para os clientes nas buscas e no link de agendamento
          </p>
        </div>

        <button
          form="profile-form"
          type="submit"
          disabled={saving}
          className="py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md shadow-[#D4AF37]/15"
        >
          <Save className="w-4 h-4 stroke-[2.5]" />
          <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>

      <form id="profile-form" onSubmit={handleSave} className="space-y-5 text-xs">
        {/* Status de publicação */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-white block">Status de Publicação</span>
            <span className="text-slate-400 text-xs">
              Quando ativado, seu perfil e serviços ficam visíveis na busca e acessíveis pelo link.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={publicado}
              onChange={(e) => setPublicado(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
          </label>
        </div>

        {/* Nome e Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Nome Público do Estabelecimento / Profissional <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nomePublico}
              onChange={(e) => setNomePublico(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-300">
                Link de Agendamento (Slug exclusivo) <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold"
              >
                <Share2 className="w-3 h-3" />
                <span>Divulgar Link</span>
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500 font-mono text-xs">
                barbertime.app/#/p/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full pl-36 pr-20 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="button"
                onClick={handleCopyCurrentShortLink}
                className="absolute right-2 top-2 py-1 px-2.5 rounded-lg text-[10px] font-bold text-slate-300 bg-slate-800 hover:text-white flex items-center gap-1 transition"
                title="Copiar link atual"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Link curto divulgado:{' '}
              <span className="text-[#D4AF37] font-mono">{shareLinks.displayShortUrl}</span>
            </p>
          </div>
        </div>

        {/* Categoria e WhatsApp */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Categoria Principal
            </label>
            <select
              value={categoriaNome}
              onChange={(e) => setCategoriaNome(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="Barbearia">Barbearia</option>
              <option value="Cabeleireiro">Cabeleireiro</option>
              <option value="Manicure & Pedicure">Manicure & Pedicure</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              WhatsApp de Atendimento (Apenas números) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">
            Biografia / Descrição do Estabelecimento
          </label>
          <textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37] resize-none"
            placeholder="Conte aos clientes sobre sua experiência, especialidades e diferenciais."
          />
        </div>

        {/* Fotos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              URL da Foto de Perfil / Logo
            </label>
            <div className="relative">
              <Image className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="url"
                value={foto}
                onChange={(e) => setFoto(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              URL da Foto de Capa (Opcional)
            </label>
            <div className="relative">
              <Image className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="url"
                value={capa}
                onChange={(e) => setCapa(e.target.value)}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label className="block font-semibold text-slate-300 mb-1">
              Endereço Comercial <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block font-semibold text-slate-300 mb-1">Bairro</label>
            <input
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-300 mb-1">
              Cidade <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block font-semibold text-slate-300 mb-1">UF</label>
            <input
              type="text"
              maxLength={2}
              required
              value={estado}
              onChange={(e) => setEstado(e.target.value.toUpperCase())}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white text-center focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </form>

      {/* Modal de Divulgação e Links Rápidos */}
      <ShareProfileModal
        profissional={profissional}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
};
