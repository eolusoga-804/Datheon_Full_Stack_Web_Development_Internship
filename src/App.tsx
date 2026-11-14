// Keep the dashboard frame compact and center it on wide screens.
export default function App() {
  return (
    <main className="mx-auto flex w-full max-w-[1140px] flex-col gap-1 px-3 py-4 sm:px-4">
      <h1 className="text-2xl font-bold">MyForecast</h1>
      <p className="text-sm">Weather forecasts and climate telemetry.</p>
    </main>
  );
}
