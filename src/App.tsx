import React, { Suspense, useState } from "react";
import { ARCanvas } from "@react-three/xr";
import type { XRAnchor } from "webxr";
// @ts-ignore
import { joinRoom } from "trystero";

import "./App.css";

import Reticle from "./components/Reticle/Reticle";
import Calibration from "./components/Calibration/Calibration";
import { Anchors } from "./components/Anchors/Anchors";
import { ReceivedObjects } from "./components/ReceivedObjects/ReceivedObjects";

function App() {
  const [calibratingState, setCalibratingState] = React.useState(true);
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

  const [room, setRoom] = useState<any>();
  const [sendObject, setSendObject] = useState(
    () => (data: any) => undefined,
  );

  const pushAnchoredObject = (anchoredObject: {
    anchoredObject: any;
    anchor: XRAnchor;
  }) => {
    setAnchoredObjects([...anchoredObjectsState, anchoredObject]);
  };

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
        const newObject = {
          object: <boxGeometry args={[0.1, 0.1, 0.1]} />,
          matrix: data,
        };
        setReceivedObjects([...receivedObjects, newObject]);
      });
    }
  }, [room]);

  const placeObject = (data: any) => {
    sendObject(data);
  };

  return (
    <ARCanvas sessionInit={{ requiredFeatures: ["hit-test", "anchors"] }}>
      <ambientLight />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <Suspense fallback={null}>
        {calibratingState ? (
          <Calibration
            setCalibrating={setCalibratingState}
            pushAnchoredObject={pushAnchoredObject}
          />
        ) : (
          room && (
            <>
              <Reticle
                pushAnchoredObject={pushAnchoredObject}
                placeObject={(data: any) => placeObject(data)}
              />
              <ReceivedObjects objects={receivedObjects} />
            </>
          )
        )}
        <Anchors anchoredObjects={anchoredObjectsState} />
      </Suspense>
    </ARCanvas>
  );
}

export default App;
