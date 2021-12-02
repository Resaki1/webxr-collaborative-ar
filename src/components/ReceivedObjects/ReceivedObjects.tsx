import { Fragment, useEffect, useState } from "react";

interface ReceivedObjectsProps {
  objects: {
    object: any;
    matrix: number[];
  }[];
}

export function ReceivedObjects(props: ReceivedObjectsProps) {
  const [key, setKey] = useState(0);
  const [objects, setObjects] = useState(props.objects);
  useEffect(() => {
    setObjects([...objects, props.objects[0]]);
    setKey(key + 1);
  }, [props.objects]);

  return (
    <Fragment key={key}>
      {objects.map(
        (object, index) =>
          object && (
            <mesh position={object.matrix} key={index}>
              {object.object}
            </mesh>
          )
      )}
    </Fragment>
  );
}
