
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { User } from '../types';

interface SubscriptionManagementProps {
  user: User;
  onLogout: () => void;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subscription');

  const handleTabChange = (tab: string) => {
    if (tab === 'dashboard' || tab === 'my-workouts' || tab === 'progress' || tab === 'messages' || tab === 'settings') {
      // Essas abas levam de volta para o Dashboard principal nessas seções
      navigate('/');
    } else {
      setActiveTab(tab);
    }
  };

  const pixCode = "00020101021226850014br.gov.bcb.pix0163pix-placeholder-key-starfit-saas-2023-gabriel-silva-premium-payment";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixCode);
    alert("Código PIX copiado!");
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden font-display transition-colors duration-200">
      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 md:px-10 bg-white dark:bg-card-dark border-b border-border-light dark:border-white/10 flex-shrink-0 z-10">
          <div className="flex items-center gap-4 md:hidden">
            <button className="text-text-dark dark:text-white">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-bold text-lg">StarFit</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-text-secondary">
            <span className="material-symbols-outlined text-lg text-primary">verified_user</span>
            <span>Ambiente Seguro e Criptografado</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-text-dark dark:text-white relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-card-dark"></span>
            </button>
            <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-text-dark dark:text-white">{user.name}</p>
                <p className="text-xs text-text-secondary">Membro desde 2023</p>
              </div>
              <div 
                className="size-10 rounded-full bg-gray-200 bg-center bg-cover border-2 border-white dark:border-card-dark shadow-sm" 
                style={{ backgroundImage: `url(${user.avatar})` }}
              ></div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-10">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-text-secondary">
              <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Home</button>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Conta</button>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="font-medium text-text-dark dark:text-white">Gestão de Assinatura</span>
            </nav>

            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-dark dark:text-white">Gestão de Assinatura</h1>
              <p className="text-text-secondary text-base md:text-lg">Centralize suas informações de faturamento e métodos de pagamento.</p>
            </div>

            {/* Current Plan Summary */}
            <div className="bg-white dark:bg-card-dark rounded-2xl border border-border-light dark:border-white/10 overflow-hidden shadow-sm">
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex items-start gap-4">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-3xl fill">workspace_premium</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1">Plano Atual</p>
                      <h3 className="text-xl font-black text-text-dark dark:text-white">StarFit Premium</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 mt-1">
                        Status: Ativo
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 md:border-l md:border-gray-100 dark:md:border-white/5 md:pl-8">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-3xl">payments</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1">Valor</p>
                      <h3 className="text-xl font-black text-text-dark dark:text-white">R$ 119,90<span className="text-xs font-normal text-text-secondary">/mês</span></h3>
                      <p className="text-[10px] text-text-secondary mt-1">Próxima cobrança automática</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 md:border-l md:border-gray-100 dark:md:border-white/5 md:pl-8">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-3xl">event_repeat</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1">Próxima Renovação</p>
                      <h3 className="text-xl font-black text-text-dark dark:text-white">12 Out, 2024</h3>
                      <button className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider mt-1">Cancelar Assinatura</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 px-8 py-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-4 justify-between items-center">
                <p className="text-xs text-text-secondary">Acesso total à unidade, aulas coletivas e consultoria nutricional inclusa.</p>
                <button className="text-xs font-bold text-primary hover:underline underline-offset-4">Gerenciar Benefícios</button>
              </div>
            </div>

            {/* Saved Cards */}
            <section className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-text-dark dark:text-white">Cartões Salvos</h3>
                  <span className="bg-gray-100 dark:bg-white/10 text-text-secondary text-xs px-2 py-0.5 rounded-full">2</span>
                </div>
                <button className="flex items-center gap-2 text-primary hover:text-primary-hover font-bold text-sm group">
                  <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">add_card</span>
                  <span>Adicionar Novo</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Main Card */}
                <div className="relative bg-white dark:bg-card-dark rounded-xl border-2 border-primary shadow-sm overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 bg-primary text-background-dark text-xs font-bold px-3 py-1 rounded-bl-lg z-10">Principal</div>
                  <div className="p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-4">
                        <div className="w-12 h-8 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 border border-yellow-500/20 shadow-inner opacity-80"></div>
                        <div className="flex items-center gap-2 text-text-secondary">
                          <span className="material-symbols-outlined text-sm">lock</span>
                          <span className="text-xs font-medium uppercase tracking-wider">Crédito</span>
                        </div>
                      </div>
                      <div className="bg-contain bg-right bg-no-repeat h-8 w-14" style={{ backgroundImage: "url('https://img.icons8.com/color/48/visa.png')" }}></div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 text-2xl font-display font-medium tracking-widest text-text-dark dark:text-white">
                        <span className="text-text-secondary/40 text-lg align-middle">•••• •••• ••••</span>
                        <span>4829</span>
                      </div>
                      <div className="flex gap-8 mt-4">
                        <div>
                          <p className="text-[10px] uppercase text-text-secondary font-bold tracking-wider">Titular</p>
                          <p className="text-sm font-medium text-text-dark dark:text-white">{user.name.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-text-secondary font-bold tracking-wider">Validade</p>
                          <p className="text-sm font-medium text-text-dark dark:text-white">12/28</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 p-3 flex justify-end gap-2 mt-auto">
                    <button className="p-2 rounded-lg text-text-secondary hover:text-text-dark dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-sm font-medium">
                      <span className="material-symbols-outlined text-lg">edit</span>
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                    <button className="p-2 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1 text-sm font-medium">
                      <span className="material-symbols-outlined text-lg">delete</span>
                      <span className="hidden sm:inline">Remover</span>
                    </button>
                  </div>
                </div>

                {/* Secondary Card */}
                <div className="relative bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-white/10 shadow-sm overflow-hidden flex flex-col group hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                  <div className="p-6 flex flex-col gap-6 opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-4">
                        <div className="w-12 h-8 rounded bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-inner"></div>
                        <div className="flex items-center gap-2 text-text-secondary">
                          <span className="text-xs font-medium uppercase tracking-wider">Crédito</span>
                        </div>
                      </div>
                      <div className="bg-contain bg-right bg-no-repeat h-8 w-14 grayscale group-hover:grayscale-0 transition-all" style={{ backgroundImage: "url('https://img.icons8.com/color/48/mastercard.png')" }}></div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 text-2xl font-display font-medium tracking-widest text-text-dark dark:text-white">
                        <span className="text-text-secondary/40 text-lg align-middle">•••• •••• ••••</span>
                        <span>9211</span>
                      </div>
                      <div className="flex gap-8 mt-4">
                        <div>
                          <p className="text-[10px] uppercase text-text-secondary font-bold tracking-wider">Titular</p>
                          <p className="text-sm font-medium text-text-dark dark:text-white">{user.name.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-text-secondary font-bold tracking-wider">Validade</p>
                          <p className="text-sm font-medium text-text-dark dark:text-white">08/25</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 p-3 flex justify-between items-center mt-auto">
                    <button className="text-xs font-bold text-primary hover:text-primary-hover px-2">Definir como principal</button>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg text-text-secondary hover:text-text-dark dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button className="p-2 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Other Payment Methods (PIX) */}
            <section className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-text-dark dark:text-white">Outros Métodos de Pagamento</h3>
              </div>
              <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-white/10 p-6 md:p-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  <div className="w-full lg:w-1/3 flex flex-col items-center bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-primary/20">
                    <div className="bg-white p-3 rounded-xl shadow-inner mb-4">
                      <img alt="QR Code PIX" className="size-32" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=StarFitPaymentPix" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary text-xl">qr_code_2</span>
                      <span className="font-bold text-sm text-text-dark dark:text-white">Pagar com PIX</span>
                    </div>
                    <p className="text-[10px] text-text-secondary text-center leading-tight">Válido para pagamento imediato</p>
                  </div>
                  <div className="flex-1 flex flex-col gap-6">
                    <div>
                      <h4 className="font-bold text-lg text-text-dark dark:text-white mb-2">Renovação Instantânea via PIX</h4>
                      <p className="text-sm text-text-secondary">O PIX é processado instantaneamente. Use para renovar seu plano agora caso não deseje usar cartão de crédito.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex gap-3">
                        <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black flex-shrink-0">1</div>
                        <p className="text-xs text-text-secondary">Abra o app do seu banco e escolha <b>"Pagar via PIX"</b>.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black flex-shrink-0">2</div>
                        <p className="text-xs text-text-secondary">Escaneie o QR Code ou <b>copie o código abaixo</b>.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black flex-shrink-0">3</div>
                        <p className="text-xs text-text-secondary">Confirme os dados da <b>StarFit SaaS</b> e o valor.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black flex-shrink-0">4</div>
                        <p className="text-xs text-text-secondary">Pronto! Sua assinatura será validada em <b>segundos</b>.</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Código PIX Copia e Cola</label>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-lg font-mono text-xs truncate items-center flex text-text-dark dark:text-gray-300">
                          {pixCode}
                        </div>
                        <button 
                          onClick={copyToClipboard}
                          className="bg-primary hover:brightness-110 text-background-dark p-2 rounded-lg flex items-center gap-2 font-bold text-sm transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">content_copy</span>
                          <span className="hidden sm:inline">Copiar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Security Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-white/10">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined">shield_lock</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-dark dark:text-white mb-1">Pagamento Seguro</h3>
                  <p className="text-sm text-text-secondary leading-relaxed max-w-xl">Todos os seus dados sensíveis são processados através de gateways certificados PCI-DSS. Não armazenamos o código CVV em nossos servidores.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 opacity-40 grayscale hover:grayscale-0 transition-all">
                <img alt="Visa" className="h-6" src="https://img.icons8.com/color/48/visa.png" />
                <img alt="Mastercard" className="h-6" src="https://img.icons8.com/color/48/mastercard.png" />
                <span className="material-symbols-outlined text-3xl text-text-secondary">lock</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
