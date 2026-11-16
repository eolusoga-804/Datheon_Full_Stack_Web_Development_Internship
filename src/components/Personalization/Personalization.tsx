import { useEffect, useRef, useState } from "react";
import "./Personalization.css";

const NAME_STORAGE_KEY = "myforecast:preferred-name";
const NAME_MAX_LENGTH = 40;

// An empty stored value records a skip. A missing value opens the first visit prompt.
function readPreferredName(): string | null {
  try {
    return (
      localStorage
        .getItem(NAME_STORAGE_KEY)
        ?.trim()
        .slice(0, NAME_MAX_LENGTH) ?? null
    );
  } catch {
    return null;
  }
}

export default function Personalization() {
  const [name, setName] = useState(readPreferredName);
  const [draft, setDraft] = useState(name ?? "");
  const [isOpen, setIsOpen] = useState(name === null);
  const [storageFailed, setStorageFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Use the native modal to contain focus and support Escape.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function savePreference(value: string) {
    setName(value);
    setIsOpen(false);

    try {
      localStorage.setItem(NAME_STORAGE_KEY, value);
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }

  function dismiss() {
    if (name === null) {
      savePreference("");
    } else {
      setIsOpen(false);
    }
  }

  return (
    <div className="personalization">
      {name && (
        <p className="text-sm">
          Welcome, <strong className="font-bold">{name}</strong>.
        </p>
      )}

      <button
        type="button"
        className="personalization__secondary"
        onClick={() => {
          setDraft(name ?? "");
          setIsOpen(true);
        }}
      >
        {name ? "Edit name" : "Add preferred name"}
      </button>

      {storageFailed && (
        <p className="dashboard__description text-xs" role="status">
          This preference applies to the current visit only.
        </p>
      )}

      <dialog
        ref={dialogRef}
        className="personalization__dialog"
        aria-labelledby="personalization-heading"
        onCancel={(event) => {
          event.preventDefault();
          dismiss();
        }}
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const value = draft.trim();
            if (value) savePreference(value);
          }}
        >
          <h2 id="personalization-heading" className="text-lg font-semibold">
            {name ? "Edit your preferred name" : "Welcome to MyForecast"}
          </h2>

          <label className="flex flex-col gap-1 text-sm">
            Preferred name
            <input
              className="personalization__input"
              type="text"
              autoComplete="nickname"
              maxLength={NAME_MAX_LENGTH}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="personalization__primary"
              disabled={!draft.trim()}
            >
              Save name
            </button>
            <button
              type="button"
              className="personalization__secondary"
              onClick={dismiss}
            >
              {name ? "Cancel" : "Skip for now"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
