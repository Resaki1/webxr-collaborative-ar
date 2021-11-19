import React from "react";
import "./DomOverlay.css";

interface DomOverlayProps {
  calibrating: Boolean;
  //setCalibrating: React.Dispatch<React.SetStateAction<boolean>>;
}

const DomOverlay = (props: DomOverlayProps) => {
  return (
    <div id="overlay">
      {props.calibrating ? "calibrating..." : "calibrated! :)"}
    </div>
  );
};

export default DomOverlay;
