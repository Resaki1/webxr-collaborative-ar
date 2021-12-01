import React, { Fragment, useEffect, useState } from "react";

interface ReceivedObjectsProps {
  objects: {
    object: any;
    matrix: number[];
  }[];
}

export function ReceivedObjects(props: ReceivedObjectsProps) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    console.log(props.objects);
    setKey(key + 1);
  }, [props.objects]);

  return (
    <Fragment key={key}>
      {props.objects.map((object, index) => (
        <mesh position={object.matrix} key={index}>
          {object.object}
        </mesh>
      ))}
    </Fragment>
  );
}
