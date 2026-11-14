import "./AnnouncementBar.css";

// Give the app announcement a consistent label and location.
export default function AnnouncementBar() {
  return (
    <p className="announcement-bar">
      <span className="announcement-bar__label">App note</span>
      {" · "}Forecasts use local time.
    </p>
  );
}
