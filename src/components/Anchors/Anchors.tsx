//@ts-ignore-nextline
import { Interactive, useXRFrame } from "@react-three/xr";
import {
  Dispatch,
  Fragment,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import type { XRAnchor, XRFrame } from "webxr";
import { useThree } from "@react-three/fiber";

interface AnchorsProps {
  anchoredObjects?: {
    id: number;
    anchoredObject: any;
    anchor: XRAnchor;
  }[];
  selectedObject: number | undefined;
  setSelectedObject: Dispatch<SetStateAction<number | undefined>>;
}

export function Anchors(props: AnchorsProps) {
  const objectsRef = useRef<any>([]);
  const [anchorSetSize, setAnchorSetSize] = useState(0);

  useEffect(() => {
    objectsRef.current = objectsRef.current.slice(
      0,
      props.anchoredObjects?.length
    );
  }, [props.anchoredObjects]);

  const xrRefSpace = useThree().gl.xr.getReferenceSpace();

  useXRFrame((_, xrFrame: XRFrame) => {
    if (xrRefSpace) {
      // update component state to force anchor update
      if (xrFrame.trackedAnchors?.size !== anchorSetSize) {
        if (xrFrame.trackedAnchors)
          setAnchorSetSize(xrFrame.trackedAnchors?.size);
      }
      props.anchoredObjects?.forEach((value, index) => {
        if (xrFrame.trackedAnchors?.has(value.anchor)) {
          const anchorPose = xrFrame.getPose(
            value.anchor.anchorSpace,
            xrRefSpace
          );
          const object = objectsRef.current[index];

          // TODO: if anchor is one of the two markers, re-calibrate the reference space
          if (object) {
            object.position.x = anchorPose?.transform.position.x;
            object.position.y = anchorPose?.transform.position.y;
            object.position.z = anchorPose?.transform.position.z;
          }
        }
      });
    }
  });

  return (
    <Fragment>
      {props.anchoredObjects?.map((object, index) => (
        <mesh
          ref={(el: any) => (objectsRef.current[index] = el)}
          key={index}
          scale={object.id === props.selectedObject ? 1.2 : 1}
        >
          <Interactive
            onSelect={(_) =>
              props.selectedObject === object.id
                ? props.setSelectedObject(undefined)
                : props.setSelectedObject(object.id)
            }
          >
            {object.anchoredObject}
          </Interactive>
        </mesh>
      ))}
    </Fragment>
  );
}
