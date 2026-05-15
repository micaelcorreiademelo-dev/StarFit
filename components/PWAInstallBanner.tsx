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

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      return;
    }

    // Check if it's iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIOS(true);
      setShowPrompt(true);
    } else {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Just dismiss the banner for iOS after clicking ok/understood, or let it show instructions
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-[100px] left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-96 z-[9999] bg-card-dark border-2 border-primary rounded-xl shadow-2xl p-4 flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined shrink-0 text-xl">install_mobile</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-white font-medium text-sm">Instalar Aplicativo</h3>
                <p className="text-text-secondary text-xs">
                  {isIOS 
                    ? 'Para instalar no iOS: toque em "Compartilhar" e depois "Adicionar à Tela de Início".' 
                    : 'Adicione o StarFit à sua tela inicial para uma melhor experiência e acesso mais rápido.'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-text-secondary hover:text-white p-1 rounded-md transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          {!isIOS && (
            <button
              onClick={handleInstallClick}
              className="w-full bg-primary text-black font-semibold text-sm py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors mt-2"
            >
              Instalar Agora
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
