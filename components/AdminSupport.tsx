import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, serverTimestamp, orderBy, arrayUnion } from 'firebase/firestore';
import AdminAnnouncements from './AdminAnnouncements';

const AdminSupport: React.FC = () => {
  const [supportTab, setSupportTab] = useState<'tickets' | 'announcements'>('tickets');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [replyText, setReplyText] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  useEffect(() => {
    const qTickets = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(qTickets, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(docs);
      setLoading(false);
    }, (error) => {
      console.error("AdminSupport snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const pendingCount = tickets.filter(t => t.status === 'pendente').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolvido').length;

  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === 'all') return true;
    return t.status === ticketFilter;
  });

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        replies: arrayUnion({
          text: replyText,
          createdAt: new Date().toISOString(),
          sender: 'admin'
        }),
        updatedAt: serverTimestamp()
      });
      setReplyText('');
      alert('Resposta enviada com sucesso!');
    } catch (e) {
      console.error('Erro ao enviar resposta:', e);
      alert('Erro ao enviar resposta. Tente novamente.');
    }
  };

  const handleResolve = async (ticketId: string) => {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        status: 'resolvido',
        updatedAt: serverTimestamp()
      });
      setActiveTicketId(null);
      alert('Chamado marcado como resolvido!');
    } catch (e) {
      console.error('Erro ao resolver chamado:', e);
      alert('Erro ao marcar como resolvido.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Central de Suporte & Comunicação</h1>
          <p className="text-text-secondary">Gerencie chamados de trainers e alunos, e envie comunicados globais.</p>
        </div>

        <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark self-start sm:self-center shrink-0">
          <button 
            onClick={() => setSupportTab('tickets')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${supportTab === 'tickets' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-lg">confirmation_number</span>
            Chamados
          </button>
          <button 
            onClick={() => setSupportTab('announcements')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${supportTab === 'announcements' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-lg">campaign</span>
            Comunicados
          </button>
        </div>
      </header>

      {supportTab === 'tickets' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
              <p className="text-sm text-text-secondary mb-1">Chamados Totais</p>
              <p className="text-4xl font-bold text-white">{tickets.length}</p>
            </div>
            <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
              <p className="text-sm text-text-secondary mb-1">Aguardando Resposta</p>
              <p className="text-4xl font-bold text-yellow-400">{pendingCount}</p>
            </div>
            <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
              <p className="text-sm text-text-secondary mb-1">Resolvidos</p>
              <p className="text-4xl font-bold text-green-400">{resolvedCount}</p>
            </div>
          </div>

          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border-dark flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-bold text-white">Chamados Recentes</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTicketFilter('pending')}
                  className={`text-sm px-3 py-1 rounded transition-colors ${ticketFilter === 'pending' ? 'bg-white/10 text-white' : 'bg-transparent text-text-secondary hover:bg-white/5'}`}
                >
                  Pendentes
                </button>
                <button 
                  onClick={() => setTicketFilter('resolved')}
                  className={`text-sm px-3 py-1 rounded transition-colors ${ticketFilter === 'resolved' ? 'bg-white/10 text-white' : 'bg-transparent text-text-secondary hover:bg-white/5'}`}
                >
                  Resolvidos
                </button>
                <button 
                  onClick={() => setTicketFilter('all')}
                  className={`text-sm px-3 py-1 rounded transition-colors ${ticketFilter === 'all' ? 'bg-white/10 text-white' : 'bg-transparent text-text-secondary hover:bg-white/5'}`}
                >
                  Todos
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6 text-center text-text-secondary">Carregando chamados...</div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-6 text-center text-text-secondary">Nenhum chamado encontrado.</div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest text-center">
                    <tr>
                      <th className="px-6 py-4 font-bold text-left">Data</th>
                      <th className="px-6 py-4 font-bold text-left">Usuário</th>
                      <th className="px-6 py-4 font-bold text-left">Assunto / Msg</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark">
                    {filteredTickets.map((ticket) => (
                      <React.Fragment key={ticket.id}>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-white font-mono text-sm whitespace-nowrap">
                            {ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-white">
                            <div>{ticket.userName}</div>
                            <div className="text-xs text-text-secondary">{ticket.userEmail}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white mb-1">{ticket.topic}</div>
                            <div className="text-sm text-text-secondary max-w-sm truncate">{ticket.message}</div>
                          </td>
                          <td className={`px-6 py-4 font-bold text-center ${ticket.status === 'resolvido' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {ticket.status === 'resolvido' ? 'Resolvido' : 'Pendente'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => {
                                if (activeTicketId === ticket.id) {
                                  setActiveTicketId(null);
                                } else {
                                  setActiveTicketId(ticket.id);
                                  setReplyText('');
                                }
                              }}
                              className="bg-primary/20 text-primary px-3 py-1 rounded text-[10px] font-bold hover:bg-primary/30 uppercase tracking-widest"
                            >
                              {ticket.status === 'resolvido' ? 'Ver Detalhes' : 'Responder'}
                            </button>
                          </td>
                        </tr>
                        {activeTicketId === ticket.id && (
                          <tr className="bg-background-dark/50">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="p-4 bg-card-dark rounded-xl border border-border-dark">
                                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                  {/* User Message */}
                                  <div className="bg-background-dark p-3 rounded-lg border border-border-dark">
                                    <p className="text-[10px] font-black text-primary uppercase mb-1">Mensagem Inicial (Usuário)</p>
                                    <p className="text-sm text-text-secondary">{ticket.message}</p>
                                  </div>

                                  {/* Previous Replies (Array) */}
                                  {Array.isArray(ticket.replies) && ticket.replies.map((r: any, idx: number) => (
                                    <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5 ml-4">
                                      <p className="text-[10px] font-black text-green-400 uppercase mb-1">Admin</p>
                                      <p className="text-sm text-text-secondary">{r.text}</p>
                                    </div>
                                  ))}

                                  {/* Legacy Support (if any) */}
                                  {ticket.adminReply && (!ticket.replies || ticket.replies.length === 0) && (
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 ml-4">
                                      <p className="text-[10px] font-black text-green-400 uppercase mb-1">Admin (Anterior)</p>
                                      <p className="text-sm text-text-secondary">{ticket.adminReply}</p>
                                    </div>
                                  )}
                                </div>

                                <p className="text-sm text-white font-bold mb-2">Sua Nova Resposta (Admin):</p>
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Escreva a resposta aqui..."
                                  rows={3}
                                  className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-white text-sm focus:border-primary outline-none resize-none mb-3"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setActiveTicketId(null)} className="px-4 py-2 font-bold text-text-secondary hover:text-white transition-colors text-sm">
                                    Fechar
                                  </button>
                                  <button 
                                    onClick={() => handleReply(ticket.id)} 
                                    disabled={!replyText.trim()} 
                                    className="bg-primary/20 text-primary font-bold px-6 py-2 rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50 text-sm"
                                  >
                                    Enviar Resposta
                                  </button>
                                  {ticket.status !== 'resolvido' && (
                                    <button 
                                      onClick={() => handleResolve(ticket.id)} 
                                      className="bg-green-500 text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition-transform text-sm flex items-center gap-2"
                                    >
                                      <span className="material-symbols-outlined text-lg">check_circle</span>
                                      Marcar como Resolvido
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        <AdminAnnouncements />
      )}
    </div>
  );
};

export default AdminSupport;
