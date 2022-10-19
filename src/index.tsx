import { render } from "react-dom";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import React, { useState } from "react";

export type ContainerOrientation = "HORIZONTAL" | "VERTICAL";
export type DragTypes = "BLOCK" | "SUBCONTAINER";
export type ItemData = {
  id: number;
  text: string;
  containerIdx: number;
  currentIdx: number;
};
/**
 * Container to drop blocks on to
 */
function InnerDropContainer({
  currentIdx,
  containerIdx,
  orientation,
  fullWidth = false,
  onDrop,
}: {
  currentIdx: number;
  containerIdx: number;
  orientation: ContainerOrientation;
  fullWidth?: boolean;
  onDrop: (
    item: ItemData,
    newRowIndex: number,
    newContainerIndex: number
  ) => void;
}): JSX.Element {
  const [collectedProps, drop] = useDrop(
    () => ({
      accept: "BLOCK",
      drop: (movedItem: ItemData, _monitor) => {
        console.log(
          "request to drop item ",
          movedItem,
          " to row",
          currentIdx,
          "and container ",
          containerIdx
        );
        onDrop(movedItem, currentIdx, containerIdx);
      },
      collect: (monitor) => {
        return { isOver: !!monitor.isOver() };
      },
    }),
    [onDrop, currentIdx, containerIdx] // NOTE: This is important! If you don't add your deps, any state setting will be STALE
  );

  const width = fullWidth || orientation === "VERTICAL" ? "100%" : "20px";
  const height = fullWidth || orientation === "HORIZONTAL" ? "100%" : "20px";

  return (
    <div
      ref={drop}
      style={{
        width: width,
        height: height,
        backgroundColor: "pink",
        opacity: collectedProps.isOver ? "50%" : "100%",
      }}
    ></div>
  );
}

/**
 * Individual Block that holds content, and is a drag target
 */
function BlockItem({
  id,
  text,
  currentIdx,
  containerIdx,
}: {
  id: number;
  text: string;
  currentIdx: number;
  containerIdx: number;
}): JSX.Element {
  const [props, drag] = useDrag(
    () => ({
      type: "BLOCK",
      item: {
        id: id,
        text: text,
        containerIdx: containerIdx,
        currentIdx: currentIdx,
      },
      collect: (monitor) => {
        return {
          isDragging: !!monitor.isDragging(),
        };
      },
    }),
    [id, text, currentIdx, containerIdx]
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
      {text}
    </div>
  );
}

/**
 * Single container which can be oriented horizontally or vertically, and organizes blocks + manages dnd
 */
function OrientableContainer({
  orientation,
  itemData,
  containerIdx,
  isEndContainer = false,
  onItemDrop,
}: {
  orientation: ContainerOrientation;
  itemData: ItemData[];
  containerIdx: number;
  isEndContainer?: boolean;
  onItemDrop: (item: ItemData, idx: number, containerIdx: number) => void;
  // children: React.ReactNode;
}): JSX.Element {
  // Empty container base case
  if (itemData?.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: orientation === "HORIZONTAL" ? "row" : "column",
          width: orientation === "HORIZONTAL" ? "100%" : "15px",
          height: orientation === "VERTICAL" ? "100%" : "30px",
          border: "1px solid #0971F1",
        }}
      >
        <InnerDropContainer
          key={`drop-${0}-${containerIdx}-none`}
          currentIdx={0}
          orientation={orientation}
          onDrop={onItemDrop}
          containerIdx={containerIdx}
          fullWidth={true}
        />
      </div>
    );
  }

  // Container with data
  return (
    <div
      style={{
        display: "flex",
        flexDirection: orientation === "HORIZONTAL" ? "column" : "row",
        width: orientation === "HORIZONTAL" ? "100%" : "15%",
        height: orientation === "VERTICAL" ? "100%" : "30px",
      }}
    >
      <OrientableContainer
        key={containerIdx - 0.5}
        orientation={orientation}
        itemData={[]}
        isEndContainer={false}
        containerIdx={containerIdx - 0.5}
        onItemDrop={onItemDrop}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: orientation === "HORIZONTAL" ? "row" : "column",
          border: "1px solid #0971F1",
        }}
      >
        {itemData.map((item, currentIdx) => {
          return (
            <React.Fragment
              key={`wrapper-${currentIdx}-${containerIdx}-${item.id}`}
            >
              {/* Pre-block drop site */}
              <InnerDropContainer
                key={`drop-${currentIdx}-${containerIdx}-${item.id}`}
                currentIdx={currentIdx}
                orientation={orientation}
                onDrop={onItemDrop}
                containerIdx={containerIdx}
                fullWidth={false}
              />
              <BlockItem
                key={`item-${currentIdx}-${containerIdx}-${item.id}`}
                id={item.id}
                text={item.text}
                currentIdx={currentIdx}
                containerIdx={containerIdx}
              />
            </React.Fragment>
          );
        })}
        {/* End of row drop container */}
        <InnerDropContainer
          key={`drop-${itemData?.length}-${containerIdx}-endId`}
          currentIdx={itemData?.length}
          containerIdx={containerIdx}
          orientation={orientation}
          onDrop={onItemDrop}
          fullWidth={false}
        />
      </div>
      {/* End of container drop */}
      {isEndContainer && (
        <OrientableContainer
          key={containerIdx + 0.5}
          orientation={orientation}
          itemData={[]}
          containerIdx={containerIdx + 0.5}
          onItemDrop={onItemDrop}
        />
      )}
    </div>
  );
}

function App() {
  const [blockitems, setItems] = useState<ItemData[][]>(() => [
    [
      { id: 0, text: "Very", containerIdx: 0, currentIdx: 0 },
      { id: 1, text: "Particular", containerIdx: 0, currentIdx: 1 },
      { id: 2, text: "Set of skills", containerIdx: 0, currentIdx: 2 },
    ],
    [
      { id: 3, text: "New", containerIdx: 0, currentIdx: 0 },
      { id: 4, text: "Phone", containerIdx: 0, currentIdx: 1 },
      { id: 5, text: "Who Dis?", containerIdx: 0, currentIdx: 2 },
    ],
  ]);

  const onItemDrop = (
    item: ItemData,
    idx: number,
    containerIdx: number,
    rowIdx: number
  ) => {
    const newCopy = [...blockitems];
    const itemFromDiffRow = item?.containerIdx !== containerIdx;
    const itemDroppedInDummyContainer = containerIdx.toString().endsWith(".5");

    if (itemFromDiffRow) {
      // Remove from old container
      const rowCopy = newCopy[item.containerIdx];
      rowCopy.splice(item.currentIdx, 1);
    }

    // Item was moved to a placeholder container
    if (itemDroppedInDummyContainer) {
      // True up to a real index
      const newContainerIdx = containerIdx + 0.5;

      // Add item into new container
      newCopy.splice(newContainerIdx, 0, [
        { ...item, containerIdx: newContainerIdx, currentIdx: 0 },
      ]);

      // Remove empty containers
      const filteredCopy = newCopy.filter(
        (singleContainer) => singleContainer?.length > 0
      );

      setItems(filteredCopy);
      return;
    }

    // Dropped item is from a different row. Remove from old and add to new
    if (itemFromDiffRow) {
      // Place in new container
      const newContainer = newCopy[containerIdx];
      const newItem = {
        ...item,
        containerIdx: containerIdx,
        currentIdx: idx,
      };
      newContainer.splice(idx, 0, newItem);
      console.log("Containers after splice in");

      // Update indices
      for (let i = idx + 1; i < newContainer?.length; i++) {
        const nextItem = newContainer[i];
        nextItem["containerIdx"] = containerIdx;
        nextItem["currentIdx"] = i;
      }

      // Remove empty containers
      const filteredCopy = newCopy.filter(
        (singleContainer) => singleContainer?.length > 0
      );

      // Set UI state
      setItems(filteredCopy);
      return;
    }

    // We're moving in the same row, find where it exists now
    const rowCopy = newCopy[containerIdx];
    const currentIdx = rowCopy.findIndex(
      (singleItem) => item.id === singleItem.id
    );

    // No-op, we moved in the same spot
    if (idx === currentIdx || idx === currentIdx + 1) {
      return;
    }

    const copy = rowCopy.filter((filtered) => filtered.id !== item.id);

    // Place in front
    if (idx === 0) {
      copy.splice(0, 0, { ...item, containerIdx, currentIdx: idx });
      newCopy[containerIdx] = copy;
      setItems(newCopy);
      return;
    }

    // Place at back
    if (idx === blockitems?.length) {
      copy.splice(blockitems?.length - 1, 0, {
        ...item,
        containerIdx,
        currentIdx: idx,
      });
      newCopy[rowIdx] = copy;
      setItems(newCopy);
      return;
    }

    // Place in between
    copy.splice(currentIdx > idx ? idx : idx - 1, 0, {
      ...item,
      containerIdx,
      currentIdx: idx,
    });
    newCopy[rowIdx] = copy;

    // Set UI state
    setItems(newCopy);
  };

  console.log("items are ", blockitems);

  return (
    <div className="App">
      <DndProvider backend={HTML5Backend}>
        {blockitems.map((singleRow, rowIdx) => {
          return (
            <OrientableContainer
              key={rowIdx}
              orientation="HORIZONTAL"
              itemData={singleRow}
              containerIdx={rowIdx}
              isEndContainer={rowIdx === blockitems.length - 1}
              onItemDrop={(item: ItemData, idx: number, containerIdx: number) =>
                onItemDrop(item, idx, containerIdx, rowIdx)
              }
            />
          );
        })}
      </DndProvider>
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
