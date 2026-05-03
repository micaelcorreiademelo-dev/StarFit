import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { User } from '../types';
import TrainerDashboard from './TrainerDashboard';
import StudentDashboard from './StudentDashboard';

interface Props {
  adminUser: User;
}

const ImpersonateWrapper: React.FC<Props> = ({ adminUser }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        const u = await dataService.getUserById(userId);
        if (u) {
          setTargetUser(u as User);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [userId]);

  const handleExit = () => {
    navigate('/?tab=users');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center gap-4">
        <h2 className="text-white text-xl">Usuário não encontrado</h2>
        <button onClick={handleExit} className="text-primary hover:underline">Voltar para Admin</button>
      </div>
    );
  }

  return (
    <div className="relative pt-12">
      <div className="fixed top-0 left-0 w-full h-12 bg-red-600/90 backdrop-blur-md z-[100] flex items-center justify-between px-4 sm:px-6 shadow-xl border-b border-red-500">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-white animate-pulse">admin_panel_settings</span>
          <span className="text-white font-bold text-sm sm:text-base">
            Modo Admin Master: Acessando como <span className="underline decoration-red-300 underline-offset-2">{targetUser.name}</span>
          </span>
        </div>
        <button 
          onClick={handleExit}
          className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-1.5 rounded-lg font-bold transition-colors text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span className="hidden sm:inline">Retornar ao Painel Admin</span>
          <span className="sm:hidden">Sair</span>
        </button>
      </div>

      {targetUser.role === 'TRAINER' ? (
        <TrainerDashboard user={targetUser} onLogout={handleExit} />
      ) : (
        <StudentDashboard user={targetUser} onLogout={handleExit} />
      )}
    </div>
  );
};

export default ImpersonateWrapper;
