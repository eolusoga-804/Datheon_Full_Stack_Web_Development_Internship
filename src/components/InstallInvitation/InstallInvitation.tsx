import { useEffect, useState } from "react";
// Render outside glass panels so their backdrop filters cannot contain the popup.
import { createPortal } from "react-dom";
import "./InstallInvitation.css";

// Remember installation separately from the current page's popup dismissal.
const INSTALLED_KEY = "myforecast:installed";

interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
}

function isStandalone() {
  const device = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    device.standalone === true
  );
}

// Hide the invitation when launched as an app or when installation was recorded.
function readInstalled() {
  if (isStandalone()) return true;

  try {
    return localStorage.getItem(INSTALLED_KEY) === "yes";
  } catch {
    return false;
  }
}

// Keep installation memory optional when browser storage is unavailable.
function rememberInstallation() {
  try {
    localStorage.setItem(INSTALLED_KEY, "yes");
  } catch {
    // Standalone detection and component state still apply for this visit.
  }
}

export default function InstallInvitation({ paused }: { paused: boolean }) {
  // Reset dismissal on reload while preserving known installation status.
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(readInstalled);

  const [pendingPrompt, setPendingPrompt] = useState<InstallPromptEvent | null>(
    null,
  );
  const [isPrompting, setIsPrompting] = useState(false);
  const [promptFailed, setPromptFailed] = useState(false);

  // iPad can report a desktop user agent even when it uses iPadOS.
  const isAppleMobile =
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  // Monitor installation even after the user dismisses the custom invitation.
  useEffect(() => {
    if (isStandalone()) rememberInstallation();

    function capturePrompt(event: Event) {
      event.preventDefault();
      setPendingPrompt(event as InstallPromptEvent);
    }

    function handleInstalled() {
      rememberInstallation();
      setInstalled(true);
      setPendingPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  // Hide the invitation for this page load without permanently dismissing it.
  function dismiss() {
    setDismissed(true);
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

  // Suppress the invitation after dismissal or a detected installation.
  if (paused || dismissed || installed) return null;

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
