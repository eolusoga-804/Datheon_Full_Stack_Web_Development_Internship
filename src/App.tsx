import "./App.css";

// Keep the introduction compact within the shared dashboard width.
export default function App() {
  return (
    <main className="mx-auto flex w-full max-w-[1140px] flex-col px-3 py-4 sm:px-4">
      <header className="dashboard__intro flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          {/* Share the favicon artwork so both versions match. */}
          <img
            src="/favicon.svg"
            alt=""
            width={40}
            height={40}
            className="shrink-0"
          />
          MyForecast
        </h1>
        <p className="dashboard__description text-sm">
          Weather forecasts and climate telemetry.
        </p>
      </header>
    </main>
  );
}
