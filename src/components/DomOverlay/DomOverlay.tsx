import "./DomOverlay.css";

interface DomOverlayProps {
  visible: boolean;
  placeObject: () => void;
}

const DomOverlay = (props: DomOverlayProps) => {
  return (
    <div id="overlay" className={props.visible ? "visible" : "hidden"}>
      <button className="placeButton" onClick={() => props.placeObject()}>
        place
      </button>
    </div>
  );
};

export default DomOverlay;
