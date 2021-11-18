import React from "react";
import "./App.css";
import { Scene } from "./renderer/scenes/scene.js";
import { Renderer, createWebGLContext } from "./renderer/core/renderer.js";
import WebXRButton from "./components/WebXRButton";
import type { XRHitTestSource, XRReferenceSpace, XRSession } from "webxr";
import { XRWebGLLayer } from "webxr";

interface AppProps {}

function App({}: AppProps) {
  const scene = new Scene();
  let xrViewerSpace: XRReferenceSpace;
  let xrHitTestSource: XRHitTestSource;

  const onSessionStarted = (session: XRSession) => {
    //session.addEventListener("select", onSelected);

    const gl = createWebGLContext({ xrCompatible: true });
    if (gl) {
      const renderer = new Renderer(gl);
      scene.setRenderer(renderer);

      session.updateRenderState({
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
    }
  };

  return (
    <div className="App">
      <WebXRButton onSessionStarted={onSessionStarted} />
    </div>
  );
}

export default App;
