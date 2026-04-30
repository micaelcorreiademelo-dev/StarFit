import React, { useState } from 'react';

interface Announcement {
  id: number;
  title: string;
  status: 'Ativo' | 'Inativo' | 'Pausado';
  priority: number;
  period: string;
  updatedAt: string;
}

const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: 'Comunicado de Manutenção Programada',
      status: 'Ativo',
      priority: 1,
      period: '24/03/2026 11:50 - 26/03/2026 08:00',
      updatedAt: '24/03/2026 15:02',
    },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'Informação',
    priority: 0,
    start: '',
    end: '',
    isActive: true,
  });

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-1">
          <span className="material-symbols-outlined text-2xl">campaign</span>
          <h1 className="text-2xl font-bold text-white">Comunicado Global para Parceiros</h1>
        </div>
        <p className="text-text-secondary text-sm">
          Crie um aviso completo com texto, formatação, imagens, links e vídeos incorporados para aparecer no topo do painel das unidades.
        </p>
      </header>

      {/* Form Section */}
      <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-sm">
        <div className="p-4 bg-background-dark/50 border-b border-border-dark flex justify-between items-center">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Publicação</h2>
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase">Ativo</span>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white flex items-center gap-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              placeholder="Ex.: Atualização importante da plataforma"
              className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none transition-colors"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white flex items-center gap-1">
              Mensagem <span className="text-red-500">*</span>
            </label>
            <div className="bg-background-dark border border-border-dark rounded-xl overflow-hidden">
              <div className="border-b border-border-dark p-2 flex flex-wrap gap-2">
                {/* Visual Toolbar Buttons */}
                <div className="flex gap-1 border-r border-border-dark pr-2">
                  <button className="p-1 px-2 hover:bg-white/5 rounded text-white text-sm font-serif">B</button>
                  <button className="p-1 px-2 hover:bg-white/5 rounded text-white text-sm italic">I</button>
                  <button className="p-1 px-2 hover:bg-white/5 rounded text-white text-sm underline">U</button>
                </div>
                <div className="flex gap-1 border-r border-border-dark pr-2 text-text-secondary">
                  <span className="material-symbols-outlined text-lg cursor-pointer hover:text-white">format_list_bulleted</span>
                  <span className="material-symbols-outlined text-lg cursor-pointer hover:text-white">format_list_numbered</span>
                </div>
                <div className="flex gap-1 border-r border-border-dark pr-2 text-text-secondary">
                  <span className="material-symbols-outlined text-lg cursor-pointer hover:text-white">link</span>
                  <span className="material-symbols-outlined text-lg cursor-pointer hover:text-white">image</span>
                  <span className="material-symbols-outlined text-lg cursor-pointer hover:text-red-500">video_library</span>
                </div>
              </div>
              <textarea 
                rows={10}
                className="w-full bg-transparent p-4 text-white focus:outline-none resize-none"
                placeholder="Escreva aqui seu comunicado ou cole o link do YouTube..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              />
              <div className="bg-background-dark/80 p-2 text-[10px] text-text-secondary border-t border-border-dark flex justify-between">
                <span>body p</span>
                <span>Use o ícone de vídeo para inserir conteúdo multimídia no ponto do texto.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Tipo do aviso</label>
              <select className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none">
                <option>Informação</option>
                <option>Manutenção</option>
                <option>Promoção</option>
                <option>Urgente</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Prioridade</label>
              <input 
                type="number" 
                defaultValue={0}
                className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Início (opcional)</label>
              <input 
                type="datetime-local" 
                className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Fim (opcional)</label>
              <input 
                type="datetime-local" 
                className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t border-border-dark">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="size-4 rounded border-border-dark bg-background-dark text-primary focus:ring-offset-background-dark focus:ring-primary"
              />
              <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">Ativo</span>
            </label>

            <div className="flex gap-3">
              <button className="bg-primary text-background-dark h-11 px-6 rounded-lg font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">publish</span>
                Salvar e Publicar
              </button>
              <button className="border border-red-500/50 text-red-500 h-11 px-6 rounded-lg font-bold text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">pause_circle</span>
                Desativar Aviso
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest border-b border-border-dark">
              <tr>
                <th className="px-6 py-4 font-bold">ID</th>
                <th className="px-6 py-4 font-bold">Título</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Prioridade</th>
                <th className="px-6 py-4 font-bold">Período</th>
                <th className="px-6 py-4 font-bold">Atualização</th>
                <th className="px-6 py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {announcements.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-text-secondary font-mono text-xs">#{item.id}</td>
                  <td className="px-6 py-4 text-white font-medium">{item.title}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'Ativo' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-white">{item.priority}</td>
                  <td className="px-6 py-4 text-text-secondary text-xs leading-relaxed">{item.period}</td>
                  <td className="px-6 py-4 text-text-secondary text-xs whitespace-nowrap">{item.updatedAt}</td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      className="text-text-secondary hover:text-white p-2 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                    
                    {openMenuId === item.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-full top-0 mr-2 w-40 bg-card-dark border border-border-dark rounded-xl shadow-xl z-50 overflow-hidden">
                          <button className="w-full px-4 py-2.5 text-left text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">edit</span>
                            Editar
                          </button>
                          <button className="w-full px-4 py-2.5 text-left text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">file_copy</span>
                            Duplicar
                          </button>
                          <button className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-red-500">delete</span>
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
