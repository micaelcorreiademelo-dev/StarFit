
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface RegisterProps {
  onRegister: (role: 'STUDENT' | 'TRAINER') => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [profileType, setProfileType] = useState<'STUDENT' | 'TRAINER'>('STUDENT');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(profileType);
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-background-dark flex flex-col">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tighter text-text-primary">Crie sua conta StarFit</h1>
            <p className="text-base text-text-secondary mt-2">Comece sua jornada fitness hoje mesmo.</p>
          </div>

          <div className="bg-card-dark p-8 rounded-xl border border-border-dark shadow-lg">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Step 1: Profile Selection */}
              <fieldset className="border border-border-dark rounded-xl p-6">
                <legend className="text-lg font-bold text-text-primary px-2">1. Escolha seu perfil</legend>
                <p className="text-sm text-text-secondary mb-5 -mt-2 px-2">Selecione como você usará o StarFit.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Student Option */}
                  <div>
                    <input 
                      className="sr-only peer" 
                      id="aluno" 
                      name="profile-type" 
                      type="radio" 
                      value="STUDENT"
                      checked={profileType === 'STUDENT'}
                      onChange={() => setProfileType('STUDENT')}
                    />
                    <label 
                      className="flex flex-col items-center text-center p-4 rounded-xl border border-border-dark cursor-pointer transition-all duration-200 hover:border-primary/50 h-full peer-checked:border-primary peer-checked:bg-primary/5" 
                      htmlFor="aluno"
                    >
                      <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-background-dark text-text-secondary transition-colors peer-checked:bg-primary peer-checked:text-background-dark">
                        <span className="material-symbols-outlined text-3xl">sports_gymnastics</span>
                      </div>
                      <span className="text-base font-bold text-text-primary">Sou Aluno</span>
                      <span className="text-xs text-text-secondary mt-1 leading-tight">Quero atingir meus objetivos e receber treinos personalizados.</span>
                    </label>
                  </div>

                  {/* Trainer Option */}
                  <div>
                    <input 
                      className="sr-only peer" 
                      id="personal" 
                      name="profile-type" 
                      type="radio" 
                      value="TRAINER"
                      checked={profileType === 'TRAINER'}
                      onChange={() => setProfileType('TRAINER')}
                    />
                    <label 
                      className="flex flex-col items-center text-center p-4 rounded-xl border border-border-dark cursor-pointer transition-all duration-200 hover:border-primary/50 h-full peer-checked:border-primary peer-checked:bg-primary/5" 
                      htmlFor="personal"
                    >
                      <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-background-dark text-text-secondary transition-colors peer-checked:bg-primary peer-checked:text-background-dark">
                        <span className="material-symbols-outlined text-3xl">assignment_ind</span>
                      </div>
                      <span className="text-base font-bold text-text-primary">Sou Personal</span>
                      <span className="text-xs text-text-secondary mt-1 leading-tight">Quero gerenciar meus alunos, treinos e avaliações.</span>
                    </label>
                  </div>
                </div>
              </fieldset>

              {/* Step 2: Account Information */}
              <fieldset className="space-y-4">
                <legend className="sr-only">2. Informações da Conta</legend>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block" htmlFor="full-name">Nome Completo</label>
                  <input 
                    className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg focus:ring-primary focus:border-primary placeholder:text-text-secondary/50 text-text-primary" 
                    id="full-name" 
                    placeholder="Seu nome completo" 
                    required 
                    type="text"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block" htmlFor="email">E-mail</label>
                  <input 
                    className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg focus:ring-primary focus:border-primary placeholder:text-text-secondary/50 text-text-primary" 
                    id="email" 
                    placeholder="seuemail@exemplo.com" 
                    required 
                    type="email"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block" htmlFor="password">Senha</label>
                    <input 
                      className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg focus:ring-primary focus:border-primary placeholder:text-text-secondary/50 text-text-primary" 
                      id="password" 
                      placeholder="Mínimo 8 caracteres" 
                      required 
                      type="password"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block" htmlFor="confirm-password">Confirmar Senha</label>
                    <input 
                      className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg focus:ring-primary focus:border-primary placeholder:text-text-secondary/50 text-text-primary" 
                      id="confirm-password" 
                      placeholder="Repita sua senha" 
                      required 
                      type="password"
                    />
                  </div>
                </div>

                {/* Conditional Personal Code Field */}
                {profileType === 'STUDENT' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-sm font-medium text-text-secondary mb-2 block" htmlFor="personal-code">Código do Personal</label>
                    <input 
                      className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg focus:ring-primary focus:border-primary placeholder:text-text-secondary/50 text-text-primary" 
                      id="personal-code" 
                      placeholder="Digite o código fornecido pelo seu personal" 
                      type="text"
                    />
                  </div>
                )}
              </fieldset>

              <div className="flex flex-col gap-4 mt-4">
                <button 
                  className="w-full bg-primary text-background-dark py-3 rounded-lg text-base font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2" 
                  type="submit"
                >
                  Criar minha conta
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                
                <button 
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full text-text-secondary text-sm font-medium hover:text-primary transition-colors text-center"
                >
                  Voltar ao painel anterior
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-sm text-text-secondary mt-6">
            Já tem uma conta? <Link to="/login" className="font-medium text-primary hover:underline">Faça login</Link>
          </p>
        </div>
      </div>

      {/* Injecting CSS for Peer states */}
      <style>{`
        .peer:checked + label div {
          background-color: #13ec5b !important;
          color: #102216 !important;
        }
      `}</style>
    </div>
  );
};

export default Register;
