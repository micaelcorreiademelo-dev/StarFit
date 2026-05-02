import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { User } from '../types';

interface UserSupportProps {
  user: User;
}

const UserSupport: React.FC<UserSupportProps> = ({ user }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'supportTickets'), 
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !message) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'supportTickets'), {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        topic,
        message,
        status: 'pendente',
        createdAt: serverTimestamp()
      });
      setTopic('');
      setMessage('');
      alert('Chamado aberto com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao abrir chamado.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 p-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">support_agent</span>
          Central de Ajuda
        </h1>
        <p className="text-text-secondary mt-1">Precisa de ajuda? Abra um chamado que retornaremos o mais breve possível.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulario de Novo Chamado */}
        <div className="bg-card-dark rounded-2xl p-6 border border-border-dark">
          <h2 className="text-lg font-bold text-white mb-4">Novo Chamado</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Assunto</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                placeholder="Ex: Problema com pagamento"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1 block">Mensagem</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:border-primary outline-none resize-none"
                placeholder="Descreva seu problema com detalhes..."
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-background-dark font-bold py-3 rounded-xl hover:scale-105 transition-transform flex justify-center items-center gap-2"
            >
              {loading ? 'Enviando...' : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  Enviar Chamado
                </>
              )}
            </button>
          </form>
        </div>

        {/* Meus Chamados */}
        <div className="bg-card-dark rounded-2xl p-6 border border-border-dark flex flex-col h-[500px]">
          <h2 className="text-lg font-bold text-white mb-4">Meus Chamados</h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {tickets.length === 0 ? (
              <p className="text-center text-text-secondary mt-10">Você não tem chamados abertos.</p>
            ) : (
              tickets.map(ticket => (
                <div key={ticket.id} className="bg-background-dark border border-border-dark rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTicket(activeTicket?.id === ticket.id ? null : ticket)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white">{ticket.topic}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${ticket.status === 'resolvido' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary w-full truncate mb-2">{ticket.message}</p>
                  <p className="text-[10px] text-text-secondary">
                    {ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : ''}
                  </p>

                  {/* Expandido */}
                  {activeTicket?.id === ticket.id && (
                    <div className="mt-4 pt-4 border-t border-border-dark">
                      <p className="text-sm text-text-secondary mb-4">{ticket.message}</p>
                      
                      {ticket.adminReply && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                          <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Resposta do Suporte:</p>
                          <p className="text-sm text-white">{ticket.adminReply}</p>
                        </div>
                      )}
                      {ticket.status === 'resolvido' && !ticket.adminReply && (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                          <p className="text-sm text-white">Este chamado foi marcado como resolvido pelo suporte.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSupport;
