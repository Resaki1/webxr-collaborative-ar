import { Interactive } from "@react-three/xr";
import { Dispatch, Fragment, SetStateAction } from "react";

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
            <mesh
              position={object.matrix}
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
                {object.object}
              </Interactive>
            </mesh>
          )
      )}
    </Fragment>
  );
}
