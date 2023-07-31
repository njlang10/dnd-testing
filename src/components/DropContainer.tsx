import { useDrop } from "react-dnd";
import React from "react";
import {
  DraggableTypes,
  Coordinates,
  ContainerOrientation,
  OnDropFunc,
} from "../index";
export type DropLocation =
  | "PRE_ROW"
  | "POST_ROW"
  | "PRE_CONTAINER"
  | "POST_CONTAINER"
  | "PRE_BLOCK"
  | "POST_BLOCK";

/**
 * Render a container that can accept various drop types, and call a function onDrop of an item
 */
export function DropContainer({
  dropLocation,
  acceptedTypes,
  coordinates,
  orientation,
  onDrop,
}: {
  dropLocation: DropLocation;
  acceptedTypes: DraggableTypes | DraggableTypes[];
  coordinates: Coordinates;
  orientation: ContainerOrientation;
  onDrop: OnDropFunc;
}): JSX.Element {
  const [collectedProps, drop] = useDrop(
    () => ({
      accept: acceptedTypes,
      drop: (movedItem: Coordinates, monitor) => {
        console.log(
          `Request to drop item ${
            monitor.getItemType() as DraggableTypes
          } from ${JSON.stringify(movedItem)} to ${JSON.stringify(coordinates)}`
        );
        onDrop(
          monitor.getItemType() as DraggableTypes,
          movedItem as Coordinates,
          coordinates
        );
      },
      collect: (monitor) => {
        return { isOver: !!monitor.isOver() };
      },
    }),
    [dropLocation, acceptedTypes, coordinates, orientation, onDrop] // NOTE: This is important! If you don't add your deps, any state setting will be STALE
  );

  let color: React.CSSProperties["backgroundColor"] = "pink";

  switch (dropLocation) {
    case "PRE_ROW":
    case "POST_ROW":
      color = "pink";
      break;
    case "PRE_CONTAINER":
    case "POST_CONTAINER":
      color = "lightblue";
      break;
    case "PRE_BLOCK":
    case "POST_BLOCK":
      color = "lightgreen";
      break;
  }

  return (
    <div
      ref={drop}
      style={{
        width: orientation === "HORIZONTAL" ? "25px" : "100%",
        minHeight: orientation === "VERTICAL" ? "25px" : "100%",
        backgroundColor: color,
        opacity: collectedProps.isOver ? "50%" : "100%",
      }}
    >{`${coordinates.rowIdx} / ${coordinates.containerIdx} / ${coordinates.subContainerIdx}`}</div>
  );
}
