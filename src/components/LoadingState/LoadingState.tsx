import "./LoadingState.css";

// Let the parent’s live region announce the message once.
export default function LoadingState({ message }: { message: string }) {
  return (
    <div className="loading-state">
      <div className="loading-state__label">
        <img src="/favicon.svg" alt="" width={32} height={32} />
        <p>{message}</p>
      </div>
      <div className="loading-state__track" aria-hidden="true">
        <span className="loading-state__fill" />
      </div>
    </div>
  );
}
