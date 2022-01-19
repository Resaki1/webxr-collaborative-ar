import { Suspense, useEffect, useState } from "react";
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
  const [sendDeletion, setSendDeletion] = useState(
    () => (_: number) => undefined
  );

  const pushAnchoredObject = (anchoredObject: {
    id: number;
    anchoredObject: any;
    anchor: XRAnchor;
  }) => {
    const newAnchoredObjects = anchoredObjectsState;
    newAnchoredObjects.push(anchoredObject);
    setAnchoredObjects(newAnchoredObjects);
  };

  const pushReceivedObject = (
    newObjects: { id: number; object: any; matrix: number[] }[]
  ) => {
    const newReceivedObjects = receivedObjects;
    newReceivedObjects.push(...newObjects);
    console.log("newReceivedObjects", newReceivedObjects);
    setReceivedObjects(newReceivedObjects);
  };

  useEffect(() => {
    setRoom(joinRoom({ appId: "ar-p2p" }, "1"));
  }, []);

  // Networking
  useEffect(() => {
    if (room) {
      room.onPeerJoin((id: any) => {
        console.log(`${id} joined`);
        console.log(anchoredObjectsState);
        const sceneObjects: { id: number; matrix: number[] }[] = [];
        receivedObjects.forEach((object) =>
          sceneObjects.push({ id: object.id, matrix: object.matrix })
        );
        console.log("sending", sceneObjects);
        sendObject(sceneObjects);
      });
      room.onPeerLeave((id: any) => {
        console.log(`${id} left`);
      });

      const [sendObjectFunction, getObjects] = room.makeAction("place");
      const [sendDeletionFunction, getDeletion] = room.makeAction("remove");
      setSendObject(() => (data: any) => sendObjectFunction(data));
      setSendDeletion(() => (id: number) => sendDeletionFunction(id));

      getObjects((data: { id: number; matrix: number[] }[]) => {
        const newObjects: { id: number; object: any; matrix: number[] }[] = [];
        data.forEach((object) =>
          newObjects.push({
            id: object.id,
            object: <Chair />,
            matrix: object.matrix,
          })
        );
        console.log("received", newObjects);
        pushReceivedObject(newObjects);
      });
      getDeletion((id: number) => removeObject(id));
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
          sendObject([{ id, matrix }]);
        });
      }
    }
  };

  const removeObject = (id: number) => {
    // TODO: ersten zwei objekte nicht entfernen

    setAnchoredObjects((currentAnchors) => {
      let index = currentAnchors.findIndex((object) => object.id === id);

      if (index > -1) {
        const newAnchoredObjects = currentAnchors;
        newAnchoredObjects.splice(index, 1);
        return newAnchoredObjects;
      } else {
        setReceivedObjects((currentObjects) => {
          index = currentObjects.findIndex((object) => object.id === id);
          if (index > -1) {
            const newReceivedObjects = currentObjects;
            newReceivedObjects.splice(index, 1);
            return newReceivedObjects;
          } else return currentObjects;
        });
      }
      return currentAnchors;
    });

    sendDeletion(id);
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
              pushAnchoredObject={setAnchoredObjects}
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
