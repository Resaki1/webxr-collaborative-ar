import "./DomOverlay.css";

interface DomOverlayProps {
  visible: boolean;
  placeObject: () => void;
  selectedObject: number | undefined;
  removeObject: () => void;
}

const DomOverlay = (props: DomOverlayProps) => {
  return (
    <div id="overlay" className={props.visible ? "visible" : "hidden"}>
      {props.selectedObject ? (
        <button className="deleteButton" onClick={() => props.removeObject()}>
          remove
        </button>
      ) : (
        <button className="placeButton" onClick={() => props.placeObject()}>
          place
        </button>
      )}
    </div>
  );
};

export default DomOverlay;
