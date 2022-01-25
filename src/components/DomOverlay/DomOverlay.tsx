import "./DomOverlay.css";

interface DomOverlayProps {
  visible: boolean;
  placeObject: () => void;
  selectedObject: number | undefined;
  removeObject: (id: number) => void;
}

const DomOverlay = (props: DomOverlayProps) => {
  return (
    <div id="overlay" className={props.visible ? "visible" : "hidden"}>
      {props.selectedObject ? (
        <button
          className="deleteButton"
          onClick={
            props.selectedObject
              ? () => props.removeObject(props.selectedObject!)
              : undefined
          }
        >
          remove
        </button>
      ) : (
        <button className="placeButton" onClick={() => props.placeObject()}>
          test
        </button>
      )}
    </div>
  );
};

export default DomOverlay;
