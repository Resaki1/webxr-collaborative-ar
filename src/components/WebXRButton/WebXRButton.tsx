import React from "react";
import "./WebXRButton.css";
// @ts-ignore
import type { XRSystem, XRSession } from "@types/webxr";

interface WebXRButtonProps {
  initXR: () => void;
}

const WebXRButton = (props: WebXRButtonProps) => {
  return (
    <button className="xrButton" onClick={props.initXR}>
      ENTER AR
    </button>
  );
};

export default WebXRButton;
