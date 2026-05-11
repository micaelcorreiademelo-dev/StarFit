
import React, { useState, useEffect, useRef } from 'react';
import { User, Chat, ChatMessage } from '../types';
import { chatService } from '../services/chatService';
import { dataService } from '../services/dataService';

interface TrainerChatProps {
  user: User;
}

const TrainerChat: React.FC<TrainerChatProps> = ({ user }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Subscribe to trainer's students
  useEffect(() => {
    if (!user.id) return;
    const unsubStudents = dataService.subscribeToStudents(user.id, (fetchedStudents) => {
      setStudents(fetchedStudents);
      setLoading(false);
      // Auto-select first student if none selected
      if (fetchedStudents.length > 0 && !selectedStudentId) {
        setSelectedStudentId(fetchedStudents[0].id);
      }
    });
    return () => unsubStudents();
  }, [user.id, selectedStudentId]);

  // Get or create chatId for selected student
  useEffect(() => {
    if (selectedStudentId && user.id) {
      chatService.getOrCreateChat(user.id, selectedStudentId).then(id => {
        setActiveChatId(id);
      });
    }
  }, [selectedStudentId, user.id]);

  // Subscribe to messages of active chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const unsubMessages = chatService.subscribeToMessages(activeChatId, setMessages);
    return () => unsubMessages();
  }, [activeChatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const activeStudent = students.find(s => s.id === selectedStudentId);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeChatId || !selectedStudentId) return;

    const receiverId = selectedStudentId;
    const text = inputValue;
    setInputValue('');

    await chatService.sendMessage(activeChatId, user.id, receiverId, text);
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex h-[calc(100vh-32px)] w-full rounded-2xl overflow-hidden border border-border-dark bg-background-dark shadow-2xl">
      {/* Conversation List Panel */}
      <aside className="flex flex-col w-full sm:w-80 lg:w-96 bg-card-dark border-r border-border-dark shrink-0">
        <div className="p-4 border-b border-border-dark">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Alunos</h2>
        </div>
        <div className="flex-grow overflow-y-auto">
          {students.map((student) => (
            <div 
              key={student.id}
              onClick={() => setSelectedStudentId(student.id)}
              className={`flex gap-4 px-4 py-3 justify-between cursor-pointer transition-colors ${selectedStudentId === student.id ? 'bg-primary/20' : 'bg-transparent hover:bg-white/5'}`}
            >
              <div className="flex items-start gap-4 flex-1 overflow-hidden">
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-[56px] w-[56px] relative shrink-0" 
                  style={{ backgroundImage: `url("${student.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'}")` }}
                >
                  {student.status === 'Ativa' ? (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-primary ring-2 ring-card-dark"></span>
                  ) : (
                    <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-card-dark ${
                      student.trialUntil && new Date() > (student.trialUntil?.toDate ? student.trialUntil.toDate() : new Date(student.trialUntil))
                      ? 'bg-red-500' : 'bg-amber-500'
                    }`}></span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center overflow-hidden">
                  <p className="text-text-primary text-base font-black uppercase tracking-tight truncate leading-tight mb-0.5">{student.name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      student.status === 'Ativa' ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {student.status || 'Pendente'}
                    </span>
                    {student.trialUntil && student.status !== 'Ativa' && (
                       <span className="text-[9px] text-text-secondary truncate italic uppercase font-bold tracking-tighter">
                         Trial: {new Date(student.trialUntil?.toDate ? student.trialUntil.toDate() : student.trialUntil).toLocaleDateString()}
                       </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {students.length === 0 && !loading && (
            <div className="p-8 text-center text-text-secondary text-sm">
              Nenhum aluno vinculado.
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1 bg-background-dark">
        {activeStudent ? (
          <>
            {/* Chat Header */}
            <header className="flex items-center p-4 border-b border-border-dark bg-card-dark shrink-0">
              <div className="flex items-center gap-4">
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 border border-border-dark" 
                  style={{ backgroundImage: `url("${activeStudent.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'}")` }}
                ></div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{activeStudent.name}</h3>
                  <p className="text-xs text-text-secondary">{activeStudent.plan || 'Aluno StarFit'}</p>
                </div>
              </div>
            </header>

            {/* Message History */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex items-end gap-3 ${msg.senderId === user.id ? 'justify-end' : 'max-w-xl'}`}
                  >
                    {msg.senderId !== user.id && (
                      <div 
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-8 w-8 shrink-0 border border-border-dark" 
                        style={{ backgroundImage: `url("${activeStudent.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'}")` }}
                      ></div>
                    )}
                    <div className={`rounded-2xl p-3 shadow-sm relative ${
                      msg.senderId === user.id 
                        ? 'bg-primary text-background-dark rounded-br-none' 
                        : 'bg-card-dark text-text-primary rounded-bl-none border border-border-dark'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 ${msg.senderId === user.id ? 'justify-end' : 'justify-end'}`}>
                        <p className={`text-[10px] ${msg.senderId === user.id ? 'text-background-dark/70' : 'text-text-secondary'}`}>
                          {formatTimestamp(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-text-secondary text-sm italic">
                  Nenhuma mensagem ainda. Inicie a conversa com {activeStudent.name}!
                </div>
              )}
            </div>

            {/* Message Composer */}
            <footer className="p-4 bg-card-dark border-t border-border-dark">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <input 
                    className="w-full px-5 py-3 bg-background-dark border border-border-dark rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-text-primary placeholder:text-text-secondary transition-all" 
                    placeholder="Digite sua mensagem..." 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                </div>
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="bg-primary text-background-dark rounded-full h-12 w-12 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined fill">send</span>
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-secondary">
            <span className="material-symbols-outlined text-6xl">chat_bubble</span>
            <p>Selecione uma conversa para começar</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TrainerChat;
