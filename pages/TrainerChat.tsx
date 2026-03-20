
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';

interface Message {
  id: string;
  text: string;
  time: string;
  sender: 'me' | 'them';
  status?: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online: boolean;
  messages: Message[];
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'Ana Beatriz',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5VLTNU-0_iZofcLVIqmdRzFt7RewDs7QzmWFfjrPPXNVXZxxyvYpczuWxGsqrvafAI17OolcnmuoYAcZkOOr8cy8eFRwanHpMnjVenlFyHAHKy26AFiWupgLlXUCmjq-I0QuiDxliv320NcBplxWOSw9-cRSOYOtNhtbCbhtjgVFKEIbjT6o5vdV8sNejgOj-LHDx0Y9zXogY0L5HHuOr1ozOdXFddNzghxl7-crzm2f0_yeCLTdCbDtsqXDYJvCOZ2Z0MmlOGds',
    lastMessage: 'Ótimo, vou ajustar aqui!',
    time: '10:42',
    unreadCount: 2,
    online: true,
    messages: [
      { id: 'm1', text: 'Olá Carlos, tudo bem? Podemos ajustar meu treino de amanhã para o período da manhã?', time: '10:40', sender: 'them' },
      { id: 'm2', text: 'Olá Ana! Tudo ótimo. Claro, podemos sim. Qual horário fica melhor para você?', time: '10:41', sender: 'me', status: 'read' },
      { id: 'm3', text: 'Ótimo, vou ajustar aqui!', time: '10:42', sender: 'them' },
      { id: 'm4', text: 'Combinado! Treino atualizado para amanhã às 8h.', time: '10:42', sender: 'me', status: 'sent' }
    ]
  },
  {
    id: '2',
    name: 'João Victor',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdi5oyFqK7HNG8M-7GdCaQg5NrGe67Vk3-atEKEFo4TaSmmjeNyH95TWZC-PqCRYMInPTM0k7uDUTj68oUZD2ZWIi_p8ae96RXvhf6RYu3XBsVBFrcIneZ8Ban2hp3y5Yu90xYVWCi6kPmrBxww8hsC3FXB5-y1UuxAtuhNp6d3fsUhgPtKOTyHhlY5YqVtzTdLq5Gb0b8uThAPtwlUL_iFXPfoDsYXkhF0vJkBtzAkYKx4yAeU0a7oXLOWAe33MRbv6Ch5XZd094',
    lastMessage: 'Combinado. Te vejo amanhã.',
    time: 'Ontem',
    unreadCount: 0,
    online: false,
    messages: []
  },
  {
    id: '3',
    name: 'Mariana Costa',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3FrAz5aoWVKDobuil1U2_zX4Nt_jvO31UtGLieKLUkajBaCzz13lpX0Tfnt-e23PPDdXSzQLpO-KX99CstFosPMJyK3HHPifcSO581AI7jgPwCt-SWnNjYcmsan9yHxH6E0YW1J0QXW7qu7BXfB8bxOnVJROqI74IdDm39ayWaIyhVrYEXjqVZZDBipnKbUEfkavgzpOlADW_Vb70MZqpzwoDeN_Ez5jp63DDA2gi5o0S2jlQQwWpzb6tKV6xXf3wDdaDFwk7cDw',
    lastMessage: 'O treino hoje foi intenso!',
    time: '2d atrás',
    unreadCount: 0,
    online: false,
    messages: []
  }
];

const TrainerChat: React.FC = () => {
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState('1');
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeConv) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'me',
      status: 'sent'
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: inputValue,
          time: newMessage.time,
          messages: [...c.messages, newMessage]
        };
      }
      return c;
    }));

    setInputValue('');
  };

  return (
    <div className="flex h-[calc(100vh-32px)] w-full rounded-2xl overflow-hidden border border-border-dark bg-background-dark shadow-2xl">
      {/* Conversation List Panel */}
      <aside className="flex flex-col w-full sm:w-80 lg:w-96 bg-card-dark border-r border-border-dark shrink-0">
        <div className="p-4 border-b border-border-dark">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Conversas</h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">search</span>
            <input 
              className="w-full bg-background-dark border-border-dark rounded-lg py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:ring-primary focus:border-primary transition-all" 
              placeholder="Buscar conversas" 
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {conversations.map((conv) => (
            <div 
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`flex gap-4 px-4 py-3 justify-between cursor-pointer transition-colors ${activeConvId === conv.id ? 'bg-primary/20' : 'bg-transparent hover:bg-white/5'}`}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-[56px] w-[56px] relative shrink-0" 
                  style={{ backgroundImage: `url("${conv.avatar}")` }}
                >
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-primary border-2 border-card-dark"></span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center overflow-hidden">
                  <p className="text-text-primary text-base font-medium leading-normal truncate">{conv.name}</p>
                  <p className={`text-sm leading-normal truncate ${conv.unreadCount > 0 ? 'text-primary font-semibold' : 'text-text-secondary'}`}>
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <p className="text-text-secondary text-xs font-normal">{conv.time}</p>
                {conv.unreadCount > 0 && (
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary text-background-dark text-[10px] font-bold">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1 bg-background-dark">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <header className="flex items-center p-4 border-b border-border-dark bg-card-dark shrink-0">
              <div className="flex items-center gap-4">
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 border border-border-dark" 
                  style={{ backgroundImage: `url("${activeConv.avatar}")` }}
                ></div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{activeConv.name}</h3>
                  <p className={`text-sm ${activeConv.online ? 'text-primary' : 'text-text-secondary'}`}>
                    {activeConv.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </header>

            {/* Message History */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="text-center text-[10px] text-text-secondary uppercase tracking-widest font-bold">Hoje</div>
              
              {activeConv.messages.length > 0 ? (
                activeConv.messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex items-end gap-3 ${msg.sender === 'me' ? 'justify-end' : 'max-w-xl'}`}
                  >
                    {msg.sender === 'them' && (
                      <div 
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-8 w-8 shrink-0 border border-border-dark" 
                        style={{ backgroundImage: `url("${activeConv.avatar}")` }}
                      ></div>
                    )}
                    <div className={`rounded-2xl p-3 shadow-sm relative ${
                      msg.sender === 'me' 
                        ? 'bg-primary text-background-dark rounded-br-none' 
                        : 'bg-card-dark text-text-primary rounded-bl-none border border-border-dark'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'justify-end' : 'justify-end'}`}>
                        <p className={`text-[10px] ${msg.sender === 'me' ? 'text-background-dark/70' : 'text-text-secondary'}`}>
                          {msg.time}
                        </p>
                        {msg.sender === 'me' && (
                          <span className={`material-symbols-outlined !text-xs ${msg.status === 'read' ? 'fill' : ''} ${msg.sender === 'me' ? 'text-background-dark/70' : 'text-primary'}`}>
                            {msg.status === 'read' ? 'done_all' : 'done'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-text-secondary text-sm italic">
                  Nenhuma mensagem ainda. Inicie a conversa!
                </div>
              )}
            </div>

            {/* Message Composer */}
            <footer className="p-4 bg-card-dark border-t border-border-dark">
              <div className="flex items-center gap-4">
                <button className="text-text-secondary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-2xl">add_circle</span>
                </button>
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
