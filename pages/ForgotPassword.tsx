
import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-dark font-display overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center items-center p-4 sm:p-6 lg:p-8">
          <div className="layout-content-container flex flex-col max-w-[480px] flex-1">
            
            {/* Logo Section */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-background-dark !text-3xl">fitness_center</span>
                </div>
                <p className="text-3xl font-bold text-white tracking-tighter">StarFit</p>
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-card-dark rounded-xl shadow-2xl p-6 sm:p-8 border border-border-dark">
              <h1 className="text-white tracking-tight text-2xl sm:text-3xl font-bold leading-tight text-center pb-2">
                Esqueceu sua senha?
              </h1>
              <p className="text-text-secondary text-sm sm:text-base font-normal leading-normal pb-6 text-center">
                Insira seu e-mail abaixo e enviaremos um link para redefinir sua senha. Verifique sua caixa de entrada e spam.
              </p>
              
              <div className="flex w-full flex-col gap-4">
                <label className="flex flex-col w-full">
                  <p className="text-white text-base font-medium leading-normal pb-2">E-mail</p>
                  <div className="flex w-full flex-1 items-stretch">
                    <input 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-[#1c271f] focus:border-primary h-14 placeholder:text-text-secondary/50 p-[15px] rounded-r-none border-r-0 text-base font-normal leading-normal transition-all" 
                      placeholder="seuemail@exemplo.com" 
                      type="email" 
                    />
                    <div className="text-text-secondary flex border border-border-dark bg-[#1c271f] items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                  </div>
                </label>
                
                <button className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-background-dark text-base font-bold leading-normal tracking-[0.015em] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-dark focus:ring-primary/70 transition-all shadow-lg shadow-primary/20">
                  <span className="truncate">Enviar Link de Redefinição</span>
                </button>
              </div>
            </div>

            {/* Footer Link */}
            <div className="flex px-4 py-6 justify-center">
              <Link 
                className="text-text-secondary hover:text-primary text-sm font-medium transition-colors flex items-center gap-1" 
                to="/login"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Lembrou a senha? Voltar para o Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
