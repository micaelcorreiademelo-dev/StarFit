
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleProfileClick = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      onLogin(selectedRole);
    }
  };

  const roleLabels = {
    STUDENT: 'Aluno',
    TRAINER: 'Personal',
    ADMIN: 'Administrador'
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-background-dark flex flex-col">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-4xl fill">fitness_center</span>
              <span className="text-4xl font-bold tracking-tighter text-white">StarFit</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Bem-vindo de volta!</h1>
            <p className="text-text-secondary mt-2">
              {selectedRole ? `Entrando como ${roleLabels[selectedRole]}` : 'Escolha seu perfil para entrar'}
            </p>
          </div>

          <div className="bg-card-dark p-8 rounded-2xl border border-border-dark shadow-2xl space-y-6">
            <div className={`grid grid-cols-1 gap-4 ${selectedRole ? 'opacity-50 pointer-events-none scale-95' : ''} transition-all duration-300`}>
              <button 
                onClick={() => handleProfileClick('STUDENT')}
                className={`flex items-center gap-4 p-4 rounded-xl border border-border-dark hover:border-primary/50 bg-background-dark/50 transition-all text-left group ${selectedRole === 'STUDENT' ? 'border-primary' : ''}`}
              >
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background-dark transition-colors shrink-0">
                  <span className="material-symbols-outlined text-3xl">sports_gymnastics</span>
                </div>
                <div>
                  <p className="font-bold text-white">Sou Aluno</p>
                  <p className="text-xs text-text-secondary">Quero treinar e evoluir</p>
                </div>
              </button>

              <button 
                onClick={() => handleProfileClick('TRAINER')}
                className={`flex items-center gap-4 p-4 rounded-xl border border-border-dark hover:border-primary/50 bg-background-dark/50 transition-all text-left group ${selectedRole === 'TRAINER' ? 'border-primary' : ''}`}
              >
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background-dark transition-colors shrink-0">
                  <span className="material-symbols-outlined text-3xl">assignment_ind</span>
                </div>
                <div>
                  <p className="font-bold text-white">Sou Personal</p>
                  <p className="text-xs text-text-secondary">Gerenciar meus alunos e treinos</p>
                </div>
              </button>

              <button 
                onClick={() => handleProfileClick('ADMIN')}
                className={`flex items-center gap-4 p-4 rounded-xl border border-border-dark hover:border-primary/50 bg-background-dark/50 transition-all text-left group ${selectedRole === 'ADMIN' ? 'border-primary' : ''}`}
              >
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background-dark transition-colors shrink-0">
                  <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                </div>
                <div>
                  <p className="font-bold text-white">Sou Administrador</p>
                  <p className="text-xs text-text-secondary">Gestão global do ecossistema</p>
                </div>
              </button>
            </div>

            {selectedRole && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="relative flex items-center justify-center mb-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-dark"></div></div>
                  <span className="relative px-3 bg-card-dark text-xs text-text-secondary uppercase">Informe suas credenciais</span>
                </div>

                <form className="space-y-2" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">E-mail</label>
                    <input 
                      type="email" 
                      required
                      className="w-full bg-background-dark border-border-dark rounded-lg focus:ring-primary focus:border-primary text-white"
                      placeholder="seu@email.com"
                    />
                  </div>
                  
                  <div className="text-right">
                    <Link to="/forgot-password" title="Esqueceu sua senha?" className="text-xs font-medium text-primary hover:underline">
                      Esqueceu sua senha?
                    </Link>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Senha</label>
                    <input 
                      type="password" 
                      required
                      className="w-full bg-background-dark border-border-dark rounded-lg focus:ring-primary focus:border-primary text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="pt-4 flex flex-col gap-3">
                    <button className="w-full bg-primary text-background-dark font-bold py-3 rounded-lg hover:opacity-90 transition-all">
                      Entrar
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedRole(null)}
                      className="text-text-secondary text-sm hover:text-white transition-colors"
                    >
                      Trocar perfil
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-text-secondary mt-6">
            Não tem uma conta? <Link to="/register" className="text-primary font-bold hover:underline">Registre-se aqui</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
