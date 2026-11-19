import "./Atmosphere.css";

// Let the dashboard control whether the introductory glow orbs are visible.
type AtmosphereProps = {
  showOrbs: boolean;
};

// Keep all background decoration outside the accessibility tree.
export default function Atmosphere({ showOrbs }: AtmosphereProps) {
  return (
    <div className="atmosphere" aria-hidden="true">
      {/* Render moving glow orbs only on the initial dashboard. */}
      {showOrbs && (
        <>
          <span className="atmosphere__orb atmosphere__orb--blue" />
          <span className="atmosphere__orb atmosphere__orb--violet" />
          <span className="atmosphere__orb atmosphere__orb--cyan" />
          <span className="atmosphere__orb atmosphere__orb--pink" />
          <span className="atmosphere__orb atmosphere__orb--mint" />
        </>
      )}

      {/* CSS reveals these independent twinkling layers only at night. */}
      <span className="atmosphere__stars atmosphere__stars--near" />
      <span className="atmosphere__stars atmosphere__stars--far" />
    </div>
  );
}
