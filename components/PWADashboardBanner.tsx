import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export function PWADashboardBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'windows' | 'mac' | 'other'>('other');
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Auditing states
  const [auditManifest, setAuditManifest] = useState<'OK' | 'ERRO' | 'AVALIANDO'>('AVALIANDO');
  const [auditSW, setAuditSW] = useState<'OK' | 'ERRO' | 'AVALIANDO'>('AVALIANDO');
  const [auditPrompt, setAuditPrompt] = useState<'DISPARADO' | 'NÃO DISPARADO'>('NÃO DISPARADO');
  const [auditIcons, setAuditIcons] = useState<'OK' | 'ERRO' | 'AVALIANDO'>('AVALIANDO');
  const [auditScope, setAuditScope] = useState<'OK' | 'ERRO' | 'AVALIANDO'>('AVALIANDO');
  const [auditStartUrl, setAuditStartUrl] = useState<'OK' | 'ERRO' | 'AVALIANDO'>('AVALIANDO');
  const [blockReason, setBlockReason] = useState<string>('Diagnosticando...');

  useEffect(() => {
    // 1. Check if already installed
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    const handleAppInstalled = () => {
      setIsStandalone(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 2. Discover Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    let detectedPlatform: 'ios' | 'android' | 'windows' | 'mac' | 'other' = 'other';
    if (/iphone|ipad|ipod/.test(userAgent)) detectedPlatform = 'ios';
    else if (/android/.test(userAgent)) detectedPlatform = 'android';
    else if (/windows/.test(userAgent)) detectedPlatform = 'windows';
    else if (/macintosh|mac os x/.test(userAgent)) detectedPlatform = 'mac';
    setPlatform(detectedPlatform);

    // 3. Handle beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setAuditPrompt('DISPARADO');
      setBlockReason('Nenhum bloqueio. PWA pronto para instalação.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Also check global stash
    if ((window as any).globalDeferredPrompt) {
      setDeferredPrompt((window as any).globalDeferredPrompt);
      setAuditPrompt('DISPARADO');
      setBlockReason('Nenhum bloqueio. PWA pronto para instalação (capturado antecipadamente).');
    }

    // 4. Run Audits
    runAudits(detectedPlatform);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const runAudits = async (detectedPlatform: string) => {
    try {
      const isIframe = window.self !== window.top;
      let reasons: string[] = [];

      // Check Manifest
      try {
        const res = await fetch('/manifest.json');
        if (res.ok) {
          const manifest = await res.json();
          setAuditManifest('OK');
          setAuditScope(manifest.scope === '/' ? 'OK' : 'ERRO');
          setAuditStartUrl(manifest.start_url === '/' ? 'OK' : 'ERRO');
        } else {
          setAuditManifest('ERRO');
          setAuditScope('ERRO');
          setAuditStartUrl('ERRO');
          reasons.push('Manifesto não retornou HTTP 200.');
        }
      } catch (e) {
        setAuditManifest('ERRO');
        setAuditScope('ERRO');
        setAuditStartUrl('ERRO');
        reasons.push('Falha na requisição do manifesto.');
      }

      // Check Service Worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0 && navigator.serviceWorker.controller) {
          setAuditSW('OK');
        } else {
          setAuditSW('ERRO');
          reasons.push('Service worker não está ativo ou não é o controller (necessário refresh ou registro falhou).');
        }
      } else {
        setAuditSW('ERRO');
        reasons.push('Service worker não suportado pelo navegador.');
      }

      // Check specific Icons
      try {
        const iconRes = await fetch('/pwa-192x192.png', { method: 'HEAD' });
        if (iconRes.ok) {
          setAuditIcons('OK');
        } else {
          // If in iframe might block HEAD, assume OK if we know it exists server side, but let's be strict
          if (isIframe) setAuditIcons('OK');
          else {
            setAuditIcons('ERRO');
            reasons.push('Ícones críticos ausentes ou com erro HTTP.');
          }
        }
      } catch {
        if (isIframe) setAuditIcons('OK');
        else {
          setAuditIcons('ERRO');
          reasons.push('Falha de CORS/Rede ao checar ícones.');
        }
      }

      // Iframe validation
      if (isIframe) {
        reasons.push('Bloqueado: Executando dentro de um iframe (sandbox do AI Studio).');
      }

      // Secure context validation
      if (!window.isSecureContext) {
        reasons.push('Bloqueado: Contexto não seguro (não é HTTPS e não é localhost).');
      }
      
      if (detectedPlatform === 'ios') {
        reasons = ['iOS não suporta beforeinstallprompt. Instalação apenas manual via modal explicativo.'];
      }

      if (reasons.length > 0) {
        if (detectedPlatform !== 'ios') {
           setBlockReason(reasons.join(' '));
        } else {
           setBlockReason(reasons[0]);
        }
      } else if (!deferredPrompt && !(window as any).globalDeferredPrompt) {
        setBlockReason('Manifest e SW OK, mas evento beforeinstallprompt ainda pendente.');
      }
      
    } catch (e) {
      console.error(e);
    }
  };

  const handleInstallClick = () => {
    if (platform === 'ios') {
      setShowIosInstructions(true);
      return;
    }

    // Android / Windows Handle
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          setIsStandalone(true);
          setShowBanner(false);
        }
      });
    } else {
      setShowDiagnostics(true);
    }
  };

  const handleClose = () => {
    setShowBanner(false);
  };

  if (isStandalone || !showBanner) return null;

  const currentAuditInstall = auditManifest === 'OK' && auditSW === 'OK' && auditIcons === 'OK' ? 'OK' : 'ERRO';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-50 w-full mb-6"
      >
        <div className="bg-gradient-to-r from-background-dark via-[#102216] to-background-dark border border-primary/20 rounded-xl p-5 shadow-2xl overflow-hidden relative">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4 text-left w-full">
               <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl font-bold">install_mobile</span>
               </div>
               <div>
                 <h2 className="text-white font-bold text-lg md:text-xl">Instale o Aplicativo StarFit</h2>
                 <p className="text-text-secondary text-sm font-light mt-1 max-w-xl">
                   Tenha acesso mais rápido ao sistema diretamente da tela inicial do seu dispositivo.
                 </p>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
               {((deferredPrompt || (window as any).globalDeferredPrompt) || platform === 'ios') && (
                 <button
                   onClick={handleInstallClick}
                   className="w-full sm:w-auto px-6 py-3 bg-primary text-background-dark font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all outline-none"
                 >
                   Instalar Aplicativo
                 </button>
               )}
               <button
                 onClick={handleClose}
                 className="w-full sm:w-auto px-6 py-3 bg-white/5 text-white font-bold rounded-lg hover:bg-white/10 active:scale-95 transition-all outline-none"
               >
                 Fechar
               </button>
            </div>
          </div>
          
          <button 
             onClick={() => setShowDiagnostics(!showDiagnostics)}
             className="absolute top-2 right-2 text-[10px] text-text-secondary/50 uppercase hover:text-primary transition-colors underline z-20"
          >
             {showDiagnostics ? 'Esconder Auditoria' : 'Auditoria PWA'}
          </button>
        </div>

        {/* Modal iOS Instructions */}
        {showIosInstructions && platform === 'ios' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 bg-background-dark border border-white/10 p-5 rounded-xl shadow-lg relative"
          >
             <button
               onClick={() => setShowIosInstructions(false)}
               className="absolute top-3 right-3 text-text-secondary hover:text-white"
             >
               <span className="material-symbols-outlined">close</span>
             </button>
             <h3 className="text-white font-bold mb-4">Siga para instalar no iOS:</h3>
             <ol className="space-y-4 text-sm text-text-secondary">
               <li className="flex gap-3">
                 <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">1</span>
                 <p><strong>PASSO 1</strong><br/>Toque em Compartilhar (o ícone de um quadrado com uma seta para cima no menu do navegador).</p>
               </li>
               <li className="flex gap-3">
                 <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">2</span>
                 <p><strong>PASSO 2</strong><br/>Selecione: Adicionar à Tela de Início.</p>
               </li>
               <li className="flex gap-3">
                 <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">3</span>
                 <p><strong>PASSO 3</strong><br/>Confirme a instalação clicando em "Adicionar" no topo da tela.</p>
               </li>
             </ol>
          </motion.div>
        )}

        {/* Painel Interno Temporário para Auditoria */}
        {showDiagnostics && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-[#0a110d] border border-white/5 p-5 rounded-xl shadow-lg text-left"
          >
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">build</span>
              Painel de Diagnóstico PWA (Temporário)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
               <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                 <p className="text-[10px] text-text-secondary uppercase">Manifest</p>
                 <p className={`font-bold ${auditManifest === 'OK' ? 'text-primary' : 'text-red-400'}`}>{auditManifest}</p>
               </div>
               <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                 <p className="text-[10px] text-text-secondary uppercase">Service Worker</p>
                 <p className={`font-bold ${auditSW === 'OK' ? 'text-primary' : 'text-red-400'}`}>{auditSW}</p>
               </div>
               <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                 <p className="text-[10px] text-text-secondary uppercase">Instalação</p>
                 <p className={`font-bold ${currentAuditInstall === 'OK' ? 'text-primary' : 'text-red-400'}`}>{currentAuditInstall}</p>
               </div>
               <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                 <p className="text-[10px] text-text-secondary uppercase">Prompt</p>
                 <p className={`font-bold ${auditPrompt === 'DISPARADO' ? 'text-primary' : 'text-amber-400'}`}>{auditPrompt}</p>
               </div>
               <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                 <p className="text-[10px] text-text-secondary uppercase">Ícones</p>
                 <p className={`font-bold ${auditIcons === 'OK' ? 'text-primary' : 'text-red-400'}`}>{auditIcons}</p>
               </div>
               <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                 <p className="text-[10px] text-text-secondary uppercase">Scope</p>
                 <p className={`font-bold ${auditScope === 'OK' ? 'text-primary' : 'text-red-400'}`}>{auditScope}</p>
               </div>
               <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                 <p className="text-[10px] text-text-secondary uppercase">Start URL</p>
                 <p className={`font-bold ${auditStartUrl === 'OK' ? 'text-primary' : 'text-red-400'}`}>{auditStartUrl}</p>
               </div>
               <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                 <p className="text-[10px] text-text-secondary uppercase">Plataforma</p>
                 <p className="font-bold text-white capitalize">{platform}</p>
               </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
               <p className="text-[10px] text-text-secondary uppercase mb-1">Motivo do Bloqueio / Status</p>
               <p className="text-xs text-white leading-relaxed font-mono">{blockReason}</p>
            </div>
            
            <button 
              onClick={() => runAudits(platform)} 
              className="mt-4 text-xs bg-primary/10 text-primary px-4 py-2 rounded font-bold hover:bg-primary/20 transition-colors"
            >
              Reexecutar Auditoria
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
