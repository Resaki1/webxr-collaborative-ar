import "./DomOverlay.css";

interface DomOverlayProps {
  calibrating: Boolean;
  //setCalibrating: React.Dispatch<React.SetStateAction<boolean>>;
  calibrate: () => void;
}

const DomOverlay = (props: DomOverlayProps) => {
  return (
    <div id="overlay">
      {props.calibrating ? (
        <>
          <div className="instructions">
            place the two objects at the same positions as your friend did to
            calibrate!
          </div>
          <button className="calibrateButton" onClick={props.calibrate}>
            calibrate
          </button>
        </>
      ) : (
        "calibrated! :)"
      )}
    </div>
  );
};

export default DomOverlay;
