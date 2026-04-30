import React, { useState } from 'react';

const AdminTrainers: React.FC = () => {
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'personal'>('all');
  
  // Real-world logic: normally we'd fetch this. 
  // For the demo, we use state so expiration dates are editable.
  const [users, setUsers] = useState([
    { id: 1, name: 'Ana Costa', email: 'ana.costa@email.com', status: 'Ativo', regDate: '2023-01-15', expDate: '2024-01-15', type: 'personal', phone: '5511999999999', sColor: 'bg-green-500/20 text-green-400' },
    { id: 2, name: 'Bruno Lima', email: 'bruno.lima@email.com', status: 'Inativo', regDate: '2023-02-20', expDate: '2024-02-20', type: 'personal', phone: '5511999999999', sColor: 'bg-gray-500/20 text-gray-400' },
    { id: 4, name: 'Carlos Souza', email: 'carlos.souza@email.com', status: 'Ativo', regDate: '2023-03-10', expDate: '2024-03-10', type: 'personal', phone: '5511999999999', sColor: 'bg-green-500/20 text-green-400' },
    { id: 6, name: 'Daniela Ferraz', email: 'daniela.ferraz@email.com', status: 'Ativo', regDate: '2023-04-05', expDate: '2024-04-05', type: 'personal', phone: '5511999999999', sColor: 'bg-green-500/20 text-green-400' },
    { id: 7, name: 'Eduardo Martins', email: 'eduardo.martins@email.com', status: 'Pendente', regDate: '2023-05-21', expDate: '2024-05-21', type: 'personal', phone: '5511999999999', sColor: 'bg-yellow-500/20 text-yellow-400' },
    { id: 8, name: 'Fernanda Alves', email: 'fernanda.alves@email.com', status: 'Ativo', regDate: '2023-06-12', expDate: '2024-06-12', type: 'personal', phone: '5511999999999', sColor: 'bg-green-500/20 text-green-400' },
  ]);

  const handleUpdateExpDate = (id: number, newDate: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, expDate: newDate } : u));
  };

  const handleDeleteUser = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const filteredUsers = users.filter(user => {
    if (userTypeFilter === 'all') return true;
    return user.type === userTypeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* PageHeading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Gestão de Usuários</h1>
          <p className="text-text-secondary">Acompanhe, edite e gerencie o acesso de todos os clientes da plataforma.</p>
        </div>
        <button className="flex items-center justify-center gap-2 h-10 px-6 bg-primary text-background-dark rounded-lg text-sm font-black shadow-[0_4px_20px_rgba(var(--color-primary),0.3)] hover:scale-105 transition-transform w-full md:w-auto">
          <span className="material-symbols-outlined font-bold">add</span>
          <span>NOVO CADASTRO</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex-grow">
          <div className="flex w-full items-stretch rounded-xl h-12 bg-card-dark border border-border-dark focus-within:border-primary transition-all">
            <div className="text-text-secondary flex items-center justify-center pl-4">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              className="w-full bg-transparent border-none text-white focus:ring-0 px-3 text-sm font-medium placeholder:text-text-secondary/50" 
              placeholder="Buscar por nome, e-mail ou identificador..." 
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative group">
            <button className="flex h-12 items-center gap-x-2 rounded-xl bg-card-dark border border-border-dark px-4 hover:bg-white/5 transition-all text-sm font-bold text-white">
              {userTypeFilter === 'all' ? 'Todos os Tipos' : 'Personal'}
              <span className="material-symbols-outlined text-text-secondary">expand_more</span>
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-card-dark border border-border-dark rounded-xl shadow-2xl z-20 hidden group-hover:block overflow-hidden animate-in fade-in slide-in-from-top-2">
              {['all', 'personal'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setUserTypeFilter(t as any)}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-text-secondary hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest"
                >
                  {t === 'all' ? 'Todos' : 'Personal'}
                </button>
              ))}
            </div>
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
                <th className="px-6 py-5 font-black">Usuário</th>
                <th className="px-6 py-5 font-black">Expiração</th>
                <th className="px-6 py-5 font-black">Tipo</th>
                <th className="px-6 py-5 font-black">Status</th>
                <th className="px-6 py-5 font-black text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {filteredUsers.map((user, i) => (
                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 text-center font-mono text-text-secondary">
                    {i + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-bold">{new Date(user.regDate).toLocaleDateString('pt-BR')}</span>
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
                        value={user.expDate}
                        onChange={(e) => handleUpdateExpDate(user.id, e.target.value)}
                        className="bg-background-dark/50 border border-border-dark rounded-md px-2 py-1 text-xs text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
                      />
                      <span className="text-[10px] text-text-secondary uppercase">Validade do Plano</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                      Personal
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${user.sColor}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* User Info */}
                      <button 
                        title="Informações do Usuário"
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white transition-all transform hover:scale-110"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      
                      {/* Admin Access */}
                      <button 
                        title="Acessar Painel Admin"
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-primary/20 hover:text-primary transition-all transform hover:scale-110"
                      >
                        <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                      </button>
                      
                      {/* WhatsApp */}
                      <a 
                        href={`https://wa.me/${user.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Falar no WhatsApp"
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-green-500/20 hover:text-green-400 transition-all transform hover:scale-110"
                      >
                        <span className="material-symbols-outlined text-lg">chat</span>
                      </a>
                      
                      {/* Delete */}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTrainers;
