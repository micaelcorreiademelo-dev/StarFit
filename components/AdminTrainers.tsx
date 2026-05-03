import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

const AdminTrainers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'TRAINER'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("AdminTrainers snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateExpDate = async (id: string, newDate: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { expDate: newDate });
    } catch (error) {
      console.error("Error updating exp date:", error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    return user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary">
        Carregando usuários...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* PageHeading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Personais Cadastrados</h1>
          <p className="text-text-secondary">Acompanhe, edite e gerencie o acesso de todos os personais da plataforma.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex-grow">
          <div className="flex w-full items-stretch rounded-xl h-12 bg-card-dark border border-border-dark focus-within:border-primary transition-all">
            <div className="text-text-secondary flex items-center justify-center pl-4">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none text-white focus:ring-0 px-3 text-sm font-medium placeholder:text-text-secondary/50" 
              placeholder="Buscar por nome ou e-mail..." 
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border-dark bg-card-dark shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-background-dark/30 text-text-secondary text-[10px] uppercase tracking-[0.2em] border-b border-border-dark">
              <tr>
                <th className="px-4 py-5 font-black text-center w-12">#</th>
                <th className="px-6 py-5 font-black">Cadastro</th>
                <th className="px-6 py-5 font-black">Personal</th>
                <th className="px-6 py-5 font-black">Expiração Plano</th>
                <th className="px-6 py-5 font-black">Status</th>
                <th className="px-6 py-5 font-black text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-secondary">
                    Nenhum personal encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, i) => (
                  <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4 text-center font-mono text-text-secondary">
                      {i + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">
                          {user.regDate ? 
                            (typeof user.regDate === 'string' ? new Date(user.regDate).toLocaleDateString('pt-BR') : user.regDate.toDate().toLocaleDateString('pt-BR'))
                            : 'N/A'}
                        </span>
                        <span className="text-[10px] text-text-secondary uppercase">Registro</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-black uppercase tracking-tight">{user.name}</span>
                        <span className="text-xs text-text-secondary">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <input 
                          type="date"
                          value={user.expDate || ''}
                          onChange={(e) => handleUpdateExpDate(user.id, e.target.value)}
                          className="bg-background-dark/50 border border-border-dark rounded-md px-2 py-1 text-xs text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${user.status === 'Inativo' ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'}`}>
                        {user.status || 'Ativo'}
                      </span>
                    </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        title="Informações do Usuário"
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-primary/20 hover:text-primary transition-all transform hover:scale-110"
                      >
                        <span className="material-symbols-outlined text-lg">info</span>
                      </button>
                      <button 
                        onClick={() => navigate(`/impersonate/${user.id}`)}
                        title="Acessar Painel (Impersonate)"
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-blue-500/20 hover:text-blue-400 transition-all transform hover:scale-110"
                      >
                        <span className="material-symbols-outlined text-lg">login</span>
                      </button>
                      <a 
                        href={`https://wa.me/${user.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Falar no WhatsApp"
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-green-500/20 hover:text-green-400 transition-all transform hover:scale-110"
                      >
                        <span className="material-symbols-outlined text-lg">chat</span>
                      </a>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        title="Excluir Usuário"
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-red-500/20 hover:text-red-500 transition-all transform hover:scale-110"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* User Info Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card-dark border border-border-dark rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Detalhes do Personal</h3>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="text-text-secondary hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-text-secondary text-xs uppercase font-bold tracking-widest">ID</span>
                  <span className="text-white font-mono bg-background-dark/50 p-2 rounded border border-border-dark select-all">{selectedUser.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-text-secondary text-xs uppercase font-bold tracking-widest">Nome</span>
                    <span className="text-white font-black">{selectedUser.name || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-text-secondary text-xs uppercase font-bold tracking-widest">Status</span>
                    <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${selectedUser.status === 'Inativo' ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'}`}>
                      {selectedUser.status || 'Ativo'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-secondary text-xs uppercase font-bold tracking-widest">E-mail</span>
                  <span className="text-white bg-background-dark/50 p-2 rounded border border-border-dark select-all">{selectedUser.email}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-secondary text-xs uppercase font-bold tracking-widest">Telefone</span>
                  <span className="text-white bg-background-dark/50 p-2 rounded border border-border-dark select-all">{selectedUser.phone || 'Não informado'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-text-secondary text-xs uppercase font-bold tracking-widest">Plano</span>
                    <span className="text-white">{selectedUser.plan || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-text-secondary text-xs uppercase font-bold tracking-widest">Expiração</span>
                    <span className="text-white">
                      {selectedUser.expDate ? new Date(selectedUser.expDate).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-secondary text-xs uppercase font-bold tracking-widest">Data de Cadastro</span>
                  <span className="text-white">
                    {selectedUser.regDate ? 
                      (typeof selectedUser.regDate === 'string' ? new Date(selectedUser.regDate).toLocaleDateString('pt-BR') : selectedUser.regDate.toDate().toLocaleDateString('pt-BR'))
                      : 'N/A'}
                  </span>
                </div>
                {selectedUser.trainerCode && (
                  <div className="flex flex-col gap-1">
                    <span className="text-text-secondary text-xs uppercase font-bold tracking-widest">Código de Convite</span>
                    <span className="text-white font-mono font-bold bg-primary/10 text-primary p-2 rounded border border-primary/20 select-all">{selectedUser.trainerCode}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="bg-card-dark border border-border-dark text-white px-6 py-2 rounded-xl font-bold hover:bg-white/5 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTrainers;
