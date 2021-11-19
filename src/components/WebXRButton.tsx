import React from "react";
// @ts-ignore
import type { XRSystem, XRSession } from "@types/webxr";

interface WebXRButtonProps {
  initXR: () => void;
}

const WebXRButton = (props: WebXRButtonProps) => {
  return <button onClick={props.initXR}>start</button>;
};

export default WebXRButton;
