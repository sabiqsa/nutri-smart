"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/Icon/Icon";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "nutrismart:install-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY) === "1") {
      return;
    }
    // One-time bootstrap from browser APIs (matchMedia/localStorage) that
    // don't exist during SSR — an Effect is the correct place for this.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(false);

    if (isIos()) {
      setShowIosHint(true);
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (dismissed || (!deferredPrompt && !showIosHint)) {
    return null;
  }

  return (
    <div className="rounded-lg fixed inset-x-4 top-20 z-50 flex items-center gap-3 border border-outline-variant bg-surface-container-lowest p-3 shadow-lg md:top-auto md:bottom-4 md:left-auto md:right-4 md:w-80">
      <Icon name="download" className="shrink-0 text-primary" size={20} />
      <div className="flex-1 text-sm">
        {showIosHint ? (
          <p>
            Install NutriSmart: tap <strong>Share</strong> lalu <strong>Add to Home Screen</strong>.
          </p>
        ) : (
          <p>Install NutriSmart buat akses lebih cepat, bisa dipakai offline.</p>
        )}
      </div>
      {deferredPrompt ? (
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-lg shrink-0 bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary"
        >
          Install
        </button>
      ) : null}
      <button type="button" onClick={dismiss} aria-label="Tutup" className="shrink-0 text-on-surface-variant">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
