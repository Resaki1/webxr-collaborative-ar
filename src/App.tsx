import React, { Suspense, useState } from "react";
import { ARCanvas } from "@react-three/xr";
import { XRAnchor, XRHitTestResult, XRReferenceSpace } from "webxr";
// @ts-ignore
import { joinRoom } from "trystero";

import "./App.css";

import Reticle from "./components/Reticle/Reticle";
import Calibration from "./components/Calibration/Calibration";
import { Anchors } from "./components/Anchors/Anchors";
import { ReceivedObjects } from "./components/ReceivedObjects/ReceivedObjects";
import DomOverlay from "./components/DomOverlay/DomOverlay";
import Chair from "./components/Chair/Chair";

function App() {
  const [calibratingState, setCalibratingState] = useState(true);
  const [refSpace, setRefSpace] = useState<XRReferenceSpace | undefined>();
  const [currentHit, setCurrentHit] = useState<XRHitTestResult | undefined>();
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
  const [sendObject, setSendObject] = useState(() => (_: any) => undefined);

  const pushAnchoredObject = (anchoredObject: {
    anchoredObject: any;
    anchor: XRAnchor;
  }) => {
    setAnchoredObjects([...anchoredObjectsState, anchoredObject]);
  };

  const pushReceivedObject = (newObject: any) => {
    setReceivedObjects([...receivedObjects, newObject]);
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
          object: <Chair />,
          matrix: data,
        };
        pushReceivedObject(newObject);
      });
    }
  }, [room]);

  const placeObject = () => {
    if (currentHit && refSpace) {
      const pose = currentHit.getPose(refSpace);

      if (pose) {
        // @ts-ignore
        currentHit.createAnchor().then((anchor: XRAnchor) => {
          pushAnchoredObject({
            anchor,
            anchoredObject: <Chair />,
          });

          const matrix = [
            pose?.transform.position.x,
            pose?.transform.position.y,
            pose?.transform.position.z,
          ];
          sendObject(matrix);
        });
      }
    }
    /* sendObject(data); */
  };

  return (
    <>
      <ARCanvas
        sessionInit={{
          requiredFeatures: ["hit-test", "anchors", "dom-overlay"],
          domOverlay: { root: document.getElementById("overlay") },
        }}
      >
        <ambientLight />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Suspense fallback={null}>
          {calibratingState ? (
            <Calibration
              setRefSpace={setRefSpace}
              setCalibrating={setCalibratingState}
              pushAnchoredObject={pushAnchoredObject}
            />
          ) : (
            room && (
              <>
                <Reticle
                  pushAnchoredObject={pushAnchoredObject}
                  setCurrentHitTestResult={setCurrentHit}
                  currentHitTestResult={currentHit}
                />
                <ReceivedObjects objects={receivedObjects} />
              </>
            )
          )}
          <Anchors anchoredObjects={anchoredObjectsState} />
        </Suspense>
      </ARCanvas>
      <DomOverlay visible={!calibratingState} placeObject={placeObject} />
    </>
  );
}

export default App;
