import React, { useState, useEffect } from "react";
import { User } from "../types";
import { dataService } from "../services/dataService";

interface SidebarProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
}) => {
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (user.role === 'TRAINER') {
      const unsub = dataService.subscribeToLinkRequests(user.id, (requests) => {
        setPendingRequestsCount(requests.length);
      });
      return () => unsub();
    }
  }, [user]);

  const adminLinks = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "users", icon: "group", label: "Usuários" },
    { id: "plans", icon: "credit_card", label: "Planos" },
    { id: "reports", icon: "bar_chart", label: "Relatórios" },
    { id: "support", icon: "support_agent", label: "Suporte" },
    { id: "security", icon: "security", label: "Segurança" },
  ];

  const trainerLinks = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "requests", icon: "person_add", label: "Solicitações" },
    { id: "students", icon: "group", label: "Alunos" },
    { id: "workouts", icon: "fitness_center", label: "Treinos" },
    { id: "library", icon: "menu_book", label: "Biblioteca" },
    { id: "agenda", icon: "calendar_month", label: "Agenda" },
    { id: "chat", icon: "chat", label: "Chat" },
    { id: "plans", icon: "local_activity", label: "Planos" },
    { id: "landing-page", icon: "web", label: "Landing Page" },
    { id: "subscription", icon: "credit_card", label: "Minha Assinatura" },
    { id: "support", icon: "support_agent", label: "Suporte" },
  ];

  const studentLinks = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "my-workouts", icon: "fitness_center", label: "Meus Treinos" },
    { id: "progress", icon: "trending_up", label: "Progresso" },
    ...(user.trainerId ? [{ id: "chat", icon: "chat", label: "Chat" }] : []),
    { id: "subscription", icon: "credit_card", label: "Assinatura" },
  ];

  const links =
    user.role === "ADMIN"
      ? adminLinks
      : user.role === "TRAINER"
        ? trainerLinks
        : studentLinks;

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-[70] w-64 bg-card-light dark:bg-card-dark flex flex-col p-4 border-r border-border-light dark:border-border-dark shrink-0
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 h-screen
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col gap-4 flex-grow overflow-hidden">
          {/* Header Sidebar with Close Button for Mobile */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 shrink-0 overflow-hidden">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-primary/20"
                style={{ backgroundImage: `url(${user.avatar})` }}
              ></div>
              <div className="flex flex-col overflow-hidden">
                <h1 className="text-text-light-primary dark:text-text-dark-primary text-sm font-bold leading-normal truncate">
                  {user.name}
                </h1>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-[10px] font-bold uppercase tracking-wider truncate">
                  {user.role}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-text-secondary hover:text-white p-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-2 mt-4 overflow-y-auto pr-1">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => handleTabClick(link.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all shrink-0 ${
                  activeTab === link.id
                    ? "bg-primary text-background-dark shadow-lg shadow-primary/20"
                    : "text-text-light-primary dark:text-text-dark-primary hover:bg-primary/10"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${activeTab === link.id ? "fill" : ""}`}
                >
                  {link.icon}
                </span>
                <p className="text-sm font-semibold leading-normal whitespace-nowrap">
                  {link.label}
                </p>
                {link.id === 'requests' && pendingRequestsCount > 0 && (
                  <span className="ml-auto bg-white text-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-border-light dark:border-border-dark shrink-0">
          <button
            onClick={() => handleTabClick("settings")}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-text-light-primary dark:text-text-dark-primary text-left ${
              activeTab === "settings"
                ? "bg-primary/10 text-primary"
                : "hover:bg-primary/5"
            }`}
          >
            <span
              className={`material-symbols-outlined ${activeTab === "settings" ? "fill" : ""}`}
            >
              settings
            </span>
            <p className="text-sm font-medium leading-normal">Configurações</p>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-text-light-primary dark:text-text-dark-primary hover:text-red-500 transition-colors text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <p className="text-sm font-medium leading-normal">Sair</p>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
