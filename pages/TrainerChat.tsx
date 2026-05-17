
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Chat, ChatMessage } from '../types';
import { chatService } from '../services/chatService';
import { dataService } from '../services/dataService';

interface TrainerChatProps {
  user: User;
}

export type ChatFilter = 'all' | 'online' | 'offline' | 'unanswered' | 'favorites';

const TrainerChat: React.FC<TrainerChatProps> = ({ user }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [chatInfo, setChatInfo] = useState<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChatFilter>('all');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Mark online presence
  useEffect(() => {
    if (user?.id) {
       chatService.updatePresence(user.id, true);
       const handleBeforeUnload = () => chatService.updatePresence(user.id, false);
       window.addEventListener('beforeunload', handleBeforeUnload);
       return () => {
         chatService.updatePresence(user.id, false);
         window.removeEventListener('beforeunload', handleBeforeUnload);
       };
    }
  }, [user.id]);

  // Subscribe to trainer's students
  useEffect(() => {
    if (!user.id) return;
    const unsubStudents = dataService.subscribeToStudents(user.id, (fetchedStudents) => {
      setStudents(fetchedStudents);
      setLoading(false);
      // Auto-select first student if none selected and on desktop
      if (fetchedStudents.length > 0 && !selectedStudentId) {
        if (window.innerWidth >= 768) {
          setSelectedStudentId(fetchedStudents[0].id);
        }
      }
    });
    return () => unsubStudents();
  }, [user.id]);

  // Subscribe to trainer's chats to power list
  useEffect(() => {
    if (!user.id) return;
    const unsubChats = chatService.subscribeToTrainerChats(user.id, (fetchedChats) => {
      setChats(fetchedChats);
    });
    return () => unsubChats();
  }, [user.id]);

  // Get or create chatId for selected student
  useEffect(() => {
    if (selectedStudentId && user.id) {
      chatService.getOrCreateChat(user.id, selectedStudentId).then(id => {
        setActiveChatId(id);
      });
    }
  }, [selectedStudentId, user.id]);

  // Subscribe to messages of active chat & mark read
  useEffect(() => {
    if (!activeChatId || !user.id) {
      setMessages([]);
      setChatInfo(null);
      return;
    }
    
    // Sub info (typing, read details)
    const unsubInfo = chatService.subscribeToChatInfo(activeChatId, setChatInfo);

    const unsubMessages = chatService.subscribeToMessages(activeChatId, (msgs) => {
      setMessages(msgs);
      // Mark as read immediately on receiving messages if this chat is active
      chatService.markAsRead(activeChatId, user.id);
    });
    return () => {
       unsubMessages();
       unsubInfo();
    };
  }, [activeChatId, user.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatInfo?.typingState]);

  const activeStudent = students.find(s => s.id === selectedStudentId);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeChatId || !selectedStudentId) return;

    const receiverId = selectedStudentId;
    const text = inputValue;
    setInputValue('');
    
    // Clear typing if we send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      chatService.setTypingStatus(activeChatId, user.id, false);
    }

    await chatService.sendMessage(activeChatId, user.id, receiverId, text);
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
       handleSendMessage();
       return;
    }
    
    // Handle typing status
    if (activeChatId && user.id) {
      chatService.setTypingStatus(activeChatId, user.id, true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        chatService.setTypingStatus(activeChatId, user.id, false);
      }, 2000);
    }
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

  // Combine student details with their related chat info
  const combinedStudentsList = useMemo(() => {
     return students.map(student => {
       const chat = chats.find(c => c.studentId === student.id);
       const isOnline = student.isOnline || false;
       const unreadCount = chat?.unreadCount?.[user.id] || 0;
       const isUnanswered = chat?.lastMessageSenderId === student.id && unreadCount > 0;
       return { ...student, chat, isOnline, unreadCount, isUnanswered };
     });
  }, [students, chats, user.id]);

  const filteredList = useMemo(() => {
     let list = combinedStudentsList;
     switch (filter) {
       case 'online': list = list.filter(s => s.isOnline); break;
       case 'offline': list = list.filter(s => !s.isOnline); break;
       case 'unanswered': list = list.filter(s => s.isUnanswered); break;
       case 'favorites': list = list.filter(s => s.chat?.isFavorite); break;
     }
     return list.sort((a, b) => {
       const timeA = a.chat?.lastMessageTime?.toMillis?.() || 0;
       const timeB = b.chat?.lastMessageTime?.toMillis?.() || 0;
       return timeB - timeA;
     });
  }, [combinedStudentsList, filter]);

  return (
    <div className="flex h-full min-h-[500px] w-full rounded-2xl overflow-hidden border border-border-dark bg-background-dark shadow-2xl flex-col md:flex-row absolute inset-0 md:relative">
      {/* Conversation List Panel */}
      <aside className={`flex flex-col w-full md:w-80 lg:w-96 bg-card-dark border-r border-border-dark shrink-0 h-full ${activeStudent ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border-dark space-y-4">
          <h2 className="text-2xl font-bold text-text-primary">Alunos</h2>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'online', label: 'Online' },
              { id: 'unanswered', label: 'Não respondidos' },
              { id: 'favorites', label: 'Favoritos' }
            ].map(f => (
               <button
                 key={f.id}
                 onClick={() => setFilter(f.id as ChatFilter)}
                 className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                   filter === f.id ? 'bg-primary text-background-dark' : 'bg-white/5 text-text-secondary hover:text-text-primary'
                 }`}
               >
                 {f.label}
               </button>
            ))}
          </div>
        </div>
        <div className="flex-grow overflow-y-auto pb-20 md:pb-0">
          {filteredList.map((student) => (
            <div 
              key={student.id}
              onClick={() => setSelectedStudentId(student.id)}
              className={`flex gap-4 px-4 py-3 justify-between cursor-pointer border-b border-white/5 transition-colors ${selectedStudentId === student.id ? 'bg-primary/10' : 'bg-transparent hover:bg-white/5'}`}
            >
              <div className="flex flex-1 items-center gap-3 overflow-hidden">
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 relative shrink-0 border border-white/10" 
                  style={{ backgroundImage: `url("${student.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'}")` }}
                >
                  <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-card-dark ${student.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex justify-between items-center w-full">
                    <p className="text-text-primary text-sm font-bold truncate leading-tight">{student.name}</p>
                    {student.chat?.lastMessageTime && (
                       <span className="text-[10px] text-text-secondary shrink-0 whitespace-nowrap ml-2">
                         {formatTimestamp(student.chat.lastMessageTime)}
                       </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full mt-1">
                    <p className={`text-xs truncate max-w-[180px] ${student.unreadCount > 0 ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                       {student.chat?.typingState?.[student.id] ? (
                          <span className="text-primary italic animate-pulse">Digitando...</span>
                       ) : (
                          student.chat?.lastMessage || 'Nenhuma mensagem'
                       )}
                    </p>
                    {student.unreadCount > 0 && (
                      <span className="bg-primary text-[10px] text-background-dark font-black px-1.5 py-0.5 rounded-full ml-2">
                        {student.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredList.length === 0 && !loading && (
            <div className="p-8 text-center text-text-secondary text-sm">
              Nenhuma conversa encontrada.
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={`flex flex-col flex-1 bg-background-dark h-full relative ${!activeStudent ? 'hidden md:flex' : 'flex'}`}>
        {activeStudent ? (
          <>
            {/* Chat Header */}
            <header className="flex items-center p-4 border-b border-border-dark bg-card-dark shrink-0 z-10 w-full">
              <div className="flex items-center w-full">
                <button 
                  onClick={() => setSelectedStudentId(null)}
                  className="md:hidden flex items-center justify-center p-2 -ml-2 mr-2 rounded-full hover:bg-white/5 text-text-primary shrink-0"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 border border-border-dark shrink-0 mr-3" 
                  style={{ backgroundImage: `url("${activeStudent.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'}")` }}
                ></div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-base font-bold text-text-primary truncate">{activeStudent.name}</h3>
                  <p className={`text-xs truncate ${activeStudent.isOnline ? 'text-green-500' : 'text-text-secondary'}`}>
                    {activeStudent.isOnline ? 'Online agora' : 'Offline'}
                  </p>
                </div>
                <button 
                  onClick={() => chatService.toggleFavorite(activeChatId!, !chatInfo?.isFavorite)}
                  className={`p-2 rounded-full hover:bg-white/5 transition-colors shrink-0 ml-2 ${chatInfo?.isFavorite ? 'text-amber-400' : 'text-text-secondary'}`}
                >
                  <span className={`material-symbols-outlined ${chatInfo?.isFavorite ? 'fill' : ''}`}>star</span>
                </button>
              </div>
            </header>

            {/* Message History */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-[80px] md:pb-4 scroll-smooth">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col gap-1 w-full ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}
                  >
                    {msg.context?.type === 'exercise' && (
                       <div className="max-w-[85%] bg-card-light/5 rounded-t-xl rounded-bl-xl px-3 py-2 border border-border-dark/50 mb-1 opacity-80">
                         <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase">
                            <span className="material-symbols-outlined text-[14px]">fitness_center</span>
                            Dúvida sobre exercício
                         </div>
                         <p className="text-xs text-text-secondary font-medium tracking-tight mt-1">"{msg.context.name}"</p>
                       </div>
                    )}
                    <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%] w-auto">
                      {msg.senderId !== user.id && (
                        <div 
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-6 w-6 shrink-0 border border-border-dark mb-1" 
                          style={{ backgroundImage: `url("${activeStudent.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'}")` }}
                        ></div>
                      )}
                      <div className={`rounded-2xl p-3 shadow-sm break-words flex-1 ${
                        msg.senderId === user.id 
                          ? 'bg-primary text-background-dark rounded-br-none' 
                          : 'bg-card-dark text-text-primary rounded-bl-none border border-border-dark'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-1.5 ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                          <p className={`text-[9px] ${msg.senderId === user.id ? 'text-background-dark/70' : 'text-text-secondary/70'}`}>
                            {formatTimestamp(msg.timestamp)}
                          </p>
                          {msg.senderId === user.id && (
                             <span className="material-symbols-outlined text-[12px] opacity-70">
                               {msg.readAt ? 'done_all' : 'check'}
                             </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-text-secondary text-sm italic">
                  Nenhuma mensagem ainda. Inicie a conversa.
                </div>
              )}
              
              {chatInfo?.typingState?.[selectedStudentId] && (
                 <div className="flex items-end gap-2 max-w-[85%] w-auto animate-pulse pb-4">
                   <div 
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-6 w-6 shrink-0 border border-border-dark mb-1 opacity-50" 
                      style={{ backgroundImage: `url("${activeStudent.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'}")` }}
                   ></div>
                   <div className="bg-card-dark text-text-secondary rounded-2xl rounded-bl-none border border-border-dark p-3 text-xs italic opacity-70">
                     Digitando...
                   </div>
                 </div>
              )}
            </div>

            {/* Message Composer - Absolute bottom on mobile */}
            <footer className="absolute bottom-0 left-0 right-0 p-3 bg-card-dark border-t border-border-dark z-20 w-full h-fit shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)]">
              <div className="flex items-end gap-2 w-full max-w-full">
                <input 
                  className="flex-1 w-full px-5 py-3.5 bg-background-dark border border-border-dark rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-base md:text-sm text-text-primary placeholder:text-text-secondary transition-all shadow-inner" 
                  placeholder="Digite sua mensagem..." 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="bg-primary text-background-dark rounded-full h-[52px] w-[52px] flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined fill text-xl">send</span>
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-text-secondary w-full">
            <span className="material-symbols-outlined text-6xl opacity-30">forum</span>
            <p className="font-medium tracking-tight">Selecione uma conversa para começar</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TrainerChat;
