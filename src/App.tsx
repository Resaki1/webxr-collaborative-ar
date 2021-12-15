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
  const [selectedObject, setSelectedObject] = useState<number | undefined>();
  const [anchoredObjectsState, setAnchoredObjects] = useState<
    {
      id: number;
      anchoredObject: any;
      anchor: XRAnchor;
    }[]
  >([]);
  const [receivedObjects, setReceivedObjects] = useState<
    {
      id: number;
      object: any;
      matrix: number[];
    }[]
  >([]);

  const [room, setRoom] = useState<any>();
  const [sendObject, setSendObject] = useState(() => (_: any) => undefined);

  const pushAnchoredObject = (anchoredObject: {
    id: number;
    anchoredObject: any;
    anchor: XRAnchor;
  }) => {
    setAnchoredObjects([...anchoredObjectsState, anchoredObject]);
  };

  const pushReceivedObject = (newObject: any) => {
    const newReceivedObjects = receivedObjects;
    newReceivedObjects.push(newObject);
    setReceivedObjects(newReceivedObjects);
  };

  React.useEffect(() => {
    setRoom(joinRoom({ appId: "ar-p2p" }, "1"));
  }, []);

  // Networking
  React.useEffect(() => {
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
          id: data.id,
          object: <Chair />,
          matrix: data.matrix,
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
          const id = Math.random();
          pushAnchoredObject({
            id,
            anchor,
            anchoredObject: <Chair />,
          });

          const matrix = [
            pose?.transform.position.x,
            pose?.transform.position.y,
            pose?.transform.position.z,
          ];
          sendObject({ id, matrix });
        });
      }
    }
  };

  const removeObject = () => {
    // TODO: ersten zwei objekte nicht entfernen
    // TODO: auch receivedObjects berücksichtigen
    // TODO: Veränderung an andere Clients schicken

    let index = anchoredObjectsState.findIndex(
      (object) => object.id === selectedObject
    );
    if (index > -1) {
      const newAnchoredObjects = anchoredObjectsState;
      newAnchoredObjects.splice(index, 1);
      setAnchoredObjects(newAnchoredObjects);
    } else {
      index = receivedObjects.findIndex(
        (object) => object.id === selectedObject
      );

      console.log(index);
      if (index > -1) {
        const newReceivedObjects = receivedObjects;
        console.log(receivedObjects[0]);
        newReceivedObjects.splice(index, 1);
        setReceivedObjects(newReceivedObjects);
        console.log(receivedObjects[0]);
      }
    }

    setSelectedObject(undefined);
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
                  setRefSpace={setRefSpace}
                  setCurrentHitTestResult={setCurrentHit}
                  currentHitTestResult={currentHit}
                />
                <ReceivedObjects
                  objects={receivedObjects}
                  selectedObject={selectedObject}
                  setSelectedObject={setSelectedObject}
                />
              </>
            )
          )}
          <Anchors
            anchoredObjects={anchoredObjectsState}
            selectedObject={selectedObject}
            setSelectedObject={setSelectedObject}
          />
        </Suspense>
      </ARCanvas>
      <DomOverlay
        visible={!calibratingState}
        placeObject={placeObject}
        selectedObject={selectedObject}
        removeObject={removeObject}
      />
    </>
  );
}

export default App;
