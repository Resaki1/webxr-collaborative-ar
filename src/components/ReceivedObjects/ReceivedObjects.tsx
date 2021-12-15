import { Interactive } from "@react-three/xr";
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from "react";

interface ReceivedObjectsProps {
  objects: {
    id: number;
    object: any;
    matrix: number[];
  }[];
  selectedObject: number | undefined;
  setSelectedObject: Dispatch<SetStateAction<number | undefined>>;
}

export function ReceivedObjects(props: ReceivedObjectsProps) {
  return (
    <Fragment key={props.objects.length}>
      {props.objects.map(
        (object, index) =>
          object && (
            <mesh position={object.matrix} key={index}>
              <Interactive
                onSelect={(_) =>
                  props.selectedObject === object.id
                    ? props.setSelectedObject(undefined)
                    : props.setSelectedObject(object.id)
                }
              >
                {object.object}
              </Interactive>
            </mesh>
          )
      )}
    </Fragment>
  );
}
