import "./Atmosphere.css";

// Keep the decorative background outside the accessibility tree.
export default function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <span className="atmosphere__orb atmosphere__orb--blue" />
      <span className="atmosphere__orb atmosphere__orb--violet" />
      <span className="atmosphere__orb atmosphere__orb--cyan" />
      <span className="atmosphere__orb atmosphere__orb--pink" />
      <span className="atmosphere__orb atmosphere__orb--mint" />
    </div>
  );
}
