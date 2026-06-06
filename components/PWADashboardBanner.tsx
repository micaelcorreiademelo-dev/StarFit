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
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'windows' | 'other'>('other');
  const [isStandalone, setIsStandalone] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    if (isIosDevice) {
      setPlatform('ios');
      setShowBanner(true);
    } else if (isAndroidDevice) {
      setPlatform('android');
      setShowBanner(true);
    } else if (isWindowsDevice) {
      setPlatform('windows');
      setShowBanner(true);
    } else {
      setPlatform('other');
      setShowBanner(true);
    }

    // 4. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    if ((window as any).globalDeferredPrompt) {
      setDeferredPrompt((window as any).globalDeferredPrompt);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    setErrorMessage(null);

    // iOS flow: directly show help instructions (Safari doesn't support beforeinstallprompt)
    if (platform === 'ios') {
      setShowHelp(true);
      return;
    }

    // Android, Windows, or other chromium browser flow: Try native beforeinstallprompt
    const promptEvent = deferredPrompt || (window as any).globalDeferredPrompt;

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
      });
    } else {
      // If no native prompt exists, but user is on Android or Windows, they might be in an iframe (e.g. AI Studio Preview) or pre-prompt phase
      if (platform === 'android' || platform === 'windows') {
        setErrorMessage("Seu navegador não suporta instalação automática ou a sessão atual está bloqueada em iframe. Tente acessar diretamente no Chrome ou Edge fora do frame e clique em 'Instalar aplicativo' ou adicione à tela inicial.");
      } else {
        setErrorMessage("Seu navegador não suporta instalação automática. Utilize um navegador compatível como Chrome, Edge ou Safari.");
      }
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

            <div className="flex flex-col gap-1">
              <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px]">install_mobile</span>
                Instale nosso aplicativo
              </h2>
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

        {/* Error reporting if anything goes wrong inside the web container */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 leading-relaxed"
          >
            {errorMessage}
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
                  className="text-xs text-primary hover:underline font-bold"
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

