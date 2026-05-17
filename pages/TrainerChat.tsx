
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
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 50);
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
    <div className="flex h-full w-full bg-background-dark overflow-hidden relative">
      {/* Conversation List Panel */}
      <aside className={`flex flex-col w-full md:w-[380px] bg-card-dark border-r border-border-dark shrink-0 h-full ${activeStudent ? 'hidden md:flex' : 'flex'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border-dark space-y-4 shrink-0 bg-card-dark z-10 w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white tracking-tight">Conversas</h2>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'online', label: 'Online' },
              { id: 'unanswered', label: 'Aguardando' },
              { id: 'favorites', label: 'Favoritos' }
            ].map(f => (
               <button
                 key={f.id}
                 onClick={() => setFilter(f.id as ChatFilter)}
                 className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                   filter === f.id ? 'bg-primary border-primary text-background-dark' : 'bg-transparent border-border-dark text-text-secondary hover:text-white hover:border-text-secondary'
                 }`}
               >
                 {f.label}
               </button>
            ))}
          </div>
        </div>

        {/* List of Chats */}
        <div className="flex-1 overflow-y-auto w-full">
          {filteredList.map((student) => (
            <div 
              key={student.id}
              onClick={() => setSelectedStudentId(student.id)}
              className={`flex gap-3 p-3 items-center cursor-pointer border-b border-border-dark/50 transition-colors ${selectedStudentId === student.id ? 'bg-white/5' : 'bg-transparent hover:bg-white/[0.02]'}`}
            >
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 shrink-0 border border-border-dark relative" 
                style={{ backgroundImage: `url("${student.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'}")` }}
              >
                <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-card-dark ${student.isOnline ? 'bg-green-500' : 'bg-text-secondary'}`}></span>
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex justify-between items-baseline w-full">
                  <p className="text-white text-sm font-bold truncate pr-2">{student.name}</p>
                  {student.chat?.lastMessageTime && (
                     <span className={`text-[10px] shrink-0 ${student.unreadCount > 0 ? 'text-primary font-bold' : 'text-text-secondary'}`}>
                       {formatTimestamp(student.chat.lastMessageTime)}
                     </span>
                  )}
                </div>
                <div className="flex items-center justify-between w-full mt-0.5">
                  <p className={`text-xs truncate max-w-[180px] ${student.unreadCount > 0 ? 'text-white font-semibold' : 'text-text-secondary'}`}>
                     {student.chat?.typingState?.[student.id] ? (
                        <span className="text-primary italic animate-pulse">Digitando...</span>
                     ) : (
                        student.chat?.lastMessage || 'Nenhuma mensagem'
                     )}
                  </p>
                  {student.unreadCount > 0 && (
                    <span className="bg-primary text-background-dark text-[10px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 ml-2 shadow-sm">
                      {student.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredList.length === 0 && !loading && (
            <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
              <span className="material-symbols-outlined text-4xl text-text-secondary opacity-50">speaker_notes_off</span>
              <p className="text-text-secondary text-sm">Nenhuma conversa encontrada.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={`flex flex-col flex-1 bg-[#121212] relative h-full w-full ${!activeStudent ? 'hidden md:flex' : 'flex'}`}>
        {activeStudent ? (
          <div className="flex flex-col h-full w-full absolute inset-0">
            {/* Chat Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-border-dark bg-card-dark shrink-0 w-full z-20 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <button 
                  onClick={() => setSelectedStudentId(null)}
                  className="md:hidden flex items-center justify-center size-10 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-colors shrink-0 -ml-2"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 border border-border-dark shrink-0 relative" 
                  style={{ backgroundImage: `url("${activeStudent.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'}")` }}
                ></div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-white text-base font-bold truncate leading-tight">{activeStudent.name}</h3>
                  <p className={`text-xs truncate mt-0.5 ${activeStudent.isOnline ? 'text-green-500 font-medium' : 'text-text-secondary'}`}>
                    {activeStudent.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => chatService.toggleFavorite(activeChatId!, !chatInfo?.isFavorite)}
                  className={`flex items-center justify-center size-10 rounded-full hover:bg-white/5 transition-colors ${chatInfo?.isFavorite ? 'text-amber-400' : 'text-text-secondary hover:text-white'}`}
                  title={chatInfo?.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <span className={`material-symbols-outlined text-[22px] ${chatInfo?.isFavorite ? 'fill' : ''}`}>star</span>
                </button>
                <button className="flex items-center justify-center size-10 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-colors" title="Ver perfil">
                  <span className="material-symbols-outlined text-[22px]">more_vert</span>
                </button>
              </div>
            </header>

            {/* Message History Container */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 w-full custom-scrollbar relative">
              <div className="flex flex-col gap-4 max-w-4xl mx-auto min-h-full pb-4">
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col w-full max-w-[85%] md:max-w-[70%] lg:max-w-[65%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        {msg.context?.type === 'exercise' && (
                           <div className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-t-lg mb-0.5 border ${
                             isMe ? 'bg-primary/20 text-primary border-primary/30 ml-auto' : 'bg-card-dark text-text-secondary border-border-dark mr-auto'
                           }`}>
                              Dúvida: {msg.context.name}
                           </div>
                        )}
                        <div className={`relative px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm break-words flex flex-col w-full ${
                          isMe 
                            ? 'bg-primary text-background-dark rounded-br-sm' 
                            : 'bg-card-dark text-white rounded-bl-sm border border-border-dark'
                        }`}>
                          <span className="whitespace-pre-wrap">{msg.text}</span>
                          
                          <div className={`flex items-center justify-end gap-1 mt-1 shrink-0 ${isMe ? 'text-background-dark/70' : 'text-text-secondary'}`}>
                            <span className="text-[10px] right-0 translate-y-0.5 leading-none">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                            {isMe && (
                               <span className="material-symbols-outlined text-[14px] leading-none">
                                 {msg.readAt ? 'done_all' : 'check'}
                               </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-50 m-auto mt-20 gap-3">
                     <span className="material-symbols-outlined text-[48px] text-text-secondary">forum</span>
                     <p className="text-white text-sm font-medium bg-card-dark px-4 py-2 rounded-full border border-border-dark">Nenhuma mensagem ainda. Envie a primeira mensagem.</p>
                  </div>
                )}
                
                {chatInfo?.typingState?.[selectedStudentId] && (
                   <div className="flex self-start max-w-[85%]">
                     <div className="px-4 py-3 bg-card-dark rounded-2xl rounded-bl-sm border border-border-dark flex items-center gap-1.5 opacity-80 shadow-sm">
                       <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                       <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                       <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                     </div>
                   </div>
                )}
                
                <div ref={scrollRef} className="h-1 w-full shrink-0" />
              </div>
            </div>

            {/* Message Composer Footer */}
            <footer className="shrink-0 bg-card-dark px-4 py-3 sm:px-6 w-full border-t border-border-dark z-20">
              <div className="flex items-end gap-2 sm:gap-3 max-w-4xl mx-auto w-full">
                <button className="flex items-center justify-center size-12 shrink-0 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-colors" title="Anexar arquivo">
                  <span className="material-symbols-outlined text-2xl">attach_file</span>
                </button>
                <div className="flex-1 bg-background-dark border border-border-dark rounded-3xl min-h-[48px] max-h-[140px] flex items-center focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all shadow-inner overflow-hidden">
                  <textarea 
                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-text-secondary/70 resize-none px-5 py-3 max-h-[140px] text-[15px] leading-relaxed custom-scrollbar outline-none" 
                    placeholder="Digite uma mensagem..." 
                    rows={1}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                    }}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleSendMessage();
                         e.currentTarget.style.height = 'auto'; // reset height
                       } else {
                         handleInputKeyDown(e as any);
                       }
                    }}
                  />
                </div>
                <button 
                  onClick={() => {
                     handleSendMessage();
                     const ta = document.querySelector('textarea');
                     if(ta) ta.style.height = 'auto';
                  }}
                  disabled={!inputValue.trim()}
                  className="flex items-center justify-center size-12 shrink-0 rounded-full bg-primary text-background-dark shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all"
                >
                  <span className="material-symbols-outlined fill text-xl ml-0.5">send</span>
                </button>
              </div>
            </footer>
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-card-dark/30 gap-6">
            <div className="size-32 rounded-full bg-card-dark border border-border-dark flex items-center justify-center shadow-inner">
               <span className="material-symbols-outlined text-6xl text-text-secondary opacity-30">chat</span>
            </div>
            <div className="text-center">
              <h3 className="text-white text-xl font-bold mb-2">StarFit Web</h3>
              <p className="text-text-secondary text-sm max-w-sm mx-auto">
                Selecione um aluno na barra lateral para iniciar uma conversa.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-card-dark border border-border-dark text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                 <span className="material-symbols-outlined text-[12px] inline-block align-text-bottom mr-1">lock</span>
                 PontA-A-Ponta
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TrainerChat;
