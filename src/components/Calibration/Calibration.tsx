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
import * as Quaternion from "quaternion";
import { isolateYaw } from "../../ts/vectors";
import { useThree } from "@react-three/fiber";

interface CalibrationProps {
  setCalibrating: React.Dispatch<React.SetStateAction<boolean>>;
  pushAnchoredObject: (anchoredObject: {
    anchoredObject: any;
    anchor: XRAnchor;
  }) => void;
  setRefSpace: React.Dispatch<
    React.SetStateAction<XRReferenceSpace | undefined>
  >;
}

export default function Calibration(props: CalibrationProps) {
  const mesh = useRef<THREE.Mesh>();
  const [currentHit, setCurrentHit] = useState<XRHitTestResult>();
  const [anchors, setAnchors] = useState<XRAnchor[]>();

  const state = useThree();
  const xrRefSpace = state.gl.xr.getReferenceSpace();

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
    if (currentHit) {
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
    if (anchors?.length === 2 && isCalibrating) {
      const originAnchor = xrFrame.getPose(
        anchors[0].anchorSpace,
        xrRefSpace,
      )?.transform.position;

      const rotationAnchor = xrFrame.getPose(
        anchors[1].anchorSpace,
        xrRefSpace,
      )?.transform.position;

      if (originAnchor && rotationAnchor) {
        const directionVector = {
          x: rotationAnchor.x - originAnchor.x,
          y: rotationAnchor.y - originAnchor.y,
          z: rotationAnchor.z - originAnchor.z,
          w: 1,
        };

        const xAxis = new THREE.Vector3(1,0,0)
        const dirVector = new THREE.Vector3(directionVector.x, directionVector.y, directionVector.z)
        const rotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
          xAxis,
          dirVector,
        )
        console.log(isolateYaw(rotationQuaternion))
        // calculate rotation between directionVector and x-axis
        /* const rotationQuaternion = new Quaternion.fromBetweenVectors(
          [1, 0, 0],
          [directionVector.x, directionVector.y, directionVector.z],
        ); */
        // @ts-ignore
        const rigidTransform = new XRRigidTransform(
          originAnchor,
          isolateYaw(rotationQuaternion),
        );
        console.log(originAnchor);
        console.log(rigidTransform);

        state.gl.xr.setReferenceSpace(xrRefSpace.getOffsetReferenceSpace(rigidTransform))
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
