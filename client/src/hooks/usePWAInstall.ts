import { useEffect, useState } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
    __pwaInstallPromptActive?: boolean;
    __pwaInstallToastShown?: boolean;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform?: string;
  }>;
  prompt(): Promise<void>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as any).standalone === true;

const showInstalledToastOnce = () => {
  if (window.__pwaInstallToastShown) return;
  window.__pwaInstallToastShown = true;
  toast.success("School app installed successfully.");
};

const clearPrompt = () => {
  window.__pwaDeferredPrompt = null;
  window.dispatchEvent(new Event("pwaInstallPromptConsumed"));
};

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setIsInstalled(true);
      setCanInstall(false);
      return;
    }

    if (window.__pwaDeferredPrompt) {
      setDeferredPrompt(window.__pwaDeferredPrompt);
      setCanInstall(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      window.__pwaDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      clearPrompt();
      window.__pwaInstallPromptActive = false;
      setDeferredPrompt(null);
      showInstalledToastOnce();
    };

    const handlePromptConsumed = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    const handlePWAReady = (event: Event) => {
      const promptEvent = (event as CustomEvent<{ prompt?: BeforeInstallPromptEvent }>).detail?.prompt;
      if (promptEvent) {
        window.__pwaDeferredPrompt = promptEvent;
        setDeferredPrompt(promptEvent);
        setCanInstall(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pwaReadyToInstall", handlePWAReady as EventListener);
    window.addEventListener("pwaInstalled", handleAppInstalled);
    window.addEventListener("pwaInstallPromptConsumed", handlePromptConsumed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pwaReadyToInstall", handlePWAReady as EventListener);
      window.removeEventListener("pwaInstalled", handleAppInstalled);
      window.removeEventListener("pwaInstallPromptConsumed", handlePromptConsumed);
    };
  }, []);

  const promptInstall = async () => {
    if (isInstalled || isStandalone()) {
      setIsInstalled(true);
      setCanInstall(false);
      showInstalledToastOnce();
      return false;
    }

    if (window.__pwaInstallPromptActive) {
      return false;
    }

    const promptEvent = window.__pwaDeferredPrompt || deferredPrompt;

    if (!promptEvent) {
      setCanInstall(false);
      return false;
    }

    try {
      window.__pwaInstallPromptActive = true;
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      }

      clearPrompt();
      setDeferredPrompt(null);
      setCanInstall(false);
      return outcome === "accepted";
    } catch {
      clearPrompt();
      setDeferredPrompt(null);
      setCanInstall(false);
      return false;
    } finally {
      window.__pwaInstallPromptActive = false;
    }
  };

  return {
    canInstall: canInstall && !isInstalled,
    isInstalled,
    promptInstall,
  };
}
