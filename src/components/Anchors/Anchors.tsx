
import { useXRFrame } from "@react-three/xr";
import { Fragment, useState } from "react";
import type { XRAnchor, XRFrame } from "webxr";
import { useThree } from "@react-three/fiber";

interface AnchorsProps {
  anchoredObjects?: {
    anchoredObject: any;
    anchor: XRAnchor;
  }[];
}

export function Anchors(props: AnchorsProps) {
  const [positions, setPositions] = useState<number[][]>();
  const [key, setKey] = useState(0);

  const state = useThree();
  const xrRefSpace = state.gl.xr.getReferenceSpace();
  
  useXRFrame((time, xrFrame: XRFrame) => {
    if (xrRefSpace) {
      let updateAnchors = false;
      props.anchoredObjects?.forEach((object, index) => {
        if (xrFrame.trackedAnchors?.has(object.anchor)) {
          const anchorPose = xrFrame.getPose(
            object.anchor.anchorSpace,
            xrRefSpace,
          );

          if (anchorPose) {
            let newPositions = positions;
            const position = [
              anchorPose.transform.position.x,
              anchorPose.transform.position.y,
              anchorPose.transform.position.z,
            ];

            if (newPositions && newPositions[index]) {
              const samePosition = position.every((value, i) => value === newPositions![index][i])
              if (!samePosition) updateAnchors = true;

              newPositions[index] = position;
              setPositions(newPositions);
            } else if (newPositions) {
              updateAnchors = true;

              newPositions.push(position);
              setPositions(newPositions);
            } else {
              updateAnchors = true;
              
              newPositions = [position];
              setPositions(newPositions);
            }
          }
        }
      });
      if (updateAnchors) setKey(key + 1);
    }
  });

  return (
    // TODO: führt schnell zu viel zu vielen Rerendern durch automatisches updaten
    <Fragment key={key}>
      {props.anchoredObjects?.map((object, index) => {
        if (positions && positions[index]) {
          return (
            <mesh position={positions[index]} key={index}>
              {object.anchoredObject}
            </mesh>
          );
        }
      })}
    </Fragment>
  );
}
