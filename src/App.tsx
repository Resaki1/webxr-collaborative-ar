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
// @ts-ignore
import { joinRoom } from "trystero";

import "./App.css";
import { Scene } from "./renderer/scenes/scene.js";
import { Renderer, createWebGLContext } from "./renderer/core/renderer.js";
import { Gltf2Node } from "./renderer/nodes/gltf2";

import { getOrientationAbs, multiply } from "./ts/vectors";

import WebXRButton from "./components/WebXRButton/WebXRButton";
import DomOverlay from "./components/DomOverlay/DomOverlay";

// import GLTFs so that snowpack includes them during compilation
// @ts-ignore
import * as reticleGltf from "./media/gltf/reticle/reticle.gltf";
// @ts-ignore
import * as sunflowerGltf from "./media/gltf/sunflower/sunflower.gltf";

interface AppProps {}

function App({}: AppProps) {
  const [calibratingState, setCalibratingState] = React.useState(true);
  let calibrating = true;
  const scene = new Scene();
  let xrViewerSpace: XRReferenceSpace;
  let xrRefSpace: XRReferenceSpace;
  let xrHitTestSource: XRHitTestSource;
  let xrPose: XRPose | null;
  let xrDepth: number | null;
  let reticleHitTestResult: XRHitTestResult | null;
  let anchoredObjects: {
    anchoredObject: Gltf2Node;
    anchor: XRAnchor;
    broadcasted: boolean;
  }[] = [];
  let room: any;
  let sendObject: any;
  let getObject: any;
  let sendPose: any;
  let getPose: any;
  let calibratedPose: {
    position: { x: number; y: number; z: number; w: number };
  };

  let reticle = new Gltf2Node({
    url: "./dist/media/gltf/reticle/reticle.gltf",
  });
  reticle.visible = false;
  scene.addNode(reticle);
  scene.enableStats(false);

  // absolute orientation sensor
  const options = { frequency: 60, referenceFrame: "device" };
  // @ts-ignore
  const sensor = new AbsoluteOrientationSensor(options);

  const xr = (navigator as any)?.xr as XRSystem;

  const flower = new Gltf2Node({
    url: "./dist/media/gltf/sunflower/sunflower.gltf",
  });
  const addAnchoredObjectsToScene = (anchor: XRAnchor) => {
    const object = new Gltf2Node({
      url: "./dist/media/gltf/sunflower/sunflower.gltf",
    });
    scene.addNode(object);
    anchoredObjects.push({
      anchoredObject: object,
      anchor: anchor,
      broadcasted: false,
    });
  };

  const resetRefSpace = (hitTestPosition: number[]) => {
    if (calibratedPose) {
      xrRefSpace = xrRefSpace.getOffsetReferenceSpace(
        // @ts-ignore
        new XRRigidTransform({
          x: hitTestPosition[0] - calibratedPose.position.x,
          y: hitTestPosition[1] - calibratedPose.position.y,
          z: hitTestPosition[2] - calibratedPose.position.z,
        }),
      );
    }
  };

  React.useEffect(() => {
    // Networking
    if (!room) room = joinRoom({ appId: "ar-p2p" }, "1");
    room.onPeerJoin((id: any) => {
      console.log(`${id} joined`);
    });
    room.onPeerLeave((id: any) => {
      console.log(`${id} left`);
    });

    [sendObject, getObject] = room.makeAction("place");
    [sendPose, getPose] = room.makeAction("move");

    getPose(
      (data: { position: { x: number; y: number; z: number; w: number } }) => {
        if (calibrating) {
          calibratedPose = data;
        }
      },
    );
  }, [room]);

  const onSelected = () => {
    if (reticle.visible) {
      // TODO: add networking
      // TODO: check if another players pose is available, otherwise reset to reticle position
      if (calibrating) {
        resetRefSpace(reticle.translation);
        // TODO: change to only one calibrating variable
        setCalibratingState(false);
        calibrating = false;
      } else if (reticleHitTestResult) {
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
        requiredFeatures: [
          "local",
          "hit-test",
          "anchors",
          "depth-sensing",
          "dom-overlay",
        ],
        domOverlay: { root: document.getElementById("overlay") },
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
    const domOverlay = document.getElementById("overlay");
    if (domOverlay) domOverlay.style.display = "flex";

    getObject((data: { matrix: number[] }) => {
      const newObject = new Gltf2Node({
        url: "./dist/media/gltf/sunflower/sunflower.gltf",
      });
      newObject.visible = true;
      newObject.matrix = data.matrix;
      scene.addNode(newObject);
    });

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

      if (calibrating && xrDepth) {
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
          sendPose({ position: xrPose.transform.position });
          let pose = hitTestResults[0].getPose(xrRefSpace);
          reticleHitTestResult = hitTestResults[0];
          reticle.visible = true;

          reticle.matrix = pose?.transform.matrix;
        } else reticle.visible = false;
      } else reticle.visible = false;
    }

    anchoredObjects.forEach((anchoredObject) => {
      if (frame.trackedAnchors?.has(anchoredObject.anchor)) {
        const anchorPose = frame.getPose(
          anchoredObject.anchor.anchorSpace,
          xrRefSpace,
        );
        if (anchorPose) {
          anchoredObject.anchoredObject.matrix = anchorPose.transform.matrix;

          // PROBLEM: Objekt wird nur einmal geschickt und nicht geupdated
          if (!anchoredObject.broadcasted) {
            sendObject({ matrix: [...anchorPose.transform.matrix] });
            anchoredObject.broadcasted = true;
          }
        }
      }
    });

    scene.startFrame();
    session.requestAnimationFrame(onXRFrame);
    scene.drawXRFrame(frame, xrPose);
    scene.endFrame;
  };

  return (
    <div className="App">
      {/* TODO: disable button if AR is not available */}
      <WebXRButton initXR={initXR} />
      <DomOverlay calibrating={calibratingState} />
    </div>
  );
}

export default App;
