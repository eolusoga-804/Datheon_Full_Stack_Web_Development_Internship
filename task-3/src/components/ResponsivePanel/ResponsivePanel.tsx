import { useId, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./ResponsivePanel.css";

// Share the desktop breakpoint used by the dashboard columns.
const DESKTOP_QUERY = "(min-width: 64rem)";

// Notify React whenever the panel switches between collapsible and desktop layouts.
function subscribeToLayout(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function isDesktopLayout() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

// Keep this surface reusable for other dashboard sections.
type ResponsivePanelProps = {
  title: string;
  headingId: string;
  className?: string;
  children: ReactNode;
};

// Preserve mounted content so collapsing does not restart API requests.
export default function ResponsivePanel({
  title,
  headingId,
  className = "",
  children,
}: ResponsivePanelProps) {
  const [expanded, setExpanded] = useState(true);
  const isDesktop = useSyncExternalStore(subscribeToLayout, isDesktopLayout);
  const bodyId = useId();
  const showContent = isDesktop || expanded;

  return (
    <section
      className={`dashboard__panel responsive-panel ${className}`}
      aria-labelledby={headingId}
    >
      {/* Native button behavior supports keyboard, pointer, and touch activation. */}
      <h2 id={headingId} className="text-lg font-semibold">
        <button
          type="button"
          className="responsive-panel__toggle"
          aria-expanded={showContent}
          aria-controls={bodyId}
          disabled={isDesktop}
          onClick={() => setExpanded((previous) => !previous)}
        >
          <span>{title}</span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="responsive-panel__chevron"
            aria-hidden="true"
          />
        </button>
      </h2>

      {/* Hidden content remains mounted while leaving keyboard navigation. */}
      <div id={bodyId} className="responsive-panel__body" hidden={!showContent}>
        {children}
      </div>
    </section>
  );
}
