
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface CheckoutProps {
  user: User;
}

const Checkout: React.FC<CheckoutProps> = ({ user }) => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | 'boleto'>('credit_card');

  const handleFinalizePayment = () => {
    // Simula o processo de pagamento e navega
    navigate('/payment-confirmation');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark h-screen w-full flex flex-col font-display animate-in fade-in duration-500 overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border-light bg-background-light/95 backdrop-blur-sm px-6 py-4 dark:bg-background-dark/95 dark:border-white/10 shadow-sm shrink-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 text-text-dark dark:text-white">
            <div className="flex items-center justify-center rounded-lg bg-primary/20 p-2 text-primary">
              <span className="material-symbols-outlined fill">fitness_center</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">StarFit</h2>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium text-text-medium hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Voltar para Planos
            </button>
            <div 
              className="h-10 w-10 overflow-hidden rounded-full bg-cover bg-center ring-2 ring-primary/20" 
              style={{ backgroundImage: `url(${user.avatar})` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl pb-24">
          {/* Page Heading */}
          <div className="mb-10 flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-text-dark dark:text-white md:text-4xl">Finalizar Pagamento</h1>
            <p className="text-text-medium dark:text-gray-400">Revise seu plano e escolha a forma de pagamento segura.</p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column: Payment Form */}
            <div className="flex flex-col gap-8 lg:col-span-8">
              {/* Payment Methods Tabs */}
              <div className="rounded-xl border border-border-light bg-white p-6 shadow-sm dark:bg-white/5 dark:border-white/10">
                <h3 className="mb-6 text-lg font-semibold text-text-dark dark:text-white">Como você prefere pagar?</h3>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 border-b border-border-light dark:border-white/10 pb-1">
                  {/* Tab: Credit Card */}
                  <button 
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`group flex flex-1 flex-col items-center justify-center gap-2 border-b-[3px] pb-3 pt-2 transition-all ${paymentMethod === 'credit_card' ? 'border-primary text-text-dark dark:text-white' : 'border-transparent text-text-medium dark:text-gray-400'}`}
                  >
                    <span className={`material-symbols-outlined text-[28px] ${paymentMethod === 'credit_card' ? 'fill text-primary' : ''}`}>credit_card</span>
                    <span className="text-sm font-bold tracking-wide">Cartão de Crédito</span>
                  </button>
                  {/* Tab: PIX */}
                  <button 
                    onClick={() => setPaymentMethod('pix')}
                    className={`group flex flex-1 flex-col items-center justify-center gap-2 border-b-[3px] pb-3 pt-2 transition-all ${paymentMethod === 'pix' ? 'border-primary text-text-dark dark:text-white' : 'border-transparent text-text-medium dark:text-gray-400'}`}
                  >
                    <span className={`material-symbols-outlined text-[28px] ${paymentMethod === 'pix' ? 'fill text-primary' : ''}`}>qr_code_2</span>
                    <span className="text-sm font-medium tracking-wide">PIX</span>
                  </button>
                  {/* Tab: Boleto */}
                  <button 
                    onClick={() => setPaymentMethod('boleto')}
                    className={`group flex flex-1 flex-col items-center justify-center gap-2 border-b-[3px] pb-3 pt-2 transition-all ${paymentMethod === 'boleto' ? 'border-primary text-text-dark dark:text-white' : 'border-transparent text-text-medium dark:text-gray-400'}`}
                  >
                    <span className={`material-symbols-outlined text-[28px] ${paymentMethod === 'boleto' ? 'fill text-primary' : ''}`}>receipt_long</span>
                    <span className="text-sm font-medium tracking-wide">Boleto</span>
                  </button>
                </div>

                {/* Forms content wrapper to ensure internal spacing */}
                <div className="min-h-[400px]">
                  {/* Card Form */}
                  {paymentMethod === 'credit_card' && (
                    <div className="mt-8 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-text-dark dark:text-gray-200">Nome impresso no cartão</label>
                        <input className="h-12 w-full rounded-lg border border-border-light bg-background-light dark:bg-background-dark px-4 text-base text-text-dark placeholder-text-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-white/10 dark:text-white" placeholder="Ex: João da Silva" type="text" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-text-dark dark:text-gray-200">Número do cartão</label>
                        <div className="relative flex items-center">
                          <input className="h-12 w-full rounded-lg border border-border-light bg-background-light dark:bg-background-dark pl-4 pr-12 text-base text-text-dark placeholder-text-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-white/10 dark:text-white" placeholder="0000 0000 0000 0000" type="text" />
                          <div className="absolute right-3 flex items-center text-text-medium">
                            <span className="material-symbols-outlined">credit_card</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-2">
                          <label className="text-sm font-medium text-text-dark dark:text-gray-200">Validade</label>
                          <input className="h-12 w-full rounded-lg border border-border-light bg-background-light dark:bg-background-dark px-4 text-base text-text-dark placeholder-text-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-white/10 dark:text-white" placeholder="MM/AA" type="text" />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-text-dark dark:text-gray-200">
                            CVV
                            <span className="material-symbols-outlined text-xs text-text-medium cursor-help" title="Código de segurança de 3 dígitos no verso">help</span>
                          </label>
                          <input className="h-12 w-full rounded-lg border border-border-light bg-background-light dark:bg-background-dark px-4 text-base text-text-dark placeholder-text-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-white/10 dark:text-white" placeholder="123" type="text" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <input className="h-5 w-5 rounded border-border-light text-primary focus:ring-primary bg-background-light dark:bg-background-dark dark:border-white/20" id="save-card" type="checkbox" />
                        <label className="text-sm text-text-dark dark:text-gray-300 cursor-pointer" htmlFor="save-card">Salvar cartão para compras futuras</label>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'pix' && (
                    <div className="mt-8 flex flex-col items-center gap-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-white p-4 rounded-xl border border-border-light shadow-sm">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=StarFitPaymentPix" alt="QR Code Pix" className="w-48 h-48" />
                      </div>
                      <p className="text-sm text-text-medium text-center max-w-sm">Escaneie o código acima com o app do seu banco para pagar via PIX de forma instantânea.</p>
                    </div>
                  )}

                  {paymentMethod === 'boleto' && (
                    <div className="mt-8 flex flex-col items-center gap-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-primary/10 p-6 rounded-full text-primary">
                        <span className="material-symbols-outlined text-5xl">description</span>
                      </div>
                      <p className="text-sm text-text-medium text-center max-w-sm">O boleto será gerado e enviado para seu e-mail. A compensação pode levar até 3 dias úteis.</p>
                      <button className="px-6 py-2 border border-primary text-primary font-bold rounded-lg hover:bg-primary/10 transition-colors">Gerar Boleto agora</button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Security Info (Mobile Visible) */}
              <div className="flex items-center justify-center gap-4 text-text-medium lg:hidden">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span className="text-xs font-medium">Pagamento Seguro</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span className="text-xs font-medium">Dados Criptografados</span>
                </div>
              </div>
            </div>

            {/* Right Column: Summary Sticky */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 flex flex-col gap-6 rounded-xl border border-border-light bg-white p-6 shadow-lg dark:bg-white/5 dark:border-white/10">
                <h3 className="text-lg font-bold text-text-dark dark:text-white">Resumo do Pedido</h3>
                {/* Plan Item */}
                <div className="flex gap-4 border-b border-border-light pb-6 dark:border-white/10">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined fill text-3xl">star</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="font-bold text-text-dark dark:text-white">Plano Anual Gold</p>
                    <p className="text-sm text-text-medium dark:text-gray-400">Acesso ilimitado + Aulas</p>
                  </div>
                </div>
                {/* Pricing Breakdown */}
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between text-text-medium dark:text-gray-400">
                    <span>Valor do plano (mensal)</span>
                    <span>R$ 119,90</span>
                  </div>
                  <div className="flex justify-between text-primary font-medium">
                    <span>Desconto (Plano Anual)</span>
                    <span>- R$ 20,00</span>
                  </div>
                  <div className="my-2 h-px w-full bg-border-light dark:bg-white/10"></div>
                  <div className="flex items-end justify-between">
                    <span className="pb-1 text-base font-medium text-text-dark dark:text-white">Total a pagar</span>
                    <div className="text-right">
                      <span className="block text-2xl font-bold text-text-dark dark:text-white">R$ 99,90</span>
                      <span className="text-xs text-text-medium">por mês</span>
                    </div>
                  </div>
                </div>
                {/* CTA Button */}
                <button 
                  onClick={handleFinalizePayment}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-base font-bold text-background-dark shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined fill">lock</span>
                  Finalizar Pagamento
                </button>
                {/* Trust Seals */}
                <div className="mt-2 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-text-medium dark:text-gray-500">
                    <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
                    <span>Ambiente 100% seguro via SSL</span>
                  </div>
                  <div className="flex w-full justify-center gap-4 opacity-60 grayscale transition-all hover:grayscale-0">
                    <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-6 w-auto" />
                    <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" className="h-6 w-auto" />
                    <img src="https://img.icons8.com/color/48/amex.png" alt="Amex" className="h-6 w-auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
