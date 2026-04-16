import React from 'react';

const AdminTrainers: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* PageHeading */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-white">Gestão de Personal Trainers</h1>
        <button className="flex items-center justify-center gap-2 h-10 px-4 bg-primary text-background-dark rounded-lg text-sm font-bold shadow-sm hover:scale-105 transition-transform">
          <span className="material-symbols-outlined">add</span>
          <span className="truncate">Adicionar Novo Trainer</span>
        </button>
      </div>

      {/* Filters: SearchBar and Chips */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex-grow">
          <label className="flex flex-col w-full">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-12 bg-card-dark border border-border-dark focus-within:border-primary transition-colors">
              <div className="text-text-secondary flex items-center justify-center pl-4">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input 
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-text-secondary px-2 text-base font-normal" 
                placeholder="Buscar por nome, e-mail ou ID" 
              />
            </div>
          </label>
        </div>
        <div className="flex gap-3">
          <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-card-dark border border-border-dark px-4 hover:bg-white/5 transition-colors">
            <p className="text-white text-sm font-medium">Todos os Planos</p>
            <span className="material-symbols-outlined text-text-secondary text-base">expand_more</span>
          </button>
          <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-card-dark border border-border-dark px-4 hover:bg-white/5 transition-colors">
            <p className="text-white text-sm font-medium">Status</p>
            <span className="material-symbols-outlined text-text-secondary text-base">expand_more</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border-dark bg-card-dark shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-bold">Nome</th>
                <th className="px-6 py-4 font-bold">E-mail</th>
                <th className="px-6 py-4 font-bold">Plano</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Data de Cadastro</th>
                <th className="px-6 py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {[
                { name: 'Ana Costa', email: 'ana.costa@email.com', plan: 'Plano Pro', status: 'Ativo', date: '2023-01-15', sColor: 'bg-green-500/20 text-green-400' },
                { name: 'Bruno Lima', email: 'bruno.lima@email.com', plan: 'Plano Básico', status: 'Inativo', date: '2023-02-20', sColor: 'bg-gray-500/20 text-gray-400' },
                { name: 'Carlos Souza', email: 'carlos.souza@email.com', plan: 'Plano Pro', status: 'Ativo', date: '2023-03-10', sColor: 'bg-green-500/20 text-green-400' },
                { name: 'Daniela Ferraz', email: 'daniela.ferraz@email.com', plan: 'Plano Pro', status: 'Ativo', date: '2023-04-05', sColor: 'bg-green-500/20 text-green-400' },
                { name: 'Eduardo Martins', email: 'eduardo.martins@email.com', plan: 'Plano Básico', status: 'Pendente', date: '2023-05-21', sColor: 'bg-yellow-500/20 text-yellow-400' },
                { name: 'Fernanda Alves', email: 'fernanda.alves@email.com', plan: 'Plano Pro', status: 'Ativo', date: '2023-06-12', sColor: 'bg-green-500/20 text-green-400' },
              ].map((trainer, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{trainer.name}</td>
                  <td className="px-6 py-4 text-text-secondary">{trainer.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/20 text-primary">
                      {trainer.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${trainer.sColor}`}>
                      {trainer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{trainer.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-text-secondary hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
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
