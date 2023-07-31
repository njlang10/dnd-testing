import { useDrag } from "react-dnd";
import React from "react";
import { DropContainer } from "./DropContainer";
import { BlockContainerView } from "./BlockContainerView";
import {
  RowContainer,
  Coordinates,
  OnDropFunc,
  DraggableTypes,
  ContainerOrientation,
} from "../index";
export const CONTAINER_ACCEPTS_DROPS_FROM: DraggableTypes[] = [
  "BLOCK",
  "CONTAINER",
  "ROW",
];
export const CONTAINER_LAYOUT: ContainerOrientation = "HORIZONTAL";

export function BlockContainersView({
  rowContainer,
  coordinates,
  onDrop,
}: {
  rowContainer: RowContainer;
  coordinates: Coordinates;
  onDrop: OnDropFunc;
}): JSX.Element {
  const [props, drag] = useDrag(
    () => ({
      type: "ROW",
      item: coordinates,
      collect: (monitor) => {
        return {
          isDragging: !!monitor.isDragging(),
        };
      },
    }),
    [rowContainer, coordinates, onDrop]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        opacity: props.isDragging ? "50%" : "100%",
      }}
      ref={drag}
    >
      {rowContainer.containers.map((singleContainer, containerIdx) => {
        return (
          <React.Fragment
            key={`fragment_container_${JSON.stringify(
              coordinates
            )}_${containerIdx}`}
          >
            <DropContainer
              key={`pre_container_${JSON.stringify(
                coordinates
              )}_${containerIdx}`}
              dropLocation="PRE_CONTAINER"
              acceptedTypes={CONTAINER_ACCEPTS_DROPS_FROM}
              coordinates={{ ...coordinates, containerIdx: containerIdx }}
              orientation={CONTAINER_LAYOUT}
              onDrop={onDrop}
            />
            <BlockContainerView
              key={`block_container_${JSON.stringify(
                coordinates
              )}_${containerIdx}`}
              container={singleContainer}
              coordinates={{ ...coordinates, containerIdx: containerIdx }}
              onDrop={onDrop}
            />
          </React.Fragment>
        );
      })}
      <DropContainer
        key={`post_container_${JSON.stringify(coordinates)}_${
          rowContainer.containers.length
        }}`}
        dropLocation="POST_CONTAINER"
        acceptedTypes={CONTAINER_ACCEPTS_DROPS_FROM}
        coordinates={{
          ...coordinates,
          containerIdx: rowContainer.containers.length,
        }}
        orientation={CONTAINER_LAYOUT}
        onDrop={onDrop}
      />
    </div>
  );
}
