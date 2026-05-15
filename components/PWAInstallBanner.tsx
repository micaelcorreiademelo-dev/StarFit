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
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const hasDismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (hasDismissed) return;

    // Check if the app is already installed
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    // Check if it's iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIOS(true);
      setShowPrompt(true);
    } else {
      // Force prompt to true to bypass iframe limitations for demonstration and info
      setShowPrompt(true);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      return;
    }

    if (!deferredPrompt) {
      alert('Para baixar o aplicativo:\n\n1. Abra o sistema no seu navegador principal (Chrome/Safari).\n2. Acesse o menu de opções (ícone de três pontos ou compartilhar).\n3. Selecione "Adicionar à Tela Inicial" ou "Instalar Aplicativo".\n\nIsso fará o download do aplicativo para a tela do seu celular!');
      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
    setShowPrompt(false);
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-[100px] left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-[350px] z-[9999] bg-card-dark border-2 border-primary rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-4 flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined shrink-0 text-xl">install_mobile</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-white font-medium text-sm">Instale o App StarFit</h3>
                <p className="text-text-secondary text-xs leading-snug mt-0.5">
                  {isIOS 
                    ? 'Para instalar no iOS: toque em "Compartilhar" e depois "Adicionar à Tela de Início".' 
                    : 'Adicione à tela inicial para uma experiência nativa muito mais rápida.'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-text-secondary hover:text-white p-1 rounded-md transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          {!isIOS && (
            <button
              onClick={handleInstallClick}
              className="w-full bg-primary text-black font-semibold text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mt-2"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Baixar Aplicativo
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
