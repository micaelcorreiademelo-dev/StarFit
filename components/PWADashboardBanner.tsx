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

interface IconAuditResult {
  src: string;
  expectedSize: string;
  status: string;
  ok: boolean;
  dimensions: string;
  format: string;
}

interface AdvancedAuditResult {
  isSecureContext: boolean;
  protocol: string;
  isIframe: boolean;
  browserPromptSupported: boolean;
  promptEventStatus: 'CAPTURED' | 'PENDING' | 'BLOCKED_BY_IFRAME' | 'NOT_FIRED';
  
  manifestFound: boolean;
  manifestHttpStatus: string;
  manifestAppName: string;
  manifestShortName: string;
  manifestStartUrl: string;
  manifestScope: string;
  manifestDisplay: string;
  manifestOrientation: string;
  manifestThemeColor: string;
  
  swSupported: boolean;
  swRegistrationsCount: number;
  swActiveState: 'ACTIVE' | 'PENDING' | 'NOT_FOUND' | 'UNSUPPORTED';
  swIsController: boolean;
  swClaimed: boolean;
  
  isHashRouterActive: boolean;
  hashRouterImpact: string;
  
  iconAudits: IconAuditResult[];
  overallInstallability: 'INSTALLABLE' | 'BLOCKED' | 'EVALUATING';
  suggestedFixes: string[];
}

export function PWADashboardBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'windows' | 'other'>('other');
  const [isStandalone, setIsStandalone] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [pwaAudit, setPwaAudit] = useState<AdvancedAuditResult | null>(null);

  // Programmatically check dimensions, existence, and format of an icon
  const auditSingleIcon = (src: string, expectedWidth: number, expectedHeight: number): Promise<IconAuditResult> => {
    return new Promise((resolve) => {
      const result: IconAuditResult = {
        src,
        expectedSize: `${expectedWidth}x${expectedHeight}`,
        status: 'Pendente',
        ok: false,
        dimensions: 'Avaliando...',
        format: 'Avaliando...'
      };

      const img = new Image();
      img.src = src;
      img.onload = () => {
        const actualWidth = img.naturalWidth;
        const actualHeight = img.naturalHeight;
        const matchesDimensions = actualWidth === expectedWidth && actualHeight === expectedHeight;
        
        // Detect actual mime type based on extension
        const isSvg = src.toLowerCase().endsWith('.svg');
        const formatStr = isSvg ? 'image/svg+xml' : 'image/png';

        resolve({
          src,
          expectedSize: `${expectedWidth}x${expectedHeight}`,
          status: 'HTTP 200 (Carregado)',
          ok: matchesDimensions,
          dimensions: `${actualWidth}x${actualHeight}`,
          format: formatStr
        });
      };

      img.onerror = () => {
        // Fallback fetch to trace HTTP Status (404/500/etc.)
        fetch(src, { method: 'HEAD' })
          .then((res) => {
            resolve({
              src,
              expectedSize: `${expectedWidth}x${expectedHeight}`,
              status: res.status === 404 ? 'ERRO (404 Not Found)' : `FALHA (HTTP ${res.status})`,
              ok: false,
              dimensions: 'N/A',
              format: 'Desconhecido'
            });
          })
          .catch((err) => {
            resolve({
              src,
              expectedSize: `${expectedWidth}x${expectedHeight}`,
              status: `FALHA DE REDE (${err.message || String(err)})`,
              ok: false,
              dimensions: 'N/A',
              format: 'Desconhecido'
            });
          });
      };
    });
  };

  // Perform full advanced technical PWA Audit
  const runPWAAudit = async (currentPrompt: BeforeInstallPromptEvent | null) => {
    setIsAuditing(true);
    
    const isSecureContext = window.isSecureContext;
    const protocol = window.location.protocol;
    const isIframe = window.self !== window.top;
    const browserPromptSupported = 'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window;
    
    // Evaluate active prompt
    const hasPrompt = !!(currentPrompt || (window as any).globalDeferredPrompt);
    let promptEventStatus: AdvancedAuditResult['promptEventStatus'] = 'NOT_FIRED';
    if (isIframe) {
      promptEventStatus = 'BLOCKED_BY_IFRAME';
    } else if (hasPrompt) {
      promptEventStatus = 'CAPTURED';
    } else {
      promptEventStatus = 'PENDING';
    }

    // 1. Manifest Auditing
    let manifestFound = false;
    let manifestHttpStatus = 'N/A';
    let manifestAppName = '';
    let manifestShortName = '';
    let manifestStartUrl = '';
    let manifestScope = '';
    let manifestDisplay = '';
    let manifestOrientation = '';
    let manifestThemeColor = '';

    try {
      const manifestRes = await fetch('/manifest.json');
      manifestHttpStatus = `HTTP ${manifestRes.status}`;
      if (manifestRes.ok) {
        manifestFound = true;
        const manifestObj = await manifestRes.json();
        manifestAppName = manifestObj.name || '';
        manifestShortName = manifestObj.short_name || '';
        manifestStartUrl = manifestObj.start_url || '';
        manifestScope = manifestObj.scope || '';
        manifestDisplay = manifestObj.display || '';
        manifestOrientation = manifestObj.orientation || '';
        manifestThemeColor = manifestObj.theme_color || '';
      }
    } catch (err: any) {
      manifestHttpStatus = `Falha de requisição: ${err.message || String(err)}`;
    }

    // 2. Service Worker Auditing
    const swSupported = 'serviceWorker' in navigator;
    let swRegistrationsCount = 0;
    let swActiveState: AdvancedAuditResult['swActiveState'] = 'NOT_FOUND';
    let swIsController = false;
    let swClaimed = false;

    if (swSupported) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swRegistrationsCount = registrations.length;
        if (swRegistrationsCount > 0) {
          const activeReg = registrations.find(r => r.active || r.waiting || r.installing);
          if (activeReg) {
            swActiveState = activeReg.active ? 'ACTIVE' : 'PENDING';
            swClaimed = !!navigator.serviceWorker.controller;
          }
        }
        swIsController = !!navigator.serviceWorker.controller;
      } catch (err) {
        console.error("Erro ao verificar registros do Service Worker:", err);
      }
    } else {
      swActiveState = 'UNSUPPORTED';
    }

    // 3. HashRouter Checking
    const isHashRouterActive = window.location.hash.startsWith('#/') || window.location.href.includes('#/');
    let hashRouterImpact = 'Nenhum impacto prejudicial directo.';
    if (isHashRouterActive) {
      hashRouterImpact = 'A presença de HashRouter ("#/") é aceita pelo Chromium, mas certifique-se de que o PWA start_url no Manifesto esteja definido exatamente como "/" (ou link raiz), nunca incluindo fragmentos de hash que mudam de estado.';
    }

    // 4. Icons Health Audit
    const iconsToAudit = [
      { path: '/pwa-192x192.png', width: 192, height: 192 },
      { path: '/pwa-512x512.png', width: 512, height: 512 },
      { path: '/maskable-icon-512x512.png', width: 512, height: 512 }
    ];
    
    const iconAudits = await Promise.all(
      iconsToAudit.map(ic => auditSingleIcon(ic.path, ic.width, ic.height))
    );

    // Identify Overall installability status
    let overallInstallability: AdvancedAuditResult['overallInstallability'] = 'EVALUATING';
    const suggestedFixes: string[] = [];

    if (!isSecureContext && protocol !== 'https:' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
      overallInstallability = 'BLOCKED';
      suggestedFixes.push('O PWA exige um contexto HTTPS seguro ou localhost para disponibilizar instalação no sistema.');
    }

    if (isIframe) {
      overallInstallability = 'BLOCKED';
      suggestedFixes.push('O Chromium desabilita a instalação automática de PWAs de forma implícita e rígida quando o código está rodando encapsulado dentro de Frames/Iframes (Sandbox de Segurança).');
    }

    if (!manifestFound) {
      overallInstallability = 'BLOCKED';
      suggestedFixes.push('O arquivo do manifesto PWA "manifest.json" não foi localizado na raiz do servidor.');
    } else {
      if (!manifestShortName && !manifestAppName) {
        suggestedFixes.push('O manifest.json deve especificar "name" ou "short_name" para identificação da marca.');
      }
      if (manifestDisplay !== 'standalone' && manifestDisplay !== 'fullscreen' && manifestDisplay !== 'minimal-ui') {
        suggestedFixes.push('O manifesto "display" deve ser configurado como "standalone", "fullscreen" ou "minimal-ui" para habilitar modo app nativo.');
      }
    }

    if (swSupported && swRegistrationsCount === 0) {
      suggestedFixes.push('Nenhum Service Worker está registrado ou ativo e claim em segundo plano. Sem SW ativo, o PWA não é indexado como offline-ready.');
    }

    const badIcon = iconAudits.some(ia => !ia.ok);
    if (badIcon) {
      suggestedFixes.push('Pelo menos um ícone essencial está ausente ou possui dimensões físicas incorretas em relação às declaradas no manifesto.');
    }

    if (suggestedFixes.length === 0) {
      if (hasPrompt) {
        overallInstallability = 'INSTALLABLE';
      } else {
        overallInstallability = 'EVALUATING';
      }
    } else {
      overallInstallability = 'BLOCKED';
    }

    const auditData: AdvancedAuditResult = {
      isSecureContext,
      protocol,
      isIframe,
      browserPromptSupported,
      promptEventStatus,
      manifestFound,
      manifestHttpStatus,
      manifestAppName,
      manifestShortName,
      manifestStartUrl,
      manifestScope,
      manifestDisplay,
      manifestOrientation,
      manifestThemeColor,
      swSupported,
      swRegistrationsCount,
      swActiveState,
      swIsController,
      swClaimed,
      isHashRouterActive,
      hashRouterImpact,
      iconAudits,
      overallInstallability,
      suggestedFixes
    };

    setPwaAudit(auditData);
    setIsAuditing(false);

    // Dynamic advanced console reports
    console.group('%c StarFit PWA Advanced Diagnostic Engine ', 'background: #102216; color: #13ec5b; font-weight: bold; font-size: 13px; padding: 4px; border: 1px solid #3a5543; border-radius: 4px;');
    console.log(`[STATUS] Overall Installability: ${overallInstallability}`);
    console.log(`[HTTPS] Secure Context: ${isSecureContext ? 'SIM' : 'NÃO'} (${protocol})`);
    console.log(`[IFRAME] Nesting Detected: ${isIframe ? 'SIM (Instalação nativa desabilitada neste frame)' : 'NÃO (Ambiente nativo)'}`);
    console.log(`[MANIFEST] OK: ${manifestFound} Status: ${manifestHttpStatus}`);
    console.log(`[SERVICE WORKER] Registrado: ${swRegistrationsCount} | Ativo: ${swActiveState} | Controller: ${swIsController ? 'SIM' : 'NÃO'}`);
    console.log(`[HASHROUTER] Ativo: ${isHashRouterActive}`);
    console.log(`[PROMPT] beforeinstallprompt Event Captured: ${hasPrompt ? 'SIM' : 'NÃO'}`);
    if (suggestedFixes.length > 0) {
      console.warn('[REQUISITOS EM FALTA]', suggestedFixes);
    }
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

    // 2. Discover Platform
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

    // Check dismissed stashes
    const isDismissed = localStorage.getItem('pwa-dashboard-banner-dismissed') === 'true';
    if (isDismissed) {
      setShowBanner(false);
    }

    // 3. Event handler for capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      runPWAAudit(promptEvent);
    };

    const handleCustomPromptFired = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setDeferredPrompt(customEvent.detail);
        runPWAAudit(customEvent.detail);
      }
    };

    // Stashed prompt loader
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
    
    const promptEvent = deferredPrompt || (window as any).globalDeferredPrompt;
    
    // Auto-update audit values
    runPWAAudit(promptEvent);

    if (platform === 'ios') {
      setShowHelp(true);
      return;
    }

    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then(({ outcome }: { outcome: string }) => {
        if (outcome === 'accepted') {
          setIsStandalone(true);
          localStorage.setItem('pwa-dashboard-banner-dismissed', 'true');
          setShowBanner(false);
        }
      }).catch((err: any) => {
        console.error("PWA Prompt trigger error:", err);
        setErrorMessage(`Falha mecânica ao lançar instalador nativo: ${err.message || err}`);
      });
    } else {
      const isRealIframe = window.self !== window.top;
      if (isRealIframe) {
        setErrorMessage("Aviso de IFrame: Este painel de visualização local está encapsulado por um frame. Acesse o StarFit em uma nova aba para testar a instalação imediata do PWA clicando no link do topo do seu navegador.");
      } else {
        setErrorMessage("Aguardando evento do navegador. O Service Worker offline está mapeando os arquivos do seu aplicativo em background. Clique em 'Realizar Auditoria PWA' para verificar se há alguma diretriz pendente.");
      }
      setShowDiagnostics(true);
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
        id="pwa-dashboard-banner"
        initial={{ opacity: 0, scale: 0.98, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        className="w-full relative bg-gradient-to-br from-background-dark via-[#1a2c20]/60 to-background-dark border border-primary/20 rounded-2xl p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden mb-6 z-30 text-left"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-green-900/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          id="pwa-close-btn"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-text-secondary hover:text-white p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer z-10"
          title="Dispensar recomendação"
        >
          <span className="material-symbols-outlined text-lg select-none">close</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Info Columns */}
          <div className="lg:col-span-8 flex flex-col items-start gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] uppercase font-bold tracking-widest bg-primary/10 text-primary border border-primary/30 px-3 py-1 rounded-full shrink-0">
                ⭐ StarFit Ecosystem
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest bg-white/5 text-text-secondary border border-white/5 px-3 py-1 rounded-full shrink-0">
                SUPORTE: {platform === 'ios' ? 'iOS & Safari' : platform === 'android' ? 'Android Chrome' : platform === 'windows' ? 'Microsoft Windows' : 'Nativo Mobile/Desktop'}
              </span>
              <button
                id="pwa-audit-pill-btn"
                onClick={() => {
                  setShowDiagnostics(true);
                  runPWAAudit(deferredPrompt || (window as any).globalDeferredPrompt);
                }}
                className="text-[9px] hover:text-primary transition-colors flex items-center gap-1 uppercase font-bold tracking-wider underline cursor-pointer"
              >
                🔬 Executar Diagnósticos
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-normal flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px]">install_mobile</span>
                Instale o StarFit na Tela Inicial
              </h2>
              <p className="text-text-secondary text-xs sm:text-sm leading-relaxed max-w-2xl font-light">
                Utilize nossa plataforma em desempenho máximo, com inicialização fluida e instantânea direto da sua área de trabalho. Substitui a navegação do navegador por controles 100% nativos e fluidez estática offline.
              </p>
            </div>
          </div>

          {/* Setup Trigger Column */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end w-full">
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col items-center gap-4 w-full max-w-[280px] hover:border-primary/10 transition-colors">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-green-700 p-0.5 flex items-center justify-center shadow-lg shadow-primary/25">
                <div className="w-full h-full bg-background-dark rounded-[14px] flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl fill select-none">fitness_center</span>
                </div>
              </div>

              <div className="flex flex-col gap-0.5 text-center">
                <span className="text-white font-bold text-sm tracking-tight">Ecosystem Pack</span>
                <span className="text-[10px] text-text-secondary tracking-wide">PWA offline-ready ativo</span>
              </div>

              <button
                id="pwa-primary-install-btn"
                onClick={handleInstallClick}
                className="w-full bg-primary text-background-dark font-black h-11 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all text-xs uppercase tracking-wider shadow-md hover:shadow-primary/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] select-none">download</span>
                Instalar no Dispositivo
              </button>
            </div>
          </div>
        </div>

        {/* Error reporting and helpful diagnostics */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300 flex flex-col gap-2"
          >
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-orange-400 text-sm select-none shrink-0 mt-0.5">warning</span>
              <p className="leading-relaxed font-light">{errorMessage}</p>
            </div>
          </motion.div>
        )}

        {/* Dynamic Auditing Dashboard panel */}
        {showDiagnostics && (
          <motion.div
            id="pwa-diagnostics-dashboard"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-white/5 pt-5 mt-6 flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.01] p-4 border border-white/5 rounded-xl">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm select-none">analytics</span>
                  Painel de Auditoria PWA & Critérios de Instalação (Chromium Spec)
                </h3>
                <p className="text-[10px] text-text-secondary">Informações de telemetria estática para validar a instalabilidade técnica.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="pwa-run-audit-btn"
                  onClick={() => runPWAAudit(deferredPrompt || (window as any).globalDeferredPrompt)}
                  disabled={isAuditing}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 active:scale-[0.97] rounded-lg text-[10px] uppercase font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isAuditing ? 'Auditando...' : 'Recarregar Auditoria'}
                </button>
                <button
                  id="pwa-hide-panel-btn"
                  onClick={() => setShowDiagnostics(false)}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-[10px] uppercase font-bold text-primary transition-all cursor-pointer"
                >
                  Ocultar Painel
                </button>
              </div>
            </div>

            {pwaAudit ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Environment & Prompt Diagnostics */}
                <div className="bg-background-dark/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                  <h4 className="text-white font-bold text-[11px] uppercase tracking-wider border-b border-white/5 pb-2 flex items-center justify-between">
                    <span>1. Sistema & Prompt</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      pwaAudit.promptEventStatus === 'CAPTURED' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {pwaAudit.promptEventStatus}
                    </span>
                  </h4>
                  <ul className="space-y-2 text-[11px] text-text-secondary font-mono leading-none">
                    <li className="flex items-center justify-between">
                      <span>Origem Segura (HTTPS):</span>
                      <span className={pwaAudit.isSecureContext ? 'text-primary' : 'text-orange-400'}>
                        {pwaAudit.isSecureContext ? 'SIM' : 'NÃO/LOCAL'} ({pwaAudit.protocol})
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Ambiente Sandbox Iframe:</span>
                      <span className={pwaAudit.isIframe ? 'text-red-400 font-bold' : 'text-primary'}>
                        {pwaAudit.isIframe ? 'SIM (BLOQUEADO)' : 'NÃO (NATIVO)'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Suporte Nativo Prompt:</span>
                      <span className={pwaAudit.browserPromptSupported ? 'text-primary' : 'text-orange-400'}>
                        {pwaAudit.browserPromptSupported ? 'SIM' : 'NÃO CONSTATADO'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Modo Standalone:</span>
                      <span className={isStandalone ? 'text-primary' : 'text-text-secondary'}>
                        {isStandalone ? 'SIM (INSTALADO)' : 'NÃO (NAVEGADOR)'}
                      </span>
                    </li>
                  </ul>
                  <div className="mt-1 p-2 bg-white/[0.02] rounded-lg text-[9px] leading-relaxed text-text-secondary font-light border border-white/5">
                    <strong>Motivo da Instalação Trancada:</strong> {
                      pwaAudit.isIframe 
                        ? 'O Chromium bloqueia disparos de prompts PWA de forma intencional e estrita dentro de tags frame (iframe). Acesse a URL raiz fora da visualização local do AI Studio.'
                        : pwaAudit.promptEventStatus === 'CAPTURED'
                          ? 'Nenhum bloqueio. Prompt nativo capturado e pronto para disparo.'
                          : 'O evento nativo de prompt do Chromium (beforeinstallprompt) ainda está pendente ou não foi emitido. Isso é normal nas primeiras visitas de carga ou se o App já estiver instalado no dispositivo.'
                    }
                  </div>
                </div>

                {/* 2. Web Manifest Diagnostics */}
                <div className="bg-background-dark/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                  <h4 className="text-white font-bold text-[11px] uppercase tracking-wider border-b border-white/5 pb-2 flex items-center justify-between">
                    <span>2. Web App Manifest</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      pwaAudit.manifestFound ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {pwaAudit.manifestFound ? 'CONFIGURADO' : 'AUSENTE'}
                    </span>
                  </h4>
                  <ul className="space-y-2 text-[11px] text-text-secondary font-mono leading-none">
                    <li className="flex items-center justify-between">
                      <span>manifest.json:</span>
                      <span className={pwaAudit.manifestFound ? 'text-primary' : 'text-red-500'}>
                        {pwaAudit.manifestHttpStatus}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Nome do App:</span>
                      <span className="text-white truncate max-w-[140px]" title={pwaAudit.manifestAppName}>
                        {pwaAudit.manifestAppName || 'N/A'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Nome Curto (short):</span>
                      <span className="text-white truncate max-w-[140px] font-bold">
                        {pwaAudit.manifestShortName || 'N/A'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Start URL:</span>
                      <span className={pwaAudit.manifestStartUrl === '/' ? 'text-primary' : 'text-amber-400'}>
                        "{pwaAudit.manifestStartUrl || 'N/A'}"
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>App Scope:</span>
                      <span className="text-white">"{pwaAudit.manifestScope || 'N/A'}"</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Modo Display:</span>
                      <span className={pwaAudit.manifestDisplay === 'standalone' ? 'text-primary' : 'text-amber-400'}>
                        {pwaAudit.manifestDisplay || 'N/A'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Cor de Fundo:</span>
                      <span className="text-white font-bold" style={{ color: pwaAudit.manifestThemeColor || '#ffffff' }}>
                        {pwaAudit.manifestThemeColor || 'N/A'}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* 3. Service Worker Life & Scope */}
                <div className="bg-background-dark/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                  <h4 className="text-white font-bold text-[11px] uppercase tracking-wider border-b border-white/5 pb-2 flex items-center justify-between">
                    <span>3. Service Worker Spec</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      pwaAudit.swActiveState === 'ACTIVE' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-amber-500'
                    }`}>
                      {pwaAudit.swActiveState}
                    </span>
                  </h4>
                  <ul className="space-y-2 text-[11px] text-text-secondary font-mono leading-none">
                    <li className="flex items-center justify-between">
                      <span>Suporte em navegador:</span>
                      <span className={pwaAudit.swSupported ? 'text-primary' : 'text-red-500'}>
                        {pwaAudit.swSupported ? 'ATIVO' : 'NÃO'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Registros Totais:</span>
                      <span className="text-white font-bold">{pwaAudit.swRegistrationsCount}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Status Ativo:</span>
                      <span className={pwaAudit.swActiveState === 'ACTIVE' ? 'text-primary' : 'text-orange-400'}>
                        {pwaAudit.swActiveState}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Page Controlling:</span>
                      <span className={pwaAudit.swIsController ? 'text-primary' : 'text-amber-400 font-bold'}>
                        {pwaAudit.swIsController ? 'SIM (CONTROLADO)' : 'NÃO CONTROLADO'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Clientes Atribuídos:</span>
                      <span className={pwaAudit.swClaimed ? 'text-primary' : 'text-text-secondary'}>
                        {pwaAudit.swClaimed ? 'Ativos (clientsClaim)' : 'Não detectado'}
                      </span>
                    </li>
                  </ul>
                  <div className="mt-1 p-2 bg-white/[0.02] rounded-lg text-[9px] leading-relaxed text-text-secondary font-light border border-white/5">
                    <strong>Router:</strong> {pwaAudit.isHashRouterActive ? 'React HashRouter ativo (#/).' : 'BrowserRouter convencional ativo.'} {pwaAudit.hashRouterImpact}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-text-secondary">
                Aguardando finalização do ciclo de auditoria em tempo real...
              </div>
            )}

            {/* 4. Icon Validation Box */}
            {pwaAudit && (
              <div className="bg-background-dark/40 p-4 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-between border-b border-white/5 pb-2">
                  <span>4. Auditoria de Dependências de Ícones do Manifesto</span>
                  <span className="text-[10px] text-text-secondary">Análise de existência física (HTTP 200) e integridade dimensional</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {pwaAudit.iconAudits.map((ia, index) => (
                    <div key={index} className="bg-background-dark p-3 rounded-lg border border-white/5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] text-white font-bold tracking-tight">{ia.src}</span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-black ${
                          ia.ok ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {ia.ok ? 'INTEGRO' : 'ERRO'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 text-[10px] font-mono text-text-secondary">
                        <span>Esperado:</span>
                        <span className="text-white text-right font-bold">{ia.expectedSize}</span>
                        <span>Físico:</span>
                        <span className={`text-right font-bold ${ia.ok ? 'text-primary' : 'text-red-400'}`}>{ia.dimensions}</span>
                        <span>Mimetype:</span>
                        <span className="text-white text-right">{ia.format}</span>
                        <span>HTTP Res:</span>
                        <span className={`text-right ${ia.status.includes('200') ? 'text-primary' : 'text-red-400'}`}>{ia.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Recommended Fixes Checklist */}
            {pwaAudit && pwaAudit.suggestedFixes.length > 0 ? (
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                <h4 className="text-red-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 leading-none">
                  <span className="material-symbols-outlined text-sm select-none">report_problem</span>
                  Requisitos Pendentes Corrigidos ou Impeditivos Ativos ({pwaAudit.suggestedFixes.length})
                </h4>
                <ul className="list-disc pl-4 text-[11px] text-red-200/80 space-y-1">
                  {pwaAudit.suggestedFixes.map((fix, idx) => (
                    <li key={idx} className="font-light leading-relaxed">{fix}</li>
                  ))}
                </ul>
              </div>
            ) : pwaAudit ? (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-base select-none shrink-0 mt-0.5 font-bold">check_circle</span>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-primary font-bold text-[11px] uppercase tracking-wider leading-none">Auditoria de Carga 100% Aprovada!</h4>
                  <p className="text-[10px] text-white leading-relaxed font-light">Todas as especificações Chromium estão atendidas perfeitamente (Servidor Seguro, Manifesto OK, Service Worker offlineClaim configurado, ícones de marca íntegros). O aplicativo StarFit está qualificado como instalável nativo no dispositivo.</p>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* iOS Manual Step Help Guide */}
        {showHelp && platform === 'ios' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-white/5 pt-4 mt-6 flex flex-col gap-3"
          >
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase italic">
                  <span className="material-symbols-outlined text-primary text-base select-none">help_outline</span>
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
                    <span className="un-badge-number">1</span>
                    Passo 1
                  </p>
                  <p>
                    Abra o StarFit em seu Safari. Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com flecha para cima no menu inferior).
                  </p>
                </div>
                <div className="bg-background-dark/40 p-3 rounded-lg border border-white/5">
                  <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <span className="un-badge-number font">2</span>
                    Passo 2
                  </p>
                  <p>
                    Role por entre as opções para baixo até encontrar e selecionar a opção <strong>"Adicionar à Tela de Início"</strong>.
                  </p>
                </div>
                <div className="bg-background-dark/40 p-3 rounded-lg border border-white/5">
                  <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <span className="un-badge-number font">3</span>
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
