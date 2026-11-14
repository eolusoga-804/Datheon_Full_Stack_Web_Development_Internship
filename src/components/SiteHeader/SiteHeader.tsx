import "./SiteHeader.css";

// Use the same brand mark in the header and browser tab.
export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__surface flex items-center gap-2">
        <img
          src="/favicon.svg"
          alt=""
          width={40}
          height={40}
          className="shrink-0"
        />
        <h1 className="text-xl font-bold">MyForecast</h1>
      </div>
    </header>
  );
}
