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

interface AuditInfo {
  manifestStatus: string;
  swStatus: string;
  promptStatus: string;
  iframeStatus: string;
  standaloneStatus: string;
  details: string;
}

export function PWADashboardBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'windows' | 'other'>('other');
  const [isStandalone, setIsStandalone] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [auditInfo, setAuditInfo] = useState<AuditInfo | null>(null);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState(false);

  // Run a comprehensive PWA standards audit
  const runPWAAudit = async (currentPrompt: BeforeInstallPromptEvent | null) => {
    const isIframe = window.self !== window.top;
    let manifestStatus = 'Verificando...';
    let details = '';

    // 1. Audit Web Manifest
    try {
      const response = await fetch('/manifest.json');
      if (response.ok) {
        const content = await response.json();
        if (content.short_name && content.icons && content.icons.length > 0) {
          manifestStatus = `OK (Nome: "${content.name || content.short_name}")`;
        } else {
          manifestStatus = 'Inválido - Campos estruturais short_name ou icons em falta';
          details += 'O arquivo de manifesto PWA está incompleto. ';
        }
      } else {
        manifestStatus = `ERRO (HTTP ${response.status})`;
        details += 'Não foi possível carregar o arquivo manifest.json na raiz do servidor. ';
      }
    } catch (err) {
      manifestStatus = `Falha ao requisitar (${String(err)})`;
    }

    // 2. Audit Service Worker registration
    let swStatus = 'Não suportado por este navegador';
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          const activeSws = registrations.map(r => r.active ? 'Ativo' : 'Pendente').join(', ');
          swStatus = `OK (${registrations.length} registrado(s) [${activeSws}])`;
        } else {
          swStatus = 'Sem registro ativo';
          details += 'Nenhum Service Worker está operando para esta origem. ';
        }
      } catch (err) {
        swStatus = `Falha ao auditar (${String(err)})`;
      }
    }

    // 3. Audit beforeinstallprompt event
    const hasPrompt = !!(currentPrompt || (window as any).globalDeferredPrompt);
    const promptStatus = hasPrompt ? 'OK (Disparado e interceptado)' : 'NÃO DISPARADO';

    const iframeStatus = isIframe ? 'SIM (Ambiente restrito)' : 'NÃO (Ambiente nativo)';
    const standaloneStatus = (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true)
      ? 'SIM (Executando instalado)'
      : 'NÃO (Presença no navegador)';

    // Compile explanation
    let motivo = '';
    if (isIframe) {
      motivo = 'A execução de prompts de PWAs modernos é estritamente bloqueada por navegadores dentro de frames (iframes) e caixas de areia por razões de segurança sanitária de cliques (clickjacking/UI redress).';
    } else if (!hasPrompt) {
      motivo = 'O evento de prompt nativo ("beforeinstallprompt") ainda não foi emitido pelo motor Chromium do navegador. Causas típicas: 1. O navegador ainda está avaliando a integridade dos pacotes estáticos ou inicializando o service worker offline (aguarde de 5 a 10 segundos). 2. A aplicação já está instalada neste computador/dispositivo. 3. O navegador possui restrições internas contra PWAs nesta origem.';
    } else {
      motivo = 'Nenhum impeditivo detectado. O evento foi coletado perfeitamente e está pronto para instalação no sistema operacional.';
    }

    const auditData: AuditInfo = {
      manifestStatus,
      swStatus,
      promptStatus,
      iframeStatus,
      standaloneStatus,
      details: motivo + (details ? ' Observações: ' + details : '')
    };

    setAuditInfo(auditData);

    // Logging report requested in USER_REQUEST
    console.group('%c StarFit PWA Installation Audit ', 'background: #102216; color: #13ec5b; font-weight: bold; font-size: 13px; padding: 4px; border: 1px solid #3a5543; border-radius: 4px;');
    console.log(`Manifest: ${manifestStatus}`);
    console.log(`Service Worker: ${swStatus}`);
    console.log(`beforeinstallprompt Event: ${promptStatus}`);
    console.log(`Iframe Sandbox Check: ${iframeStatus}`);
    console.log(`App Already Installed (Standalone): ${standaloneStatus}`);
    console.log(`Motivo Diagnóstico: ${motivo}`);
    console.groupEnd();
  };

  useEffect(() => {
    // 1. Check if already installed (standalone mode)
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    // Listen to native appinstalled event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      localStorage.setItem('pwa-dashboard-banner-dismissed', 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 2. Check if user dismissed it in this session (avoid intrusive repeating)
    const isDismissed = localStorage.getItem('pwa-dashboard-banner-dismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // 3. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isWindowsDevice = /windows/.test(userAgent);

    let detectedPlatform: 'ios' | 'android' | 'windows' | 'other' = 'other';
    if (isIosDevice) {
      detectedPlatform = 'ios';
    } else if (isAndroidDevice) {
      detectedPlatform = 'android';
    } else if (isWindowsDevice) {
      detectedPlatform = 'windows';
    }
    setPlatform(detectedPlatform);
    setShowBanner(true);

    // 4. Capture native prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      runPWAAudit(promptEvent);
    };

    // 5. Capture custom event dispatched by index.html (solves asynchronous mounting races)
    const handleCustomPromptFired = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setDeferredPrompt(customEvent.detail);
        runPWAAudit(customEvent.detail);
      }
    };

    // Check early global prompt stashed in index.html
    if ((window as any).globalDeferredPrompt) {
      const earlyPrompt = (window as any).globalDeferredPrompt;
      setDeferredPrompt(earlyPrompt);
      runPWAAudit(earlyPrompt);
    } else {
      runPWAAudit(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-beforeinstallprompt-fired', handleCustomPromptFired);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-beforeinstallprompt-fired', handleCustomPromptFired);
    };
  }, []);

  const handleInstallClick = () => {
    setErrorMessage(null);

    // Run active audit immediately to get latest diagnostic data
    const promptEvent = deferredPrompt || (window as any).globalDeferredPrompt;
    runPWAAudit(promptEvent);

    // iOS flow: directly show manual help instructions (Safari doesn't support beforeinstallprompt)
    if (platform === 'ios') {
      setShowHelp(true);
      return;
    }

    // Android, Windows, or other chromium browser flow: Try native beforeinstallprompt
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then(({ outcome }: { outcome: string }) => {
        if (outcome === 'accepted') {
          setIsStandalone(true);
          localStorage.setItem('pwa-dashboard-banner-dismissed', 'true');
          setShowBanner(false);
        }
      }).catch((err: any) => {
        console.error("Erro no fluxo do prompt PWA:", err);
        setErrorMessage(`Falha na chamada do instalador nativo: ${err.message || err}`);
      });
    } else {
      // No prompt captured. Evaluate IFRAME presence strictly to prevent FALSE POSITIVES
      const isRealIframe = window.self !== window.top;
      if (isRealIframe) {
        setErrorMessage("A sessão atual está sendo executada dentro de um painel de visualização (Iframe). Para realizar a instalação automática, acesse o StarFit diretamente na barra de URL principal do seu navegador Chrome, Edge ou Safari.");
      } else {
        setErrorMessage("Seu navegador ainda não ativou a instalação automática para esta sessão. Isso pode ocorrer porque o Service Worker está registrando os arquivos estáticos para navegação offline. Aguarde alguns segundos e tente novamente clique em 'Instalar Aplicativo', ou use a opção nativa do menu do seu navegador.");
      }
      
      // Auto toggle audit panel to display details helper
      setShowDiagnosticsPanel(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-dashboard-banner-dismissed', 'true');
    setShowBanner(false);
  };

  if (isStandalone || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full relative bg-gradient-to-br from-background-dark via-card-dark to-[#102216]/40 border border-primary/20 rounded-2xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden mb-6 z-10 text-left"
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-text-secondary hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer z-20"
          title="Dispensar recomendação"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Information Column */}
          <div className="lg:col-span-8 flex flex-col items-start gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                APP DISPONÍVEL
              </span>
              <span className="text-[10px] uppercase font-black tracking-widest bg-white/5 text-text-secondary px-2.5 py-1 rounded-full border border-white/5">
                {platform === 'ios' && 'iOS / Apple'}
                {platform === 'android' && 'Android'}
                {platform === 'windows' && 'Windows'}
                {platform === 'other' && 'Multiplataforma'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px]">install_mobile</span>
                Instale nosso aplicativo
              </h2>
              <p className="text-text-secondary text-xs md:text-sm leading-relaxed max-w-2xl font-light">
                Acesse o StarFit diretamente de sua tela inicial como um aplicativo nativo. Desfrute de desempenho fluido, inicialização instantânea e maior facilidade para acompanhar seus treinos.
              </p>
            </div>
          </div>

          {/* Action Column */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center w-full shrink-0">
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col items-center gap-3 w-full max-w-[320px] text-center">
              <div className="size-14 rounded-2xl bg-gradient-to-b from-primary to-green-700 p-0.5 flex items-center justify-center shadow-lg shadow-primary/20">
                <div className="w-full h-full bg-background-dark rounded-[14px] flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl fill">fitness_center</span>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-white font-bold text-sm">StarFit Ecosystem</span>
                <span className="text-[10px] text-text-secondary">Pronto para seu navegador</span>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full bg-primary text-background-dark font-black h-11 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all text-xs uppercase tracking-wider shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Instalar Aplicativo
              </button>
            </div>
          </div>
        </div>

        {/* Error reporting and helpful diagnostics */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 flex flex-col gap-2 shadow-inner"
          >
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-orange-400 text-sm select-none shrink-0 mt-0.5">warning</span>
              <p className="leading-relaxed font-light">{errorMessage}</p>
            </div>
            
            {auditInfo && (
              <div className="border-t border-orange-500/10 pt-2.5 mt-1 flex flex-col gap-1.5">
                <button
                  onClick={() => setShowDiagnosticsPanel(!showDiagnosticsPanel)}
                  className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider text-left w-fit flex items-center gap-1 select-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">{showDiagnosticsPanel ? 'expand_less' : 'expand_more'}</span>
                  {showDiagnosticsPanel ? 'Ocultar diagnósticos técnicos' : 'Visualizar diagnósticos técnicos'}
                </button>
                
                {showDiagnosticsPanel && (
                  <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-1.5 mt-1">
                    <p className="text-white font-bold text-[10px] uppercase tracking-wider">PWA Install Status:</p>
                    <div className="grid grid-cols-2 gap-y-1 text-[10px]">
                      <div><span className="text-text-secondary font-medium">Manifesto:</span> <span className="text-white font-mono">{auditInfo.manifestStatus}</span></div>
                      <div><span className="text-text-secondary font-medium">Service Worker:</span> <span className="text-white font-mono">{auditInfo.swStatus}</span></div>
                      <div><span className="text-text-secondary font-medium">Instâncias de Prompts:</span> <span className="text-white font-mono">{auditInfo.promptStatus}</span></div>
                      <div><span className="text-text-secondary font-medium">Nesting Iframe:</span> <span className="text-white font-mono">{auditInfo.iframeStatus}</span></div>
                    </div>
                    <div className="text-[10px] leading-normal border-t border-white/5 pt-1.5 mt-1 text-text-secondary">
                      <span className="text-white font-bold">Diagnóstico:</span> {auditInfo.details}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* iOS-specific Step Help Drawer */}
        {showHelp && platform === 'ios' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-white/5 pt-4 mt-6 flex flex-col gap-3"
          >
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase italic">
                  <span className="material-symbols-outlined text-primary text-base">help_outline</span>
                  Como adicionar o StarFit à tela inicial do iOS:
                </div>
                <button 
                  onClick={() => setShowHelp(false)} 
                  className="text-xs text-primary hover:underline font-bold select-none cursor-pointer"
                >
                  Ocultar ajuda
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-text-secondary leading-relaxed">
                <div className="bg-background-dark/40 p-3 rounded-lg border border-white/5">
                  <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">1</span>
                    Passo 1
                  </p>
                  <p>
                    Abra o StarFit em seu Safari. Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com flecha para cima no menu inferior).
                  </p>
                </div>
                <div className="bg-background-dark/40 p-3 rounded-lg border border-white/5">
                  <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">2</span>
                    Passo 2
                  </p>
                  <p>
                    Role por entre as opções para baixo até encontrar e selecionar a opção <strong>"Adicionar à Tela de Início"</strong>.
                  </p>
                </div>
                <div className="bg-background-dark/40 p-3 rounded-lg border border-white/5">
                  <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">3</span>
                    Passo 3
                  </p>
                  <p>
                    Edite ou confirme o nome do aplicativo no canto direito superior e clique em <strong>"Adicionar"</strong> para concluir!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
