import React from "react";
// @ts-ignore
import type { XRSystem, XRSession } from "@types/webxr";

interface WebXRButtonProps {
  onSessionStarted: (session: XRSession) => void;
}

const WebXRButton = (props: WebXRButtonProps) => {
  const xr = (navigator as any)?.xr as XRSystem;

  const handleClick = async () => {
    if (await xr?.isSessionSupported("immersive-ar"))
      xr.requestSession("immersive-ar", {
        requiredFeatures: ["local", "dom-overlay"],
        depthSensing: {
          usagePreference: ["cpu-optimized", "gpu-optimized"],
          dataFormatPreference: ["luminance-alpha", "float32"],
        },
      }).then((session) => {
        props.onSessionStarted(session);
      });
  };

  return <button onClick={handleClick}>start</button>;
};

export default WebXRButton;
