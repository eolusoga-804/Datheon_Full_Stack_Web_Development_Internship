import { useEffect, useState } from "react";
import "./InstallInvitation.css";

const DISMISSAL_KEY = "myforecast:install-dismissed";

interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
}

function readDismissal() {
  try {
    return localStorage.getItem(DISMISSAL_KEY) === "yes";
  } catch {
    return false;
  }
}

function isStandalone() {
  const device = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    device.standalone === true
  );
}

export default function InstallInvitation({ paused }: { paused: boolean }) {
  const [dismissed, setDismissed] = useState(readDismissal);
  const [standalone, setStandalone] = useState(isStandalone);
  const [pendingPrompt, setPendingPrompt] = useState<InstallPromptEvent | null>(
    null,
  );
  const [isPrompting, setIsPrompting] = useState(false);
  const [promptFailed, setPromptFailed] = useState(false);

  // iPad can report a desktop user agent even when it uses iPadOS.
  const isAppleMobile =
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  // Capture browser eligibility while the name dialog is open, too.
  useEffect(() => {
    if (dismissed || standalone) return;

    function capturePrompt(event: Event) {
      event.preventDefault();
      setPendingPrompt(event as InstallPromptEvent);
    }

    function handleInstalled() {
      setStandalone(true);
      setPendingPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [dismissed, standalone]);

  function dismiss() {
    setDismissed(true);

    try {
      localStorage.setItem(DISMISSAL_KEY, "yes");
    } catch {
      // Keep the dismissal for this visit when storage is unavailable.
    }
  }

  async function install() {
    if (!pendingPrompt || isPrompting) return;

    setIsPrompting(true);

    try {
      await pendingPrompt.prompt();
      dismiss();
    } catch {
      setPromptFailed(true);
    } finally {
      // Each browser prompt can be used once.
      setPendingPrompt(null);
      setIsPrompting(false);
    }
  }

  if (paused || dismissed || standalone) return null;
  if (!pendingPrompt && !isAppleMobile && !promptFailed) return null;

  return (
    <div className="install-invitation">
      <p className="dashboard__description text-sm">
        {pendingPrompt
          ? "Open MyForecast in its own window."
          : isAppleMobile
            ? "In Safari, tap Share, then Add to Home Screen."
            : "Use your browser menu to install MyForecast if the option is available."}
      </p>

      <div className="flex flex-wrap gap-2">
        {pendingPrompt && (
          <button
            type="button"
            className="install-invitation__install"
            onClick={install}
            disabled={isPrompting}
          >
            Install MyForecast
          </button>
        )}
        <button
          type="button"
          className="min-h-11 rounded-full border border-white/30 px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={dismiss}
        >
          Dismiss install invitation
        </button>
      </div>
    </div>
  );
}
