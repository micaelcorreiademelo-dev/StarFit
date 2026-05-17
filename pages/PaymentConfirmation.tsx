
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface PaymentConfirmationProps {
  user: User;
}

const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-text-dark dark:text-text-primary min-h-screen flex flex-col animate-in fade-in duration-500">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-border-light dark:border-border-dark bg-white/80 dark:bg-card-dark/80 backdrop-blur-md px-4 sm:px-10 py-3 shadow-sm shrink-0">
        <div className="flex items-center gap-4 text-text-dark dark:text-white">
          <div className="size-8 text-primary">
            <span className="material-symbols-outlined fill text-3xl">fitness_center</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">StarFit</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm hidden sm:block font-medium text-text-medium dark:text-text-secondary">Olá, {(user.name || 'Aluno').split(' ')[0]}</span>
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 border-2 border-primary" 
            style={{ backgroundImage: `url(${user.avatar})` }}
          ></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex grow flex-col min-h-0 items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="py-12 w-full flex flex-col items-center">
          {/* Confirmation Card */}
          <div className="flex flex-col w-full max-w-[540px] bg-white dark:bg-card-dark rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700 border border-border-light dark:border-border-dark shrink-0">
            {/* Hero / Success Message Section */}
            <div className="flex flex-col items-center gap-6 px-6 pt-10 pb-6 text-center">
              {/* Decorative Icon Container */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150"></div>
                <div className="relative flex items-center justify-center w-24 h-24 bg-primary rounded-full shadow-lg shadow-primary/30">
                  <span className="material-symbols-outlined text-background-dark text-[48px] font-bold">check</span>
                </div>
              </div>
              <div className="flex max-w-[480px] flex-col items-center gap-3 mt-4">
                <h1 className="text-text-dark dark:text-white text-2xl sm:text-3xl font-bold leading-tight tracking-[-0.015em]">Pagamento realizado!</h1>
                <p className="text-text-medium dark:text-text-secondary text-base font-normal leading-relaxed max-w-sm">
                  Parabéns! Sua assinatura foi confirmada. Prepare-se para superar seus limites e começar sua jornada hoje mesmo.
                </p>
              </div>
            </div>

            {/* Receipt / Summary Section */}
            <div className="px-6 pb-8">
              <div className="bg-background-light dark:bg-background-dark/50 rounded-xl p-6 border border-border-light dark:border-border-dark">
                <div className="flex items-center gap-3 mb-6 border-b border-border-light dark:border-border-dark pb-4">
                  <div className="bg-white dark:bg-card-dark p-2 rounded-lg shadow-sm">
                    <span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-text-medium dark:text-text-secondary uppercase tracking-wider">Resumo do Pedido</p>
                    <p className="text-sm font-bold text-text-dark dark:text-white">#9384-2938</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-medium dark:text-text-secondary">Plano adquirido</span>
                    <span className="font-semibold text-text-dark dark:text-white">Plano Semestral Gold</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-medium dark:text-text-secondary">Data da compra</span>
                    <span className="font-medium text-text-dark dark:text-white">{new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-medium dark:text-text-secondary">Forma de pagamento</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-text-medium dark:text-text-secondary">credit_card</span>
                      <span className="font-medium text-text-dark dark:text-white">Cartão final 4242</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-base pt-2 border-t border-border-light dark:border-border-dark mt-2">
                    <span className="font-bold text-text-medium dark:text-text-secondary">Valor total</span>
                    <span className="font-bold text-lg text-primary">R$ 89,90</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-background-light/50 dark:bg-background-dark/30 px-6 py-6 border-t border-border-light dark:border-border-dark">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => navigate('/')}
                  className="group flex items-center justify-center gap-2 w-full sm:flex-1 cursor-pointer overflow-hidden rounded-lg h-12 px-6 bg-primary hover:brightness-110 text-background-dark font-bold transition-all shadow-md shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5"
                >
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">fitness_center</span>
                  <span className="truncate">Ir para Meus Treinos</span>
                </button>
                <button className="flex items-center justify-center gap-2 w-full sm:flex-1 cursor-pointer overflow-hidden rounded-lg h-12 px-6 bg-transparent border-2 border-border-light dark:border-border-dark hover:bg-border-light dark:hover:bg-border-dark/30 text-text-dark dark:text-white font-medium transition-colors">
                  <span className="material-symbols-outlined text-[20px]">description</span>
                  <span className="truncate">Ver Fatura</span>
                </button>
              </div>
              <div className="mt-6 text-center">
                <a className="inline-flex items-center gap-1 text-sm text-text-medium dark:text-text-secondary hover:text-primary transition-colors" href="#">
                  <span className="material-symbols-outlined text-[16px]">help</span>
                  Precisa de ajuda? Fale com o suporte
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full py-6 text-center mt-auto shrink-0">
        <p className="text-text-medium dark:text-text-secondary text-sm font-normal">© {new Date().getFullYear()} StarFit. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default PaymentConfirmation;
