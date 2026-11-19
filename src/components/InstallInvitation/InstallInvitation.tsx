import { useEffect, useState } from "react";
// Render outside glass panels so their backdrop filters cannot contain the popup.
import { createPortal } from "react-dom";
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

  // Keep installation optional without blocking dashboard interaction or moving focus.
  return createPortal(
    <aside
      className="install-invitation"
      aria-labelledby="install-invitation-heading"
    >
      <h2 id="install-invitation-heading" className="text-sm font-medium">
        Take MyForecast with you
      </h2>

      {/* Show installation guidance appropriate to the browser's capabilities. */}
      <p className="dashboard__description text-sm">
        {pendingPrompt
          ? "Install for quick access in its own window."
          : isAppleMobile
            ? "In Safari, tap Share, then Add to Home Screen."
            : "Use your browser menu to install MyForecast if available."}
      </p>

      <div className="install-invitation__actions">
        {pendingPrompt && (
          <button
            type="button"
            className="install-invitation__install"
            onClick={install}
            disabled={isPrompting}
          >
            {isPrompting ? "Opening…" : "Install MyForecast"}
          </button>
        )}

        {/* Let users dismiss the popup without interrupting weather access. */}
        <button
          type="button"
          className="install-invitation__dismiss"
          onClick={dismiss}
        >
          Not now
        </button>
      </div>
    </aside>,
    document.body,
  );
}
