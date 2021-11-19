import React from "react";
import type {
  XRFrame,
  XRHitTestSource,
  XRReferenceSpace,
  XRRigidTransform,
  XRSession,
  XRSystem,
  XRWebGLLayer,
} from "webxr";
// @ts-ignore
import { Quaternion } from "quaternion";
// @ts-ignore
import type { AbsoluteOrientationSensor } from "w3c-generic-sensor";

import "./App.css";
import { Scene } from "./renderer/scenes/scene.js";
import { Renderer, createWebGLContext } from "./renderer/core/renderer.js";
import WebXRButton from "./components/WebXRButton";
import { getOrientationAbs } from "./ts/quaternionToEuler";

interface AppProps {}

function App({}: AppProps) {
  const scene = new Scene();
  let xrViewerSpace: XRReferenceSpace;
  let xrRefSpace: XRReferenceSpace;
  let xrHitTestSource: XRHitTestSource;

  // absolute orientation sensor
  const options = { frequency: 60, referenceFrame: "device" };
  // @ts-ignore
  const sensor = new AbsoluteOrientationSensor(options);

  const xr = (navigator as any)?.xr as XRSystem;

  const initXR = async () => {
    sensor.start();

    if (await xr?.isSessionSupported("immersive-ar"))
      xr.requestSession("immersive-ar", {
        requiredFeatures: ["local", "hit-test", "anchors", "depth-sensing"],
        depthSensing: {
          usagePreference: ["cpu-optimized", "gpu-optimized"],
          dataFormatPreference: ["luminance-alpha", "float32"],
        },
      }).then((session) => {
        onSessionStarted(session);
      });
  };

  const onSessionStarted = (session: XRSession) => {
    //session.addEventListener("select", onSelected);

    const gl = createWebGLContext({ xrCompatible: true });
    if (gl) {
      const renderer = new Renderer(gl);
      scene.setRenderer(renderer);

      session.updateRenderState({
        // @ts-ignore
        baseLayer: new XRWebGLLayer(session, gl as WebGLRenderingContext),
        depthFar: 1000,
        depthNear: 0.1,
      });

      session.requestReferenceSpace("viewer").then((refSpace) => {
        xrViewerSpace = refSpace;
        if (session.requestHitTestSource)
          session
            .requestHitTestSource({ space: xrViewerSpace })
            .then((hitTestSource) => (xrHitTestSource = hitTestSource));
      });

      session.requestReferenceSpace("local").then((refSpace) => {
        xrRefSpace = refSpace;

        // rotate refSpace to match absolute orientation
        const rotationQuaternion = Quaternion.fromEuler(
          0,
          0,
          -1 * getOrientationAbs(sensor.quaternion),
        );

        xrRefSpace = xrRefSpace.getOffsetReferenceSpace(
          // @ts-ignore
          new XRRigidTransform({}, rotationQuaternion),
        );

        session.requestAnimationFrame(onXRFrame);
      });
    }
  };

  const onXRFrame = (t: number, frame: XRFrame) => {
    let session = frame.session;
    console.log(t, "session started:", session);

    session.requestAnimationFrame(onXRFrame);
  };

  return (
    <div className="App">
      <WebXRButton initXR={initXR} />
    </div>
  );
}

export default App;
