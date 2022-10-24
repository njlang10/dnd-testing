import { render } from "react-dom";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import React, { useState } from "react";

export type ContainerOrientation = "HORIZONTAL" | "VERTICAL";
export type ContainerType = "ROW" | "CONTAINER";
export type DraggableTypes = ContainerType | "BLOCK";
export type DropLocation =
  | "PRE_ROW"
  | "POST_ROW"
  | "PRE_CONTAINER"
  | "POST_CONTAINER"
  | "PRE_BLOCK"
  | "POST_BLOCK";

export type Coordinates = {
  rowIdx: number;
  containerIdx?: number;
  subContainerIdx?: number;
};
export type BlockContents = { id: number; text: string };
export type BlockContainer = {
  id: number;
  orientation: ContainerOrientation;
  containerType: ContainerType;
  contents: BlockContents[];
};
export type RowContainer = {
  id: number;
  orientation: ContainerOrientation;
  containerType: ContainerType;
  containers: BlockContainer[];
};

export type OnDropFunc = (
  droppedItemType: DraggableTypes,
  droppedItemCoords: Coordinates,
  droppedToCoords: Coordinates
) => void;

function SingleBlock({
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

function DropContainer({
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

function BlockContainerView({
  container,
  coordinates,
  onDrop,
}: {
  container: BlockContainer;
  coordinates: Coordinates;
  onDrop: OnDropFunc;
}): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection:
          container.orientation === "HORIZONTAL" ? "row" : "column",
        width: "100%",
        minHeight: "100%",
      }}
    >
      {container.contents.map((individualBlock, blockIdx) => {
        return (
          <>
            <DropContainer
              key={`pre_block_${JSON.stringify(coordinates)}_${blockIdx}`}
              dropLocation="PRE_BLOCK"
              acceptedTypes={["BLOCK"]}
              coordinates={{ ...coordinates, subContainerIdx: blockIdx }}
              orientation={container.orientation}
              onDrop={onDrop}
            />
            <SingleBlock
              key={`block_${JSON.stringify(coordinates)}_${blockIdx}}`}
              contents={individualBlock}
              coordinates={{ ...coordinates, subContainerIdx: blockIdx }}
            />
          </>
        );
      })}
      <DropContainer
        key={`post_block_${JSON.stringify(coordinates)}_${
          container.contents.length
        }`}
        dropLocation="POST_BLOCK"
        acceptedTypes={["BLOCK"]}
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

const CONTAINER_LAYOUT: ContainerOrientation = "HORIZONTAL";
const CONTAINER_ACCEPTS_DROPS_FROM: DraggableTypes[] = [
  "BLOCK",
  "CONTAINER",
  "ROW",
];

function BlockContainersView({
  rowContainer,
  coordinates,
  onDrop,
}: {
  rowContainer: RowContainer;
  coordinates: Coordinates;
  onDrop: OnDropFunc;
}): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
      }}
    >
      {rowContainer.containers.map((singleContainer, containerIdx) => {
        return (
          <>
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
          </>
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

const FAKE_DATA: RowContainer[] = [
  {
    id: 0,
    orientation: "HORIZONTAL",
    containerType: "ROW",
    containers: [
      {
        id: 0,
        orientation: "HORIZONTAL",
        containerType: "CONTAINER",
        contents: [
          { id: 0, text: "Hello" },
          { id: 1, text: "GoodBye" },
          { id: 2, text: "Again" },
        ],
      },
    ],
  },
  {
    id: 0,
    orientation: "HORIZONTAL",
    containerType: "ROW",
    containers: [
      {
        id: 0,
        orientation: "VERTICAL",
        containerType: "CONTAINER",
        contents: [
          { id: 0, text: "Hello" },
          { id: 1, text: "GoodBye" },
          { id: 2, text: "Again" },
        ],
      },
    ],
  },
];

const CONTAINERS: RowContainer = {
  id: 0,
  orientation: "HORIZONTAL",
  containerType: "ROW",
  containers: [
    {
      id: 0,
      orientation: "HORIZONTAL",
      containerType: "CONTAINER",
      contents: [
        { id: 0, text: "Hello" },
        { id: 1, text: "GoodBye" },
        { id: 2, text: "Again" },
      ],
    },
    {
      id: 1,
      orientation: "VERTICAL",
      containerType: "CONTAINER",
      contents: [
        { id: 3, text: "New" },
        { id: 4, text: "Phone" },
        { id: 5, text: "Who dis?" },
      ],
    },
  ],
};

let ID_START = 20;

function incrementAndGetId(): number {
  ID_START++;
  return ID_START;
}

// const CONTAINER: BlockContainer = {
//   id: 0,
//   orientation: "HORIZONTAL",
//   containerType: "CONTAINER",
//   contents: [
//     { id: 0, text: "Hello" },
//     { id: 1, text: "GoodBye" },
//     { id: 2, text: "Again" },
//   ],
// };

function App() {
  const [blocks, setBlocks] = useState<RowContainer>(() => {
    return CONTAINERS;
  });

  console.log("blocks are ", blocks);

  const onDrop: OnDropFunc = (type, fromCoords, toCoords) => {
    const sameRow = fromCoords.rowIdx === toCoords.rowIdx;
    const sameContainer = fromCoords?.containerIdx === toCoords?.containerIdx;

    const copyOfBlocks = { ...blocks };

    // Movements will be placed with first an addition, and then the subtraction
    // of the old item
    switch (type) {
      case "BLOCK":
        const oldSubContainerIdx = fromCoords?.subContainerIdx;
        const newSubContainerIdx = toCoords?.subContainerIdx;
        const oldContainerIdx = fromCoords?.containerIdx;
        const newContainerIdx = toCoords?.containerIdx;

        // Same row and container
        if (
          sameRow &&
          sameContainer &&
          oldContainerIdx != null &&
          oldSubContainerIdx != null &&
          newSubContainerIdx != null
        ) {
          const oldContainerRef = copyOfBlocks.containers[oldContainerIdx];
          const movedBlock =
            copyOfBlocks.containers[oldContainerIdx].contents[
              oldSubContainerIdx
            ];
          // Add it in
          oldContainerRef.contents.splice(newSubContainerIdx, 0, movedBlock);

          // Since we are indexed to the left, we need to add 1 to our right padding if we
          // move from a further position, to a shorter position
          const removalIdx =
            newSubContainerIdx > oldSubContainerIdx
              ? oldSubContainerIdx
              : oldSubContainerIdx + 1;
          // Remove the old idx
          oldContainerRef.contents.splice(removalIdx, 1);
          setBlocks(copyOfBlocks);
          return;
        }

        // Same Row, different container
        if (
          sameRow &&
          !sameContainer &&
          oldContainerIdx != null &&
          oldSubContainerIdx != null &&
          newSubContainerIdx != null &&
          newContainerIdx != null
        ) {
          const oldContainerRef = copyOfBlocks.containers[oldContainerIdx];
          const movedBlock =
            copyOfBlocks.containers[oldContainerIdx].contents[
              oldSubContainerIdx
            ];

          // Add block into the new container at the specified position
          const newContainerRef = copyOfBlocks.containers[newContainerIdx];
          newContainerRef.contents.splice(newSubContainerIdx, 0, movedBlock);

          // Remove the old idx at the old position. No index manipulation needed
          oldContainerRef.contents.splice(oldContainerIdx, 1);

          // Remove container if there are no contents
          if (oldContainerRef.contents.length === 0) {
            copyOfBlocks.containers.splice(oldContainerIdx, 1);
          }

          setBlocks(copyOfBlocks);
          return;
        }

        // In between containers
        if (
          newSubContainerIdx == null &&
          newContainerIdx != null &&
          oldContainerIdx != null &&
          oldSubContainerIdx != null
        ) {
          // Make a new container at index
          const oldContainerRef = copyOfBlocks.containers[oldContainerIdx];
          const movedblock = oldContainerRef.contents[oldSubContainerIdx];
          const newFilledContainer: BlockContainer = {
            id: incrementAndGetId(), // THIS WILL BE REPLACED
            orientation: oldContainerRef.orientation,
            containerType: "CONTAINER",
            contents: [movedblock],
          };

          // Add the new container
          copyOfBlocks.containers.splice(
            newContainerIdx,
            0,
            newFilledContainer
          );

          // Find where the old container is in the new ordering
          const removalIdx =
            newContainerIdx > oldContainerIdx
              ? oldContainerIdx
              : oldContainerIdx + 1;

          // Remove the old idx at the old position. No index manipulation needed
          const containerToRemove = copyOfBlocks.containers[removalIdx];
          containerToRemove.contents.splice(oldSubContainerIdx, 1);

          // Remove container if there are no contents
          if (containerToRemove.contents.length === 0) {
            copyOfBlocks.containers.splice(removalIdx, 1);
          }

          setBlocks(copyOfBlocks);
          return;
        }

        return;
    }
  };

  return (
    <div className="App">
      <DndProvider backend={HTML5Backend}>
        <BlockContainersView
          rowContainer={blocks}
          coordinates={{ rowIdx: 0 }}
          onDrop={onDrop}
        />
      </DndProvider>
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
