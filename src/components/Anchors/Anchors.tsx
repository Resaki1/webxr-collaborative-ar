// @ts-ignore
import * as THREE from "three";
import { useXR, useXRFrame } from "@react-three/xr";
import React, { Fragment, useEffect, useState } from "react";
import type { XRAnchor, XRFrame, XRReferenceSpace } from "webxr";
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
              newPositions[index] = position;
              setPositions(newPositions);
            } else if (newPositions) {
              newPositions.push(position);
              setPositions(newPositions);
            } else {
              newPositions = [position];
              setPositions(newPositions);
            }
            setKey(key + 1);
          }
        }
      });
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
