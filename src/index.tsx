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
              acceptedTypes={["BLOCK", "CONTAINER"]}
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
        acceptedTypes={["BLOCK", "CONTAINER"]}
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

/**
 * Manage all rows
 */
const ROW_ACCEPTS_DROPS_FROM: DraggableTypes[] = ["BLOCK", "CONTAINER", "ROW"];
function RowsContainerView({
  rows,
  onDrop,
}: {
  rows: RowContainer[];
  onDrop: OnDropFunc;
}): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: "50px",
      }}
    >
      {rows.map((rowItem, rowIdx) => {
        return (
          <React.Fragment key={rowIdx}>
            <DropContainer
              key={`pre_row_drop_${rowIdx}`}
              dropLocation="PRE_ROW"
              acceptedTypes={ROW_ACCEPTS_DROPS_FROM}
              coordinates={{ rowIdx }}
              orientation={"VERTICAL"}
              onDrop={onDrop}
            />
            <BlockContainersView
              rowContainer={rowItem}
              coordinates={{ rowIdx }}
              onDrop={onDrop}
            />
          </React.Fragment>
        );
      })}
      <DropContainer
        key={`post_row_drop_${rows.length}`}
        dropLocation="PRE_ROW"
        acceptedTypes={ROW_ACCEPTS_DROPS_FROM}
        coordinates={{ rowIdx: rows.length }}
        orientation={"VERTICAL"}
        onDrop={onDrop}
      />
    </div>
  );
}

/**
 * Manage layout of containers within a row
 */
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
  // const [props, drag] = useDrag(
  //   () => ({
  //     type: "BLOCK",
  //     item: coordinates,
  //     collect: (monitor) => {
  //       return {
  //         isDragging: !!monitor.isDragging(),
  //       };
  //     },
  //   }),
  //   [rowContainer, coordinates, onDrop]
  // );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        // opacity: props.isDragging ? "50%" : "100%",
      }}
      // ref={drag}
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
      {
        id: 1,
        orientation: "VERTICAL",
        containerType: "CONTAINER",
        contents: [
          { id: 3, text: "Los" },
          { id: 4, text: "de la" },
          { id: 5, text: "culpa" },
        ],
      },
    ],
  },
  {
    id: 1,
    orientation: "HORIZONTAL",
    containerType: "ROW",
    containers: [
      {
        id: 3,
        orientation: "VERTICAL",
        containerType: "CONTAINER",
        contents: [
          { id: 6, text: "Hello" },
          { id: 7, text: "GoodBye" },
          { id: 8, text: "Again" },
        ],
      },
      {
        id: 4,
        orientation: "VERTICAL",
        containerType: "CONTAINER",
        contents: [
          { id: 9, text: "Betty" },
          { id: 10, text: "La Fea" },
          { id: 11, text: "Mercedes" },
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

/**
 * Helper for incrementing id's on things
 */
let ID_START = 20;
function incrementAndGetId(): number {
  ID_START++;
  return ID_START;
}

function App() {
  const [blocks, setBlocks] = useState<RowContainer[]>(() => {
    return FAKE_DATA;
  });

  console.log("blocks are ", blocks);

  const onDrop: OnDropFunc = (type, fromCoords, toCoords) => {
    const sameRow = fromCoords.rowIdx === toCoords.rowIdx;
    const sameContainer = fromCoords?.containerIdx === toCoords?.containerIdx;

    // Coordinate information
    const oldSubContainerIdx = fromCoords?.subContainerIdx;
    const newSubContainerIdx = toCoords?.subContainerIdx;
    const oldContainerIdx = fromCoords?.containerIdx;
    const newContainerIdx = toCoords?.containerIdx;
    const oldRowIdx = fromCoords.rowIdx;
    const newRowIdx = toCoords.rowIdx;

    // Mutable copy
    const copyOfBlocks = [...blocks];

    // Movements will be placed with first an addition, and then the subtraction
    // of the old item
    switch (type) {
      case "BLOCK":
        console.log("Request to move block from ", fromCoords, "to ", toCoords);
        const isMovingToNewRow =
          newContainerIdx == null && newSubContainerIdx == null;

        const fromRowRef = copyOfBlocks[oldRowIdx];
        const fromContainerRef = fromRowRef.containers[oldContainerIdx!!];

        if (isMovingToNewRow) {
          console.log("Existing block to new row");
          // Add to new row
          const newRow: RowContainer = {
            id: incrementAndGetId(),
            orientation: "HORIZONTAL",
            containerType: "ROW",
            containers: [
              {
                id: incrementAndGetId(),
                orientation: "HORIZONTAL", // change this later,
                containerType: "CONTAINER",
                contents: [fromContainerRef.contents[oldSubContainerIdx!!]],
              },
            ],
          };

          // Add block as new full row with single container
          copyOfBlocks.splice(newRowIdx, 0, newRow);

          // Remove the block from the old position
          const removalIdx = newRowIdx > oldRowIdx ? oldRowIdx : oldRowIdx + 1;

          const containerWithRemoval =
            copyOfBlocks[removalIdx].containers[oldContainerIdx!!];
          containerWithRemoval.contents.splice(oldSubContainerIdx!!, 1);

          // Remove the old container altogether if empty
          if (containerWithRemoval.contents.length === 0) {
            copyOfBlocks[removalIdx].containers.splice(oldContainerIdx!!, 1);
          }

          // Remove the row altogether if empty
          if (copyOfBlocks[removalIdx].containers.length === 0) {
            copyOfBlocks.splice(removalIdx, 1);
          }

          setBlocks(copyOfBlocks);
          return;
        }

        // Same row and container
        if (
          sameRow &&
          sameContainer &&
          oldContainerIdx != null &&
          oldSubContainerIdx != null &&
          newSubContainerIdx != null
        ) {
          const oldContainerRef =
            copyOfBlocks[oldRowIdx].containers[oldContainerIdx];
          const movedBlock = oldContainerRef.contents[oldSubContainerIdx];
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
          const oldContainerRef =
            copyOfBlocks[oldRowIdx].containers[oldContainerIdx];
          const movedBlock = oldContainerRef.contents[oldSubContainerIdx];

          // Add block into the new container at the specified position
          const newContainerRef =
            copyOfBlocks[newRowIdx].containers[newContainerIdx];
          newContainerRef.contents.splice(newSubContainerIdx, 0, movedBlock);
          console.log("old container idx" + oldContainerIdx);

          // Remove the old idx at the old position. No index manipulation needed
          oldContainerRef.contents.splice(oldSubContainerIdx, 1);

          // Remove container if there are no contents
          if (oldContainerRef.contents.length === 0) {
            copyOfBlocks[oldRowIdx].containers.splice(oldContainerIdx, 1);
          }

          setBlocks(copyOfBlocks);
          return;
        }

        // In between containers
        if (
          newSubContainerIdx == null &&
          newContainerIdx != null &&
          oldContainerIdx != null &&
          oldSubContainerIdx != null &&
          oldRowIdx === newRowIdx
        ) {
          // Make a new container at index
          const oldContainerRef =
            copyOfBlocks[oldRowIdx].containers[oldContainerIdx];
          const movedblock = oldContainerRef.contents[oldSubContainerIdx];
          const newFilledContainer: BlockContainer = {
            id: incrementAndGetId(), // THIS WILL BE REPLACED
            orientation: oldContainerRef.orientation,
            containerType: "CONTAINER",
            contents: [movedblock],
          };

          // Add the new container
          copyOfBlocks[oldRowIdx].containers.splice(
            newContainerIdx,
            0,
            newFilledContainer
          );

          // Find where the old block is in the new ordering
          const removalIdx =
            newContainerIdx > oldContainerIdx
              ? oldContainerIdx
              : oldContainerIdx + 1;

          // Remove the old idx at the old position. No index manipulation needed
          const containerToRemove =
            copyOfBlocks[oldRowIdx].containers[removalIdx];
          containerToRemove.contents.splice(oldSubContainerIdx, 1);

          // Remove container if there are no contents
          if (containerToRemove.contents.length === 0) {
            copyOfBlocks[oldRowIdx].containers.splice(removalIdx, 1);
          }

          setBlocks(copyOfBlocks);
          return;
        }

        return;

      case "CONTAINER":
        if (!(oldRowIdx === newRowIdx)) {
          console.log("Different rows!");
          return;
        }

        // Implement container movement
        const oldContainerRef =
          copyOfBlocks[oldRowIdx].containers[oldContainerIdx!!];

        if (newSubContainerIdx != null) {
          console.log("Move container into container");
          const blocksInOldContainer = oldContainerRef.contents;
          const newContainerRef =
            copyOfBlocks[oldRowIdx].containers[newContainerIdx!!];

          // Add all blocks into new container
          newContainerRef.contents.splice(
            newSubContainerIdx,
            0,
            ...blocksInOldContainer
          );

          // Remove old container
          copyOfBlocks[oldRowIdx].containers.splice(oldContainerIdx!!, 1);
          setBlocks(copyOfBlocks);
          return;
        }

        // Move container to another container idx
        if (oldContainerIdx != null && newContainerIdx != null) {
          console.log("moving container to new index");
          // Add the container to the new index
          copyOfBlocks[oldRowIdx].containers.splice(
            newContainerIdx,
            0,
            oldContainerRef
          );

          const removalIdx =
            newContainerIdx > oldContainerIdx
              ? oldContainerIdx
              : oldContainerIdx + 1;

          // Remove the container at the shifted index
          copyOfBlocks[oldRowIdx].containers.splice(removalIdx, 1);
          setBlocks(copyOfBlocks);
          return;
        }

        return;
    }
  };

  return (
    <div className="App">
      <DndProvider backend={HTML5Backend}>
        <RowsContainerView rows={blocks} onDrop={onDrop} />
        {/* <BlockContainersView
          rowContainer={blocks}
          coordinates={{ rowIdx: 0 }}
          onDrop={onDrop}
        /> */}
      </DndProvider>
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
