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
          { id: 6, text: "Raphael" },
          { id: 7, text: "Mendez" },
          { id: 8, text: "Ramen Auto" },
        ],
      },
      {
        id: 4,
        orientation: "HORIZONTAL",
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

    const isMovingToNewRowAndContainer =
      newContainerIdx == null && newSubContainerIdx == null;
    const isMovingToNewContainer =
      newContainerIdx != null && newSubContainerIdx == null;

    // Mutable copy
    const copyOfBlocks = [...blocks];

    // Movements will be placed with first an addition, and then the subtraction
    // of the old item
    switch (type) {
      case "BLOCK":
        console.log("Request to move block from ", fromCoords, "to ", toCoords);

        const movingBlock =
          copyOfBlocks[oldRowIdx].containers[oldContainerIdx!!].contents[
            oldSubContainerIdx!!
          ];

        const fromRowRef = copyOfBlocks[oldRowIdx];
        const fromContainerRef = fromRowRef.containers[oldContainerIdx!!];

        if (isMovingToNewRowAndContainer) {
          console.log(
            "Existing block to non-existant, new row and new container"
          );
          // Add to new row
          const newRow: RowContainer = {
            id: incrementAndGetId(),
            orientation: "HORIZONTAL",
            containerType: "ROW",
            containers: [
              {
                id: incrementAndGetId(),
                orientation: "HORIZONTAL", // TODO: Change this later,
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

        if (isMovingToNewContainer) {
          console.log("Shifting block to new container");
          const newContainer: BlockContainer = {
            id: incrementAndGetId(),
            orientation: "HORIZONTAL", // TODO: Change this later
            containerType: "CONTAINER",
            contents: [fromContainerRef.contents[oldSubContainerIdx!!]],
          };

          // Add new container + block to existing row
          copyOfBlocks[newRowIdx].containers.splice(
            newContainerIdx,
            0,
            newContainer
          );

          // Remove from old container and place in new container. Choose the correct index
          // based off of this being the same row or not
          const removalIdx =
            (sameRow && newContainerIdx > oldContainerIdx!!) || !sameRow
              ? oldContainerIdx!!
              : oldContainerIdx!! + 1;

          copyOfBlocks[oldRowIdx].containers[removalIdx].contents.splice(
            oldSubContainerIdx!!,
            1
          );

          if (
            copyOfBlocks[oldRowIdx].containers[removalIdx].contents.length === 0
          ) {
            copyOfBlocks[oldRowIdx].containers.splice(removalIdx, 1);
          }

          if (copyOfBlocks[oldRowIdx].containers.length === 0) {
            copyOfBlocks.splice(oldRowIdx, 1);
          }

          setBlocks(copyOfBlocks);
          return;
        }

        // Moving a block into an already existing container
        // Move the block to it's spot inside a container
        console.log("Moving block into existing row and container");
        copyOfBlocks[newRowIdx].containers[newContainerIdx!!].contents.splice(
          newSubContainerIdx!!,
          0,
          movingBlock
        );

        const removalIdx =
          (sameRow && newContainerIdx!! > oldContainerIdx!!) || !sameRow
            ? oldContainerIdx!!
            : oldContainerIdx!! + 1;

        copyOfBlocks[oldRowIdx].containers[removalIdx].contents.splice(
          oldSubContainerIdx!!,
          1
        );

        if (
          copyOfBlocks[oldRowIdx].containers[removalIdx].contents.length === 0
        ) {
          copyOfBlocks[oldRowIdx].containers.splice(removalIdx, 1);
        }

        if (copyOfBlocks[oldRowIdx].containers.length === 0) {
          copyOfBlocks.splice(oldRowIdx, 1);
        }

        setBlocks(copyOfBlocks);
        return;

      case "CONTAINER":
        const movingContainer =
          copyOfBlocks[oldRowIdx].containers[oldContainerIdx!!];
        // Container to new row
        if (isMovingToNewRowAndContainer) {
          console.log("moving container to new row and container");
          // Add to new row
          const newRow: RowContainer = {
            id: incrementAndGetId(),
            orientation: "HORIZONTAL",
            containerType: "ROW",
            containers: [movingContainer],
          };
          copyOfBlocks.splice(newRowIdx, 0, newRow);

          // Remove the block from the old position
          const removalIdx = newRowIdx > oldRowIdx ? oldRowIdx : oldRowIdx + 1;

          copyOfBlocks[removalIdx].containers.splice(oldContainerIdx!!, 1);

          if (copyOfBlocks[removalIdx].containers.length === 0) {
            copyOfBlocks.splice(removalIdx, 1);
          }

          setBlocks(copyOfBlocks);
          return;
        }

        // Moving to a new container between or around containers
        if (
          oldSubContainerIdx == null &&
          newSubContainerIdx == null &&
          oldContainerIdx != null &&
          newContainerIdx != null
        ) {
          copyOfBlocks[newRowIdx].containers.splice(
            newContainerIdx,
            0,
            movingContainer
          );

          const removalIdx =
            (sameRow && newContainerIdx > oldContainerIdx!!) || !sameRow
              ? oldContainerIdx!!
              : oldContainerIdx!! + 1;

          copyOfBlocks[oldRowIdx].containers.splice(removalIdx, 1);

          if (copyOfBlocks[oldRowIdx].containers.length === 0) {
            copyOfBlocks.splice(oldRowIdx);
          }

          setBlocks(copyOfBlocks);
          return;
        }

        // Move ALL container contents into another container
        copyOfBlocks[newRowIdx].containers[newContainerIdx!!].contents.splice(
          newSubContainerIdx!!,
          0,
          ...movingContainer.contents
        );

        copyOfBlocks[oldRowIdx].containers.splice(oldContainerIdx!!, 1);
        if (copyOfBlocks[oldRowIdx].containers.length === 0) {
          copyOfBlocks.splice(oldRowIdx);
        }

        setBlocks(copyOfBlocks);
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
