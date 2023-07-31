import { useDrag } from "react-dnd";
import React from "react";
import { BlockContents } from "./BlockContainerView";
import { Coordinates } from "../index";

/**
 * Render a single block (right now text, but could take children instead)
 */
export function SingleBlock({
  contents,
  coordinates,
}: {
  contents: BlockContents;
  coordinates: Coordinates;
}): JSX.Element {
  const [props, drag] = useDrag(
    () => ({
      type: "BLOCK",
      item: coordinates,
      collect: (monitor) => {
        return {
          isDragging: !!monitor.isDragging(),
        };
      },
    }),
    [contents, coordinates]
  );

  return (
    <div
      ref={drag}
      style={{
        cursor: "grab",
        width: "100%",
        height: "100%",
        border: "1px dashed gray",
        textAlign: "center",
        backgroundColor: props.isDragging ? "green" : "white",
      }}
    >
      {contents.text}
    </div>
  );
}
