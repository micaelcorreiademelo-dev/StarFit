import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  status: 'Ativo' | 'Inativo';
  priority: number;
  start: string;
  end: string;
  updatedAt: any;
}

const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'Informação',
    priority: 0,
    start: '',
    end: '',
    isActive: true,
  });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const qAnnouncements = query(collection(db, 'announcements'), orderBy('priority', 'desc'));
    const unsubscribe = onSnapshot(qAnnouncements, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(docs);
      setLoading(false);
    }, (error) => {
      console.error("AdminAnnouncements snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Título e mensagem são obrigatórios.');
      return;
    }

    const dataObj = {
      title: formData.title,
      message: formData.message,
      type: formData.type,
      priority: Number(formData.priority) || 0,
      start: formData.start,
      end: formData.end,
      status: formData.isActive ? 'Ativo' : 'Inativo',
      updatedAt: serverTimestamp()
    };

    try {
      if (isEditingId) {
        await updateDoc(doc(db, 'announcements', isEditingId), dataObj);
        alert('Comunicado atualizado!');
      } else {
        await addDoc(collection(db, 'announcements'), {
          ...dataObj,
          createdAt: serverTimestamp()
        });
        alert('Comunicado publicado!');
      }
      resetForm();
    } catch (e) {
      console.error("Erro ao salvar comunicado", e);
      alert('Erro ao salvar.');
    }
  };

  const handleEdit = (item: Announcement) => {
    setIsEditingId(item.id);
    setFormData({
      title: item.title,
      message: item.message,
      type: item.type || 'Informação',
      priority: item.priority || 0,
      start: item.start || '',
      end: item.end || '',
      isActive: item.status === 'Ativo'
    });
    setOpenMenuId(null);
  };

  const handleDuplicate = async (item: Announcement) => {
    try {
      await addDoc(collection(db, 'announcements'), {
        title: item.title + ' (Cópia)',
        message: item.message,
        type: item.type || 'Informação',
        priority: item.priority || 0,
        start: item.start || '',
        end: item.end || '',
        status: item.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert('Comunicado duplicado!');
    } catch (e) {
      console.error("Erro ao duplicar comunicado", e);
      alert('Erro ao duplicar.');
    }
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      if (isEditingId === id) resetForm();
    } catch (e) {
      console.error("Erro ao excluir", e);
    }
    setOpenMenuId(null);
  };

  const handleToggleStatus = async () => {
    if (isEditingId) {
      try {
        const newStatus = formData.isActive ? 'Inativo' : 'Ativo';
        await updateDoc(doc(db, 'announcements', isEditingId), { status: newStatus });
        setFormData({ ...formData, isActive: !formData.isActive });
      } catch (e) {
        console.error("Erro ao pausar", e);
      }
    } else {
      setFormData({ ...formData, isActive: !formData.isActive });
    }
  };

  const resetForm = () => {
    setIsEditingId(null);
    setFormData({
      title: '', message: '', type: 'Informação', priority: 0, start: '', end: '', isActive: true
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-1">
          <span className="material-symbols-outlined text-2xl">campaign</span>
          <h1 className="text-2xl font-bold text-white">Comunicado Global para Parceiros</h1>
        </div>
        <p className="text-text-secondary text-sm">
          Crie um aviso completo com texto, formatação, images, links e vídeos incorporados para aparecer no topo do painel.
        </p>
      </header>

      {/* Form Section */}
      <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-sm">
        <div className="p-4 bg-background-dark/50 border-b border-border-dark flex justify-between items-center">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">{isEditingId ? 'Editar Publicação' : 'Nova Publicação'}</h2>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${formData.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {formData.isActive ? 'Ativo' : 'Inativo'}
          </span>
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
              <textarea 
                rows={10}
                className="w-full bg-transparent p-4 text-white focus:outline-none resize-none"
                placeholder="Escreva aqui seu comunicado..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              />
              <div className="bg-background-dark/80 p-2 text-[10px] text-text-secondary border-t border-border-dark flex justify-between">
                <span>body p</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Tipo do aviso</label>
              <select 
                className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="Informação">Informação</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Promoção">Promoção</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Prioridade</label>
              <input 
                type="number" 
                className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Início (opcional)</label>
              <input 
                type="datetime-local" 
                className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none"
                value={formData.start}
                onChange={(e) => setFormData({...formData, start: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Fim (opcional)</label>
              <input 
                type="datetime-local" 
                className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none"
                value={formData.end}
                onChange={(e) => setFormData({...formData, end: e.target.value})}
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
              <button 
                onClick={handleSave}
                className="bg-primary text-background-dark h-11 px-6 rounded-lg font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">publish</span>
                {isEditingId ? 'Salvar Edição' : 'Publicar'}
              </button>
              {isEditingId && (
                <button 
                  onClick={resetForm}
                  className="bg-background-dark border border-border-dark text-white h-11 px-6 rounded-lg font-bold text-sm hover:bg-white/5 transition-transform flex items-center gap-2"
                >
                  Cancelar
                </button>
              )}
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
                <th className="px-6 py-4 font-bold">Título</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Prioridade</th>
                <th className="px-6 py-4 font-bold">Período</th>
                <th className="px-6 py-4 font-bold">Atualização</th>
                <th className="px-6 py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-secondary">Carregando...</td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-secondary">Nenhum comunicado encontrado.</td>
                </tr>
              ) : (
              announcements.map((item) => (
                <tr key={item.id} className={`hover:bg-white/5 transition-colors ${isEditingId === item.id ? 'bg-primary/5' : ''}`}>
                  <td className="px-6 py-4 text-white font-medium">
                    {item.title}
                    <div className="text-[10px] text-text-secondary">{item.type}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'Ativo' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-white">{item.priority}</td>
                  <td className="px-6 py-4 text-text-secondary text-xs leading-relaxed">
                    {item.start ? new Date(item.start).toLocaleDateString() : '—'} <br/>
                    {item.end ? new Date(item.end).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-xs whitespace-nowrap">
                    {item.updatedAt?.seconds ? new Date(item.updatedAt.seconds * 1000).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="text-text-secondary hover:text-white p-2 rounded-lg transition-colors flex items-center justify-center bg-white/5"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDuplicate(item)}
                      className="text-text-secondary hover:text-white p-2 rounded-lg transition-colors flex items-center justify-center bg-white/5"
                      title="Duplicar"
                    >
                      <span className="material-symbols-outlined text-[18px]">file_copy</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-white p-2 rounded-lg transition-colors flex items-center justify-center focus:outline-none bg-red-500/10 hover:bg-red-500/30"
                      title="Excluir"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
