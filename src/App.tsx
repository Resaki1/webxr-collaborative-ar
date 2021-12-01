import React, { Suspense, useState } from "react";
import { ARCanvas, useXRFrame } from "@react-three/xr";
import type {
  XRAnchor,
  XRFrame,
  XRHitTestResult,
  XRHitTestSource,
  XRPose,
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

import { isolateYaw } from "./ts/vectors";

import WebXRButton from "./components/WebXRButton/WebXRButton";
import DomOverlay from "./components/DomOverlay/DomOverlay";

// import GLTFs so that snowpack includes them during compilation
// @ts-ignore
import * as reticleGltf from "./media/gltf/reticle/reticle.gltf";
// @ts-ignore
import * as sunflowerGltf from "./media/gltf/sunflower/sunflower.gltf";
import Reticle from "./components/Reticle/Reticle";
import Calibration from "./components/Calibration/Calibration";
import { Anchors } from "./components/Anchors/Anchors";
import { ReceivedObjects } from "./components/ReceivedObjects/ReceivedObjects";

interface AppProps {}

interface Vector {
  x: number;
  y: number;
  z: number;
  w: number;
}
interface Pose {
  position: Vector;
  orientation: Vector;
}

function App({}: AppProps) {
  const [calibratingState, setCalibratingState] = React.useState(true);
  let calibrating = true;

  ////////////////

  const [xrRefSpaceState, setXrRefSpace] = useState<XRReferenceSpace>();
  const [anchoredObjectsState, setAnchoredObjects] = useState<
    {
      anchoredObject: any;
      anchor: XRAnchor;
    }[]
  >([]);
  const [receivedObjects, setReceivedObjects] = useState<
    {
      object: any;
      matrix: number[];
    }[]
  >([]);

  const pushAnchoredObject = (anchoredObject: {
    anchoredObject: any;
    anchor: XRAnchor;
  }) => {
    setAnchoredObjects([...anchoredObjectsState, anchoredObject]);
  };

  const [room, setRoom] = useState<any>();
  const [sendObject, setSendObject] = useState(
    () => (data: any) => console.log(data),
  );

  React.useEffect(() => {
    setRoom(joinRoom({ appId: "ar-p2p" }, "1"));
  }, []);

  React.useEffect(() => {
    // Networking
    if (room) {
      room.onPeerJoin((id: any) => {
        console.log(`${id} joined`);
      });
      room.onPeerLeave((id: any) => {
        console.log(`${id} left`);
      });

      const [sendObjectFunction, getObject] = room.makeAction("place");
      setSendObject(() => (data: any) => sendObjectFunction(data));
      getObject((data: any) => {
        console.log("received Object");
        const newObject = {
          object: <boxGeometry args={[0.1, 0.1, 0.1]} />,
          matrix: data,
        };
        setReceivedObjects([...receivedObjects, newObject]);
      });
    }
  }, [room]);

  const placeObject = (data: any) => {
    console.log(`object placed at ${data}!`);
    console.log(sendObject);
    sendObject(data);
  };

  return (
    <ARCanvas sessionInit={{ requiredFeatures: ["hit-test", "anchors"] }}>
      <ambientLight />
      <Suspense fallback={null}>
        {calibratingState ? (
          <Calibration
            setCalibrating={setCalibratingState}
            pushAnchoredObject={pushAnchoredObject}
            refSpace={xrRefSpaceState}
            setRefSpace={setXrRefSpace}
          />
        ) : (
          room && (
            <>
              <Reticle
                pushAnchoredObject={pushAnchoredObject}
                placeObject={(data: any) => placeObject(data)}
                refSpace={xrRefSpaceState}
              />
              <ReceivedObjects objects={receivedObjects} />
            </>
          )
        )}
        <Anchors
          anchoredObjects={anchoredObjectsState}
          refSpace={xrRefSpaceState}
        />
      </Suspense>
    </ARCanvas>
  );
}

export default App;
