import React, { useState } from 'react';

const AdminPlans: React.FC = () => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Gestão de Planos e Assinaturas</h1>
        </div>
        <button className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg hover:scale-105 transition-transform flex items-center gap-2 w-full sm:w-auto justify-center">
          Criar Novo Plano
        </button>
      </header>

      <section>
        <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5">Planos Disponíveis</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(228px,1fr))] gap-4 py-3">
          
          {/* Starter Plan */}
          <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-border-dark bg-card-dark p-6 shadow-sm">
            <div className="flex flex-col gap-1">
              <h3 className="text-white text-base font-bold leading-tight">Starter</h3>
              <p className="flex items-baseline gap-1 text-white">
                <span className="text-4xl font-black leading-tight tracking-[-0.033em]">R$29</span>
                <span className="text-base font-bold leading-tight text-text-secondary">/mês</span>
              </p>
            </div>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-white/5 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-white/10 transition-colors">
              <span className="truncate">Editar Plano</span>
            </button>
            <div className="flex flex-col gap-2 mt-2">
              <div className="text-[13px] font-normal leading-normal flex items-center gap-2 text-text-secondary">
                <span className="material-symbols-outlined text-primary text-base">check</span>Até 20 clientes
              </div>
              <div className="text-[13px] font-normal leading-normal flex items-center gap-2 text-text-secondary">
                <span className="material-symbols-outlined text-primary text-base">check</span>Recursos Básicos
              </div>
              <div className="text-[13px] font-normal leading-normal flex items-center gap-2 text-text-secondary">
                <span className="material-symbols-outlined text-primary text-base">check</span>Suporte por Email
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="flex flex-1 flex-col gap-4 rounded-2xl border-2 border-primary bg-card-dark p-6 relative shadow-sm shadow-primary/10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-base font-bold leading-tight">Pro</h3>
                <p className="text-background-dark text-xs font-bold leading-normal tracking-[0.015em] rounded-full bg-primary px-3 py-1 text-center">Mais Popular</p>
              </div>
              <p className="flex items-baseline gap-1 text-white">
                <span className="text-4xl font-black leading-tight tracking-[-0.033em]">R$59</span>
                <span className="text-base font-bold leading-tight text-text-secondary">/mês</span>
              </p>
            </div>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity">
              <span className="truncate">Editar Plano</span>
            </button>
            <div className="flex flex-col gap-2 mt-2">
              <div className="text-[13px] font-normal leading-normal flex items-center gap-2 text-text-secondary">
                <span className="material-symbols-outlined text-primary text-base">check</span>Até 100 clientes
              </div>
              <div className="text-[13px] font-normal leading-normal flex items-center gap-2 text-text-secondary">
                <span className="material-symbols-outlined text-primary text-base">check</span>Relatórios Avançados
              </div>
              <div className="text-[13px] font-normal leading-normal flex items-center gap-2 text-text-secondary">
                <span className="material-symbols-outlined text-primary text-base">check</span>Suporte Prioritário
              </div>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-border-dark bg-card-dark p-6 shadow-sm">
            <div className="flex flex-col gap-1">
              <h3 className="text-white text-base font-bold leading-tight">Premium</h3>
              <p className="flex items-baseline gap-1 text-white">
                <span className="text-4xl font-black leading-tight tracking-[-0.033em]">R$99</span>
                <span className="text-base font-bold leading-tight text-text-secondary">/mês</span>
              </p>
            </div>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-white/5 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-white/10 transition-colors">
              <span className="truncate">Editar Plano</span>
            </button>
            <div className="flex flex-col gap-2 mt-2">
              <div className="text-[13px] font-normal leading-normal flex items-center gap-2 text-text-secondary">
                <span className="material-symbols-outlined text-primary text-base">check</span>Clientes Ilimitados
              </div>
              <div className="text-[13px] font-normal leading-normal flex items-center gap-2 text-text-secondary">
                <span className="material-symbols-outlined text-primary text-base">check</span>Todos os Recursos
              </div>
              <div className="text-[13px] font-normal leading-normal flex items-center gap-2 text-text-secondary">
                <span className="material-symbols-outlined text-primary text-base">check</span>Suporte Dedicado 24/7
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5">Assinaturas dos Personal Trainers</h2>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex-grow">
            <label className="flex flex-col w-full">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-12 bg-card-dark border border-border-dark focus-within:border-primary transition-colors">
                <div className="text-text-secondary flex items-center justify-center pl-4">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input 
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-text-secondary px-2 text-base font-normal" 
                  placeholder="Buscar por nome ou email..." 
                />
              </div>
            </label>
          </div>
          <div className="flex gap-3">
            <select className="h-12 rounded-lg bg-card-dark border border-border-dark px-4 text-white text-sm font-medium focus:ring-primary focus:border-primary outline-none">
              <option>Filtrar por Status</option>
              <option>Ativo</option>
              <option>Inativo</option>
            </select>
            <select className="h-12 rounded-lg bg-card-dark border border-border-dark px-4 text-white text-sm font-medium focus:ring-primary focus:border-primary outline-none">
              <option>Filtrar por Plano</option>
              <option>Starter</option>
              <option>Pro</option>
              <option>Premium</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border-dark bg-card-dark shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 font-bold" scope="col">Personal Trainer</th>
                  <th className="px-6 py-4 font-bold" scope="col">Plano</th>
                  <th className="px-6 py-4 font-bold" scope="col">Status</th>
                  <th className="px-6 py-4 font-bold" scope="col">Próxima Cobrança</th>
                  <th className="px-6 py-4 font-bold text-right" scope="col">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img className="h-8 w-8 rounded-full object-cover" alt="Avatar de João Silva" src="https://i.pravatar.cc/150?u=joao" />
                      <div>
                        <div className="text-white">João Silva</div>
                        <div className="text-xs text-text-secondary">joao.silva@email.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">Pro</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2 py-1 text-xs font-bold uppercase text-green-400">
                      <span className="size-1.5 rounded-full bg-green-500"></span>
                      Ativo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">15/08/2024</td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === 0 ? null : 0)}
                      className="text-text-secondary hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>

                    {openMenuId === 0 && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-full top-0 mr-2 w-40 bg-card-dark border border-border-dark rounded-xl shadow-xl z-50 overflow-hidden text-left">
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
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img className="h-8 w-8 rounded-full object-cover" alt="Avatar de Maria Oliveira" src="https://i.pravatar.cc/150?u=maria" />
                      <div>
                        <div className="text-white">Maria Oliveira</div>
                        <div className="text-xs text-text-secondary">maria.o@email.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">Starter</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2 py-1 text-xs font-bold uppercase text-green-400">
                      <span className="size-1.5 rounded-full bg-green-500"></span>
                      Ativo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">22/08/2024</td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === 1 ? null : 1)}
                      className="text-text-secondary hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>

                    {openMenuId === 1 && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-full top-0 mr-2 w-40 bg-card-dark border border-border-dark rounded-xl shadow-xl z-50 overflow-hidden text-left">
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
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img className="h-8 w-8 rounded-full object-cover" alt="Avatar de Carlos Pereira" src="https://i.pravatar.cc/150?u=carlos" />
                      <div>
                        <div className="text-white">Carlos Pereira</div>
                        <div className="text-xs text-text-secondary">carlos.p@email.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">Premium</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-1 text-xs font-bold uppercase text-red-400">
                      <span className="size-1.5 rounded-full bg-red-500"></span>
                      Inativo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">-</td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === 2 ? null : 2)}
                      className="text-text-secondary hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>

                    {openMenuId === 2 && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-full top-0 mr-2 w-40 bg-card-dark border border-border-dark rounded-xl shadow-xl z-50 overflow-hidden text-left">
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
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-border-dark flex items-center justify-between">
            <span className="text-sm font-normal text-text-secondary">Exibindo <span className="font-semibold text-white">1-3</span> de <span className="font-semibold text-white">100</span></span>
            <div className="inline-flex -space-x-px text-sm h-8">
              <button className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-text-secondary bg-card-dark border border-e-0 border-border-dark rounded-s-lg hover:bg-white/5 hover:text-white transition-colors">
                Anterior
              </button>
              <button className="flex items-center justify-center px-3 h-8 leading-tight text-text-secondary bg-card-dark border border-border-dark rounded-e-lg hover:bg-white/5 hover:text-white transition-colors">
                Próximo
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminPlans;
