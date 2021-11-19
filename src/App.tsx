import React from "react";
import type {
  XRAnchor,
  XRFrame,
  XRHitTestResult,
  XRHitTestSource,
  XRPose,
  XRRay,
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
import { getOrientationAbs, multiply } from "./ts/vectors";
import { Gltf2Node } from "./renderer/nodes/gltf2";

// import GLTFs so that snowpack includes them during compilation
// @ts-ignore
import * as reticleGltf from "./media/gltf/reticle/reticle.gltf";
// @ts-ignore
import * as sunflowerGltf from "./media/gltf/sunflower/sunflower.gltf";

interface AppProps {}

function App({}: AppProps) {
  const scene = new Scene();
  let xrViewerSpace: XRReferenceSpace;
  let xrRefSpace: XRReferenceSpace;
  let xrHitTestSource: XRHitTestSource;
  let xrPose: XRPose | null;
  let xrDepth: number | null;
  let reticleHitTestResult: XRHitTestResult | null;
  let anchoredObjects: { anchoredObject: Gltf2Node; anchor: XRAnchor }[] = [];

  let reticle = new Gltf2Node({
    url: "./dist/media/gltf/reticle/reticle.gltf",
  });
  reticle.visible = false;
  scene.addNode(reticle);

  // absolute orientation sensor
  const options = { frequency: 60, referenceFrame: "device" };
  // @ts-ignore
  const sensor = new AbsoluteOrientationSensor(options);

  const xr = (navigator as any)?.xr as XRSystem;

  const addAnchoredObjectsToScene = (anchor: XRAnchor) => {
    const flower = new Gltf2Node({
      url: "./dist/media/gltf/sunflower/sunflower.gltf",
    });
    scene.addNode(flower);
    anchoredObjects.push({
      anchoredObject: flower,
      anchor: anchor,
    });
  };

  const onSelected = () => {
    if (reticle.visible) {
      // TODO: differentiate between calibration and "play" phase
      if (reticleHitTestResult) {
        // create an anchor
        // @ts-ignore
        reticleHitTestResult
          // @ts-ignore
          .createAnchor()
          .then((anchor) => {
            addAnchoredObjectsToScene(anchor);
          })
          .catch((error) => console.log(`Could not create anchor: ${error}`));
      }
    }
  };

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
    session.addEventListener("select", onSelected);

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
    xrPose = frame.getViewerPose(xrRefSpace);

    if (xrPose) {
      const depthData = frame
        // @ts-ignore
        .getDepthInformation(xrPose.views[0]);
      if (depthData) xrDepth = depthData.getDepthInMeters(0.5, 0.5);

      // TODO: Show reticle only using depth data while calibrating
      // TODO: Only use depth data while calibrating
      xrDepth = null;
      if (xrDepth) {
        // add depth data to improve reticle accuracy
        // @ts-ignore
        let ray = new XRRay(xrPose.transform);
        let rayDirectionVector = [
          ray.direction.x,
          ray.direction.y,
          ray.direction.z,
        ];
        let rayPositionVector = [ray.origin.x, ray.origin.y, ray.origin.z];
        let hitTestVector = multiply(rayDirectionVector, xrDepth);

        reticle.visible = true;
        reticle.translation = rayPositionVector.map(
          (value, index) => value + hitTestVector[index],
        );
      } else if (xrHitTestSource) {
        let hitTestResults = frame.getHitTestResults(xrHitTestSource);

        if (hitTestResults.length > 0) {
          let pose = hitTestResults[0].getPose(xrRefSpace);
          reticleHitTestResult = hitTestResults[0];
          reticle.visible = true;

          reticle.matrix = pose?.transform.matrix;
        } else reticle.visible = false;
      } else reticle.visible = false;
    }

    console.log(anchoredObjects);
    for (const { anchoredObject, anchor } of anchoredObjects) {
      // only update the object's position if it's still in the list
      // of frame.trackedAnchors
      if (!frame.trackedAnchors?.has(anchor)) continue;
      const anchorPose = frame.getPose(anchor.anchorSpace, xrRefSpace);
      if (anchorPose) anchoredObject.matrix = anchorPose.transform.matrix;
    }

    scene.startFrame();
    session.requestAnimationFrame(onXRFrame);
    scene.drawXRFrame(frame, xrPose);
    scene.endFrame;
  };

  return (
    <div className="App">
      <WebXRButton initXR={initXR} />
    </div>
  );
}

export default App;
