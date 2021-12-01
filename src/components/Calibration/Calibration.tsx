import { useHitTest, useXREvent, useXRFrame } from "@react-three/xr";
import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import * as THREE from "three";
import type {
  XRAnchor,
  XRFrame,
  XRHitTestResult,
  XRReferenceSpace,
  XRRigidTransform,
} from "webxr";
// @ts-ignore
import { Quaternion } from "quaternion";
import { isolateYaw } from "../../ts/vectors";
import { useThree } from "@react-three/fiber";

interface CalibrationProps {
  setCalibrating: React.Dispatch<React.SetStateAction<boolean>>;
  pushAnchoredObject: (anchoredObject: {
    anchoredObject: any;
    anchor: XRAnchor;
  }) => void;
  refSpace?: XRReferenceSpace;
  setRefSpace: React.Dispatch<
    React.SetStateAction<XRReferenceSpace | undefined>
  >;
}

export default function Calibration(props: CalibrationProps) {
  const mesh = useRef<THREE.Mesh>();
  const [currentHit, setCurrentHit] = useState<XRHitTestResult>();
  const [anchors, setAnchors] = useState<XRAnchor[]>();

  const state = useThree();
  const xr = state.gl.xr;

  let isCalibrating = true;

  useHitTest((hitMatrix, hit) => {
    if (isCalibrating) {
      setCurrentHit(hit);
      if (mesh.current)
        hitMatrix.decompose(
          mesh.current.position,
          mesh.current.rotation,
          mesh.current.scale,
        );
    }
  });

  useXREvent("select", () => {
    if (currentHit && props.refSpace) {
      // @ts-ignore
      currentHit.createAnchor().then((anchor: XRAnchor) => {
        props.pushAnchoredObject({
          anchor,
          anchoredObject: <octahedronGeometry args={[0.1, 0]} />,
        });

        let newAnchors = anchors;
        if (!newAnchors) {
          newAnchors = [anchor];
        } else newAnchors[anchors ? anchors.length : 0] = anchor;

        setAnchors(newAnchors);
      });
    }
  });

  useXRFrame((time, xrFrame: XRFrame) => {
    if (!props.refSpace)
      xrFrame.session
        .requestReferenceSpace("local")
        .then((refSpace) => props.setRefSpace(refSpace));

    if (anchors?.length === 2 && isCalibrating) {
      const originAnchor = xrFrame.getPose(
        anchors[0].anchorSpace,
        props.refSpace!,
      )?.transform.position;

      const rotationAnchor = xrFrame.getPose(
        anchors[1].anchorSpace,
        props.refSpace!,
      )?.transform.position;

      if (originAnchor && rotationAnchor) {
        const directionVector = {
          x: rotationAnchor.x - originAnchor.x,
          y: rotationAnchor.y - originAnchor.y,
          z: rotationAnchor.z - originAnchor.z,
          w: 1,
        };

        // calculate rotation between directionVector and x-axis
        /* const rotationQuaternion = new Quaternion.fromBetweenVectors(
          [1, 0, 0],
          [directionVector.x, directionVector.y, directionVector.z],
        ); */
        // @ts-ignore
        const rigidTransform = new XRRigidTransform(
          originAnchor,
          /* isolateYaw(rotationQuaternion), */
        );
        console.log(originAnchor);
        console.log(rigidTransform);


        xr.setOffsetReferenceSpace(props.refSpace?.getOffsetReferenceSpace(rigidTransform))
        /* props.setRefSpace(
          props.refSpace?.getOffsetReferenceSpace(rigidTransform),
        ); */
      }

      isCalibrating = false;
      props.setCalibrating(false);
    }
  });

  return (
    <mesh ref={mesh}>
      <octahedronGeometry args={[0.1, 0]} />
    </mesh>
  );
}
