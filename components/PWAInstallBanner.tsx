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
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
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
      const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        // Update UI notify the user they can install the PWA
        setShowPrompt(true);
      };

      // Check if it was already fired and stored globally
      if ((window as any).globalDeferredPrompt) {
        setDeferredPrompt((window as any).globalDeferredPrompt);
        setShowPrompt(true);
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt synchronously immediately
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt asynchronously
    deferredPrompt.userChoice.then(({ outcome }) => {
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      
      // We've used the prompt, and can't use it again, throw it away
      setDeferredPrompt(null);
      if ((window as any).globalDeferredPrompt) {
        (window as any).globalDeferredPrompt = null;
      }
    });
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
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-[380px] z-[9999] bg-card-dark border-2 border-primary/40 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-5 flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <span className="text-3xl shrink-0" role="img" aria-label="workout">🏋️</span>
              <div className="flex flex-col">
                <h3 className="text-white font-black text-base tracking-tight leading-tight">
                  Leve o app para onde quiser!
                </h3>
                <p className="text-text-secondary text-xs leading-normal mt-1">
                  {isIOS 
                    ? 'Instale gratuitamente no seu celular: toque em "Compartilhar" e depois em "Adicionar à Tela de Início".' 
                    : 'Instale gratuitamente no seu celular e acesse seus treinos offline.'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-text-secondary hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={handleDismiss}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all border border-white/10 text-center"
            >
              Agora não
            </button>
            {!isIOS && (
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-primary hover:bg-primary/95 text-background-dark font-black text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 text-center flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] font-black">download</span>
                Instalar Agora
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
