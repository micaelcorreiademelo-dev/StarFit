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
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already installed (standalone mode)
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Check if user dismissed it in this session (avoid intrusive repeating)
    const isDismissed = localStorage.getItem('pwa-dashboard-banner-dismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIOS(true);
      setShowBanner(true);
    } else {
      // 4. Catch beforeinstallprompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowBanner(true);
      };

      // Check global prompt if already captured by index.html script
      if ((window as any).globalDeferredPrompt) {
        setDeferredPrompt((window as any).globalDeferredPrompt);
        setShowBanner(true);
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // In some configurations can show automatically as fallback even if event hasn't fired yet
      const fallbackTimeout = setTimeout(() => {
        // If not dismissed and not standalone, show the banner so we can provide instructions or install options
        setShowBanner(true);
      }, 1500);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        clearTimeout(fallbackTimeout);
      };
    }
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    const promptEvent = deferredPrompt || (window as any).globalDeferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then(({ outcome }: { outcome: string }) => {
        if (outcome === 'accepted') {
          localStorage.setItem('pwa-dashboard-banner-dismissed', 'true');
          setShowBanner(false);
        }
      });
    } else {
      // Direct instructions modal or fallback alert for desktop browser
      setShowIOSInstructions(true);
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
        className="w-full relative bg-gradient-to-br from-background-dark via-card-dark to-[#102216]/40 border border-primary/20 rounded-2xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden mb-6 z-10"
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
          <div className="lg:col-span-8 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                APP DISPONÍVEL
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px]">install_mobile</span>
                Instale nosso aplicativo
              </h2>
            </div>
          </div>

          {/* Action Column */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center w-full shrink-0">
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col items-center gap-3 w-full max-w-[320px] text-center">
              <div className="size-14 rounded-2xl bg-gradient-to-b from-primary to-green-700 p-0.5 flex items-center justify-center shadow-lg shadow-primary/20 animate-bounce">
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
                className="w-full bg-primary text-background-dark font-black h-11 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all text-sm shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Baixar Aplicativo
              </button>
            </div>
          </div>
        </div>

        {/* Modal-like Info Drawer in case of raw directions (Apple devices, localhost or restricted iframe environments) */}
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-white/5 pt-4 mt-6 flex flex-col gap-3"
          >
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase italic">
                  <span className="material-symbols-outlined text-primary text-base">help_outline</span>
                  Como adicionar o StarFit à tela inicial:
                </div>
                <button 
                  onClick={() => setShowIOSInstructions(false)} 
                  className="text-xs text-primary hover:underline font-bold"
                >
                  Ocultar ajuda
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-text-secondary leading-relaxed">
                <div>
                  <p className="font-bold text-white mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-primary">phone_iphone</span>
                    No iPhone/iPad (Safari):
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Pressione o botão de <strong>Compartilhar</strong> (retângulo com seta para cima).</li>
                    <li>Role as opções para baixo até encontrar <strong>"Adicionar à Tela de Início"</strong>.</li>
                    <li>Confirme no canto superior direito para finalizar a instalação.</li>
                  </ol>
                </div>
                <div>
                  <p className="font-bold text-white mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-primary">devices</span>
                    No Android / Desktop (Chrome / Edge):
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Na barra de endereços do topo, clique no ícone de <strong>Instalar</strong> (monitor com seta no computador, ou três pontos verticais no topo direito celular).</li>
                    <li>Selecione <strong>"Instalar Aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
