import { render } from "react-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import React, { useState } from "react";
import { RowsContainerView } from "./components/RowsContainerView";
import { BlockContainer } from "./components/BlockContainerView";
import { incrementAndGetId } from "./shared/IdIncrement";
import { FAKE_DATA } from "./data/FakeData";

// CORE TYPES
export type ContainerOrientation = "HORIZONTAL" | "VERTICAL";
export type ContainerType = "ROW" | "CONTAINER";
export type DraggableTypes = ContainerType | "BLOCK";

export type Coordinates = {
  rowIdx: number;
  containerIdx?: number;
  subContainerIdx?: number;
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

/**
 * HEY THERE! Welcome to the Drag And Drop (DnD) testing playground. The idea here was to
 * get a sense of how it would be to make a drag and drop grid which allowed the following:
 * - Rows can have N Containers, which can hold N Blocks, and can all be rearranged within eachother
 * - Containers can be oriented horizontally, OR vertically
 * 
 * Assumptions Made:
 * - This manages all state currently client side only, but could extend to persist on a server
 * - The color coding is simply for better understanding where dropping can occur, but could 
 * easily be removed to be hidden until drag
 * - There is no current way to "add" a block, although this could be made
 * - There is no current way to reorient a container, although this could be made
 * 
 * Things to note:
 * 1) If you take too long to interact, Codesandbox may throw an untrue, compilation error
 * which simply is not true
 * 2) the onDrop() function is GIANT because this was made as a prototype
 
 */

function App() {
  // This would likely come from a network call, so would
  // potentially need to change to a useEffect()
  const [blocks, setBlocks] = useState<RowContainer[]>(() => {
    return FAKE_DATA;
  });

  const [movement, setMovement] = useState<string | null>(null);

  // NOTE: This should be decomposed into pieces, but for deomonstration's sake it exists
  // as a single function
  const onDrop: OnDropFunc = (type, fromCoords, toCoords) => {
    const itemType = type;
    let toType = null;

    if (toCoords?.containerIdx != null && toCoords?.subContainerIdx != null) {
      toType = "SUBCONTAINER";
    }

    if (toCoords?.containerIdx != null && toCoords?.subContainerIdx == null) {
      toType = "CONTAINER";
    }

    if (toCoords?.containerIdx == null && toCoords?.subContainerIdx == null) {
      toType = "ROW";
    }

    setMovement(
      `Moving a ${itemType} to a ${toType}, from coordinates ${JSON.stringify(
        fromCoords
      )} to coordinates ${JSON.stringify(toCoords)}`
    );

    const sameRow = fromCoords.rowIdx === toCoords.rowIdx;
    const sameContainer = fromCoords!!.containerIdx === toCoords!!.containerIdx;

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
        if (
          sameRow &&
          sameContainer &&
          (newSubContainerIdx === oldSubContainerIdx ||
            newSubContainerIdx!! - oldSubContainerIdx!! === 1)
        ) {
          // No-op, same location
          return;
        }
        const movingBlock =
          copyOfBlocks[oldRowIdx].containers[oldContainerIdx!!].contents[
            oldSubContainerIdx!!
          ];

        const fromRowRef = copyOfBlocks[oldRowIdx];
        const fromContainerRef = fromRowRef.containers[oldContainerIdx!!];

        if (isMovingToNewRowAndContainer) {
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
        copyOfBlocks[newRowIdx].containers[newContainerIdx!!].contents.splice(
          newSubContainerIdx!!,
          0,
          movingBlock
        );

        const removalIdx =
          !sameContainer ||
          (sameContainer && newSubContainerIdx!! > oldSubContainerIdx!!)
            ? oldSubContainerIdx!!
            : oldSubContainerIdx!! + 1;

        copyOfBlocks[oldRowIdx].containers[oldContainerIdx!!].contents.splice(
          removalIdx,
          1
        );

        if (
          copyOfBlocks[oldRowIdx].containers[oldContainerIdx!!].contents
            .length === 0
        ) {
          copyOfBlocks[oldRowIdx].containers.splice(oldContainerIdx!!, 1);
        }

        if (copyOfBlocks[oldRowIdx].containers.length === 0) {
          copyOfBlocks.splice(oldRowIdx, 1);
        }

        setBlocks(copyOfBlocks);
        return;

      case "CONTAINER":
        if (
          sameRow &&
          (sameContainer ||
            (newContainerIdx!! - oldContainerIdx!! === 1 &&
              newSubContainerIdx == null))
        ) {
          // No-op, same location
          return;
        }

        const movingContainer =
          copyOfBlocks[oldRowIdx].containers[oldContainerIdx!!];
        // Container to new row
        if (isMovingToNewRowAndContainer) {
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
            copyOfBlocks.splice(oldRowIdx, 1);
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
          copyOfBlocks.splice(oldRowIdx, 1);
        }

        setBlocks(copyOfBlocks);
        return;

      case "ROW":
        if (
          oldRowIdx === newRowIdx ||
          (newRowIdx - oldRowIdx === 1 && newContainerIdx == null)
        ) {
          // No-op, same location
          return;
        }

        const movingRow = copyOfBlocks[oldRowIdx];
        // Move entire row to new row idx
        if (
          oldContainerIdx == null &&
          newContainerIdx == null &&
          oldSubContainerIdx == null &&
          newSubContainerIdx == null
        ) {
          copyOfBlocks.splice(newRowIdx, 0, movingRow);

          const removalIdx = newRowIdx > oldRowIdx ? oldRowIdx : oldRowIdx + 1;
          copyOfBlocks.splice(removalIdx, 1);

          setBlocks(copyOfBlocks);
          return;
        }

        // Move containers of row into an existing row at a starting index as full containers
        if (newContainerIdx != null && newSubContainerIdx == null) {
          // Add all containers to new row
          copyOfBlocks[newRowIdx].containers.splice(
            newContainerIdx,
            0,
            ...movingRow.containers
          );

          copyOfBlocks.splice(oldRowIdx, 1);
          setBlocks(copyOfBlocks);
          return;
        }

        // Move all blocks from all containers in a row into an existing container
        let indexOffset = 0;
        for (const container of movingRow.containers) {
          copyOfBlocks[newRowIdx].containers[newContainerIdx!!].contents.splice(
            newSubContainerIdx!! + indexOffset,
            0,
            ...container.contents
          );
          indexOffset += container.contents.length;
        }

        copyOfBlocks.splice(oldRowIdx, 1);
        setBlocks(copyOfBlocks);
        return;
    }
  };

  return (
    <div className="App">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 style={{ textAlign: "center" }}>
          Welcome to Drag and Drop Explorer!
        </h1>
        <div style={{ textAlign: "center" }}>
          Objects that are WHITE, GREEN, OR BLUE can be dragged to any PINK,
          BLUE, OR GREEN location. Objects are indexed as (# / # / #), referring
          to ROW / CONTAINER / SUBCONTAINER
        </div>
        <div>
          <h3 style={{ textAlign: "center" }}>Expected Behavior</h3>
          <ul>
            <li>
              A WHITE BLOCK dragged to a PINK ROW results in a new ROW with a
              SINGLE BLOCK{" "}
            </li>
            <li>
              A WHITE BLOCK dragged to a BLUE CONTAINER results in a new
              CONTAINER within A ROW with a SINGLE BLOCK
            </li>
            <li>
              A WHITE BLOCK dragged to a GREEN CONTAINER results in that BLOCK
              being added to the GREEN CONTAINER ITEMS
            </li>
            <li>
              A GREEN CONTAINER dragged to a PINK ROW results in a new ROW with
              the GREEN CONTAINER and all blocks
            </li>
            <li>
              A GREEN CONTAINER dragged to a BLUE CONTAINER results in the
              movement of that container to the specified position in the ROW
            </li>
            <li>
              A GREEN CONTAINER dragged to a GREEN CONTAINER results in COMBINED
              CONTAINER of all blocks from both containers{" "}
            </li>
            <li>
              A BLUE CONTAINER dragged to a PINK ROW results in a new ROW with
              ALL CONTAINERS transferred
            </li>
            <li>
              A BLUE CONTAINER dragged to a GREEN CONTAINER results in all
              BLOCKS from the blue container transferred into the GREEN
              CONTAINER
            </li>
            <li>
              A BLUE CONTAINER dragged to a BLUE CONTAINER results in all
              CONTAINERS from the blue container transferred into specified ROW
            </li>
          </ul>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ textAlign: "center" }}>Drag Objects</h3>
            <ul>
              <li>White cards represent SINGLE BLOCKS</li>
              <li>Green containers represent BLOCK CONTAINERS within a row</li>
              <li>
                Blue rows represent the ENTIRE ROW of block contains and single
                blocks
              </li>
            </ul>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ textAlign: "center" }}>Drop Zones</h3>
            <ul>
              <li>Pink spaces represent a new ROW placement</li>
              <li>Blue spaces represent a new placement WITHIN A ROW</li>
              <li>
                Green spaces represent a new placement WITHIN A ROW SUBCONTAINER
              </li>
            </ul>
          </div>
        </div>
        <DndProvider backend={HTML5Backend}>
          <RowsContainerView rows={blocks} onDrop={onDrop} />
          {`Last movement: ${movement}`}
        </DndProvider>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
