import React, { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, serverTimestamp, orderBy, getDoc, setDoc } from 'firebase/firestore';

const AdminSecurity: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'policies' | 'logs' | 'login' | 'changes' | 'blocking'>('policies');
  
  const [policies, setPolicies] = useState({
    twoFactor: true,
    strongPassword: true,
    concurrentSession: false,
    geoBackup: true
  });
  const [loadingPolicies, setLoadingPolicies] = useState(true);

  const [criticalLogs, setCriticalLogs] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [systemChanges, setSystemChanges] = useState<any[]>([]);
  const [blockedEntities, setBlockedEntities] = useState<any[]>([]);
  
  const [blockInput, setBlockInput] = useState('');
  const [blockReason, setBlockReason] = useState('');

  // Fetch Policies
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const docRef = doc(db, 'securityPolicies', 'master');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPolicies(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error loading policies", error);
      } finally {
        setLoadingPolicies(false);
      }
    };
    fetchPolicies();
  }, []);

  // Subscribe to Collections
  useEffect(() => {
    const qSecLogs = query(collection(db, 'securityLogs'), orderBy('createdAt', 'desc'));
    const unsubSecLogs = onSnapshot(qSecLogs, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllLogs(logs);
      setCriticalLogs(logs.filter(l => l.severity === 'Alta' || l.isCritical));
    });

    const qLoginHistory = query(collection(db, 'loginHistory'), orderBy('createdAt', 'desc'));
    const unsubLoginHistory = onSnapshot(qLoginHistory, (snap) => {
      setLoginHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qSysChanges = query(collection(db, 'systemChanges'), orderBy('createdAt', 'desc'));
    const unsubSysChanges = onSnapshot(qSysChanges, (snap) => {
      setSystemChanges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qBlocked = query(collection(db, 'blockedEntities'), orderBy('createdAt', 'desc'));
    const unsubBlocked = onSnapshot(qBlocked, (snap) => {
      setBlockedEntities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubSecLogs();
      unsubLoginHistory();
      unsubSysChanges();
      unsubBlocked();
    };
  }, []);

  const togglePolicy = async (key: keyof typeof policies) => {
    const newPolicies = { ...policies, [key]: !policies[key] };
    setPolicies(newPolicies);
    try {
      await setDoc(doc(db, 'securityPolicies', 'master'), newPolicies);
      
      const policyLabels: Record<string, string> = {
        twoFactor: 'Autenticação de Dois Fatores (2FA)',
        strongPassword: 'Política de Senha Forte',
        concurrentSession: 'Sessão Concorrente',
        geoBackup: 'Backup Georedundante'
      };

      // Auto register change
      await addDoc(collection(db, 'systemChanges'), {
        author: auth.currentUser?.email || 'Admin',
        type: `Política de Segurança - ${policyLabels[key] || key}`,
        from: policies[key] ? 'Ativado' : 'Desativado',
        to: newPolicies[key] ? 'Ativado' : 'Desativado',
        createdAt: serverTimestamp()
      });
      
    } catch (e) {
      console.error(e);
      setPolicies(policies); // revert
    }
  };

  const handleBlock = async () => {
    if (!blockInput.trim()) return;
    try {
      const isIP = blockInput.includes('.');
      await addDoc(collection(db, 'blockedEntities'), {
        target: blockInput,
        type: isIP ? 'IP' : 'Conta',
        reason: blockReason || 'Violação de Termos',
        createdAt: serverTimestamp()
      });
      setBlockInput('');
      setBlockReason('');
      
      await addDoc(collection(db, 'systemChanges'), {
        author: auth.currentUser?.email || 'Admin',
        type: 'Bloqueio Adicionado',
        from: 'N/A',
        to: blockInput,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao bloquear.');
    }
  };

  const handleUnblock = async (id: string, target: string) => {
    try {
      await deleteDoc(doc(db, 'blockedEntities', id));
      
      await addDoc(collection(db, 'systemChanges'), {
        author: auth.currentUser?.email || 'Admin',
        type: 'Desbloqueio',
        from: target,
        to: 'Livre',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao desbloquear.');
    }
  };
  
  const formatDate = (date: any) => {
    if (!date) return '—';
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleString('pt-BR');
    }
    return date.toString();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Segurança e Auditoria</h1>
          <p className="text-text-secondary">Monitoramento de acessos, logs do sistema e ferramentas de bloqueio.</p>
        </div>

        <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark overflow-x-auto w-full shrink-0">
          {[
            { id: 'policies', label: 'Políticas', icon: 'verified_user' },
            { id: 'logs', label: 'Logs de Acesso', icon: 'list_alt' },
            { id: 'login', label: 'Histórico de Login', icon: 'history' },
            { id: 'changes', label: 'Alterações no Sistema', icon: 'edit_note' },
            { id: 'blocking', label: 'Bloqueio de Usuário', icon: 'block' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex flex-1 items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeSubTab === tab.id ? 'bg-primary text-background-dark' : 'text-text-secondary hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeSubTab === 'policies' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
            <h3 className="text-lg font-bold text-white mb-6">Políticas de Segurança</h3>
            {loadingPolicies ? (
              <p className="text-text-secondary">Carregando...</p>
            ) : (
              <div className="space-y-4">
                {[
                  { key: 'twoFactor', label: 'Autenticação de Dois Fatores (2FA)', desc: 'Obrigatório para Master Admins e Trainers.', active: policies.twoFactor },
                  { key: 'strongPassword', label: 'Política de Senha Forte', desc: 'Mínimo de 8 caracteres, símbolos e números.', active: policies.strongPassword },
                  { key: 'concurrentSession', label: 'Sessão Concorrente', desc: 'Permitir apenas 1 login por conta ao mesmo tempo.', active: policies.concurrentSession },
                  { key: 'geoBackup', label: 'Backup Georedundante', desc: 'Cópia de segurança automática em regiões distintas.', active: policies.geoBackup },
                ].map((policy, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-bold text-sm tracking-tight">{policy.label}</p>
                      <p className="text-text-secondary text-xs">{policy.desc}</p>
                    </div>
                    <div 
                      onClick={() => togglePolicy(policy.key as any)}
                      className={`size-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${policy.active ? 'bg-primary/20 text-primary' : 'bg-white/10 text-text-secondary'}`}
                    >
                      <span className="material-symbols-outlined">{policy.active ? 'toggle_on' : 'toggle_off'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card-dark p-6 rounded-2xl border border-border-dark flex flex-col h-full min-h-[400px]">
            <h3 className="text-lg font-bold text-white mb-6">Auditoria Crítica</h3>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {criticalLogs.length === 0 ? (
                <p className="text-text-secondary text-sm">Nenhum evento crítico recente.</p>
              ) : (
                criticalLogs.map((ev, i) => (
                  <div key={ev.id || i} className="flex gap-4 border-l-2 border-primary/30 pl-4 py-2">
                    <div className="flex-1">
                      <p className="text-white text-sm font-bold">{ev.event}</p>
                      <p className="text-text-secondary text-xs">{ev.ip} • {formatDate(ev.createdAt)}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase ${ev.severity === 'Alta' ? 'text-red-400' : ev.severity === 'Média' ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {ev.severity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border-dark rounded-xl text-text-secondary hover:text-white transition-all text-xs font-bold">
              <span className="material-symbols-outlined text-sm">download</span>
              EXPORTAR LOGS (CSV)
            </button>
          </div>
          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest border-b border-border-dark">
                <tr>
                  <th className="px-6 py-4 font-bold">Usuário</th>
                  <th className="px-6 py-4 font-bold">Ação</th>
                  <th className="px-6 py-4 font-bold">Recurso</th>
                  <th className="px-6 py-4 font-bold">IP</th>
                  <th className="px-6 py-4 font-bold">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {allLogs.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-text-secondary">Nenhum log encontrado.</td></tr>
                ) : (
                  allLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white text-sm">{log.user || 'Desconhecido'}</td>
                      <td className="px-6 py-4 text-text-secondary text-sm">{log.action || log.event}</td>
                      <td className="px-6 py-4 text-white text-sm font-medium">{log.resource || '-'}</td>
                      <td className="px-6 py-4 text-text-secondary text-xs font-mono">{log.ip || '-'}</td>
                      <td className="px-6 py-4 text-text-secondary text-xs">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'login' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border-dark rounded-xl text-text-secondary hover:text-white transition-all text-xs font-bold">
              <span className="material-symbols-outlined text-sm">download</span>
              EXPORTAR HISTÓRICO (CSV)
            </button>
          </div>
          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest border-b border-border-dark">
                <tr>
                  <th className="px-6 py-4 font-bold">ID Usuário</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Dispositivo</th>
                  <th className="px-6 py-4 font-bold">Localidade</th>
                  <th className="px-6 py-4 font-bold">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {loginHistory.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-text-secondary">Nenhum histórico encontrado.</td></tr>
                ) : (
                  loginHistory.map((auth) => (
                    <tr key={auth.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white text-sm">{auth.userId || auth.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${auth.status === 'Sucesso' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {auth.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm">{auth.device || 'Desconhecido'}</td>
                      <td className="px-6 py-4 text-text-secondary text-sm">{auth.geo || 'Desconhecido'}</td>
                      <td className="px-6 py-4 text-text-secondary text-xs">{formatDate(auth.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'changes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border-dark rounded-xl text-text-secondary hover:text-white transition-all text-xs font-bold">
              <span className="material-symbols-outlined text-sm">download</span>
              RELATÓRIO DE ALTERAÇÕES
            </button>
          </div>
          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest border-b border-border-dark">
                <tr>
                  <th className="px-6 py-4 font-bold">Autor</th>
                  <th className="px-6 py-4 font-bold">Tipo</th>
                  <th className="px-6 py-4 font-bold">De</th>
                  <th className="px-6 py-4 font-bold">Para</th>
                  <th className="px-6 py-4 font-bold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {systemChanges.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-text-secondary">Nenhuma alteração registrada.</td></tr>
                ) : (
                  systemChanges.map((change) => (
                    <tr key={change.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white text-sm">{change.author}</td>
                      <td className="px-6 py-4 text-primary text-sm font-bold">{change.type}</td>
                      <td className="px-6 py-4 text-text-secondary text-xs font-mono strike-through">{change.from}</td>
                      <td className="px-6 py-4 text-green-400 text-xs font-mono">{change.to}</td>
                      <td className="px-6 py-4 text-text-secondary text-xs">{formatDate(change.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'blocking' && (
        <div className="space-y-6">
          <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
            <h3 className="text-lg font-bold text-white mb-6">Controle de Bloqueio</h3>
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={blockInput}
                  onChange={(e) => setBlockInput(e.target.value)}
                  placeholder="Email, ID ou IP do infrator..."
                  className="flex-1 bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
                <input 
                  type="text" 
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Motivo (opcional)"
                  className="flex-1 bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
                <button 
                  onClick={handleBlock}
                  disabled={!blockInput.trim()}
                  className="bg-primary hover:bg-primary/90 text-background-dark px-6 py-3 rounded-xl font-black text-sm hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  BLOQUEAR
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Bloqueios Ativos</h4>
              {blockedEntities.length === 0 ? (
                <p className="text-text-secondary text-sm">Nenhum bloqueio ativo.</p>
              ) : (
                blockedEntities.map((block) => (
                  <div key={block.id} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="bg-red-500/20 p-2 rounded-lg">
                        <span className="material-symbols-outlined text-red-500">{block.type === 'IP' ? 'dns' : 'person'}</span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{block.target}</p>
                        <p className="text-text-secondary text-xs">{block.reason} • Bloqueado em {formatDate(block.createdAt)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUnblock(block.id, block.target)}
                      className="text-red-500 font-bold text-xs uppercase hover:underline"
                    >
                      Desbloquear
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecurity;
