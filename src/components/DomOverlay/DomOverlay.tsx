import React from "react";
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
        <button className="calibrateButton" onClick={props.calibrate}>
          calibrate
        </button>
      ) : (
        "calibrated! :)"
      )}
    </div>
  );
};

export default DomOverlay;
