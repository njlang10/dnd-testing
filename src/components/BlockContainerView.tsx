import { useDrag } from "react-dnd";
import React from "react";
import { SingleBlock } from "./SingleBlock";
import { DropContainer } from "./DropContainer";
import {
  Coordinates,
  OnDropFunc,
  ContainerOrientation,
  ContainerType,
} from "../index";

export type BlockContents = { id: number; text: string };
export type BlockContainer = {
  id: number;
  orientation: ContainerOrientation;
  containerType: ContainerType;
  contents: BlockContents[];
};

/**
 * Renders blocks surrounded by dropzones
 */
export function BlockContainerView({
  container,
  coordinates,
  onDrop,
}: {
  container: BlockContainer;
  coordinates: Coordinates;
  onDrop: OnDropFunc;
}): JSX.Element {
  const [props, drag] = useDrag(
    () => ({
      type: "CONTAINER",
      item: coordinates,
      collect: (monitor) => {
        return {
          isDragging: !!monitor.isDragging(),
        };
      },
    }),
    [container, coordinates, onDrop]
  );

  return (
    <div
      style={{
        display: "flex",
        cursor: "grab",
        flexDirection:
          container.orientation === "HORIZONTAL" ? "row" : "column",
        width: "100%",
        minHeight: "100%",
        opacity: props.isDragging ? "50%" : "100%",
      }}
      ref={drag}
    >
      {container.contents.map((individualBlock, blockIdx) => {
        return (
          <React.Fragment
            key={`fragment_container_block_${JSON.stringify(
              coordinates
            )}_${blockIdx}`}
          >
            <DropContainer
              key={`pre_block_${JSON.stringify(coordinates)}_${blockIdx}`}
              dropLocation="PRE_BLOCK"
              acceptedTypes={["BLOCK", "CONTAINER", "ROW"]}
              coordinates={{ ...coordinates, subContainerIdx: blockIdx }}
              orientation={container.orientation}
              onDrop={onDrop}
            />
            <SingleBlock
              key={`block_${JSON.stringify(coordinates)}_${blockIdx}}`}
              contents={individualBlock}
              coordinates={{ ...coordinates, subContainerIdx: blockIdx }}
            />
          </React.Fragment>
        );
      })}
      <DropContainer
        key={`post_block_${JSON.stringify(coordinates)}_${
          container.contents.length
        }`}
        dropLocation="POST_BLOCK"
        acceptedTypes={["BLOCK", "CONTAINER", "ROW"]}
        coordinates={{
          ...coordinates,
          subContainerIdx: container.contents.length,
        }}
        orientation={container.orientation}
        onDrop={onDrop}
      />
    </div>
  );
}
