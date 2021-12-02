import { useXRFrame } from "@react-three/xr";
import { Fragment, useEffect, useRef } from "react";
import type { XRAnchor, XRFrame } from "webxr";
import { useThree } from "@react-three/fiber";

interface AnchorsProps {
  anchoredObjects?: {
    anchoredObject: any;
    anchor: XRAnchor;
  }[];
}

export function Anchors(props: AnchorsProps) {
  const objectsRef = useRef<any>([]);

  useEffect(() => {
    objectsRef.current = objectsRef.current.slice(
      0,
      props.anchoredObjects?.length
    );
  }, [props.anchoredObjects]);

  const xrRefSpace = useThree().gl.xr.getReferenceSpace();

  useXRFrame((_, xrFrame: XRFrame) => {
    if (xrRefSpace) {
      props.anchoredObjects?.forEach((value, index) => {
        if (xrFrame.trackedAnchors?.has(value.anchor)) {
          const anchorPose = xrFrame.getPose(
            value.anchor.anchorSpace,
            xrRefSpace
          );
          const object = objectsRef.current[index];

          object.position.x = anchorPose?.transform.position.x;
          object.position.y = anchorPose?.transform.position.y;
          object.position.z = anchorPose?.transform.position.z;
        }
      });
    }
  });

  return (
    <Fragment>
      {props.anchoredObjects?.map((object, index) => {
        return (
          <mesh ref={(el: any) => (objectsRef.current[index] = el)} key={index}>
            {object.anchoredObject}
          </mesh>
        );
      })}
    </Fragment>
  );
}
