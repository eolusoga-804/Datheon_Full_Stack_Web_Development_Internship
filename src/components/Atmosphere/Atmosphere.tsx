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

      {/* Show two additional cool-colored glows during sunny daytime conditions. */}
      <span className="atmosphere__orb atmosphere__orb--light-blue" />
      <span className="atmosphere__orb atmosphere__orb--sky-blue" />

      {/* Separate star layers so their brightness changes at different times. */}
      <span className="atmosphere__stars atmosphere__stars--near" />
      <span className="atmosphere__stars atmosphere__stars--far" />
    </div>
  );
}
