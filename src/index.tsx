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

function InnerDropContainer({
  currentIdx,
  containerIdx,
  orientation,
  onDrop,
}: {
  currentIdx: number;
  containerIdx: number;
  orientation: ContainerOrientation;
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

  return (
    <div
      ref={drop}
      style={{
        width: orientation === "HORIZONTAL" ? "20px" : "100%",
        height: orientation === "VERTICAL" ? "20px" : "100%",
        backgroundColor: "pink",
        opacity: collectedProps.isOver ? "50%" : "100%",
      }}
    ></div>
  );
}

/**
 * Individual Block
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
    [currentIdx, containerIdx]
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
 * Single container which can be oriented horizontally or vertically
 */
function OrientableContainer({
  orientation,
  itemData,
  containerIdx,
  onItemDrop,
}: {
  orientation: ContainerOrientation;
  itemData: ItemData[];
  containerIdx: number;
  onItemDrop: (item: ItemData, idx: number, containerIdx: number) => void;
  // children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: orientation === "HORIZONTAL" ? "row" : "column",
        width: orientation === "HORIZONTAL" ? "100%" : "15%",
        height: orientation === "VERTICAL" ? "100%" : "30px",
        border: "3px solid #0971F1",
      }}
    >
      {itemData.map((item, currentIdx) => {
        return (
          <React.Fragment key={`wrapper-${currentIdx} - ${containerIdx}`}>
            {/* Left based dropcontainer */}
            <InnerDropContainer
              key={`drop-${currentIdx}-${containerIdx}`}
              currentIdx={currentIdx}
              orientation={orientation}
              onDrop={onItemDrop}
              containerIdx={containerIdx}
            />
            <BlockItem
              key={`item-${item.id}-${containerIdx}`}
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
        key={`drop-${itemData?.length}-end-${containerIdx}`}
        currentIdx={itemData?.length}
        containerIdx={containerIdx}
        orientation={orientation}
        onDrop={onItemDrop}
      />
    </div>
  );
}

function App() {
  const [blockitems, setItems] = useState<ItemData[][]>(() => [
    [
      { id: 0, text: "Hello", containerIdx: 0, currentIdx: 0 },
      { id: 1, text: "GoodBye", containerIdx: 0, currentIdx: 1 },
      { id: 2, text: "Again", containerIdx: 0, currentIdx: 2 },
    ],
    [
      { id: 0, text: "New", containerIdx: 0, currentIdx: 0 },
      { id: 1, text: "Phone", containerIdx: 0, currentIdx: 1 },
      { id: 2, text: "Who Dis?", containerIdx: 0, currentIdx: 2 },
    ],
  ]);

  console.log("items are ", blockitems);

  return (
    <div className="App">
      <DndProvider backend={HTML5Backend}>
        {blockitems.map((singleRow, rowIdx) => {
          return (
            <OrientableContainer
              orientation="HORIZONTAL"
              itemData={singleRow}
              containerIdx={rowIdx}
              onItemDrop={(
                item: ItemData,
                idx: number,
                containerIdx: number
              ) => {
                const newCopy = [...blockitems];
                const itemFromDiffRow = item?.containerIdx !== containerIdx;
                // Dropped item is from a different row. Remove from old and add to new
                if (itemFromDiffRow) {
                  console.log("diff containers");
                  // Remove from old container
                  const rowCopy = newCopy[item.containerIdx];
                  rowCopy.splice(item.currentIdx, 1);

                  // Place in new container
                  const newContainer = newCopy[containerIdx];
                  newContainer.splice(idx, 0, {
                    ...item,
                    containerIdx: containerIdx,
                    currentIdx: idx,
                  });
                  setItems(newCopy);
                  return;
                }

                const currentIdx = singleRow.findIndex(
                  (singleItem) => item.id === singleItem.id
                );

                // No-op, we moved in the same spot
                if (idx === currentIdx || idx === currentIdx + 1) {
                  return;
                }

                const copy = singleRow.filter(
                  (filtered) => filtered.id !== item.id
                );

                // Place in front
                if (idx === 0) {
                  copy.splice(0, 0, item);
                  newCopy[rowIdx] = copy;
                  setItems(newCopy);
                  return;
                }

                // // Place at back
                if (idx === blockitems?.length) {
                  copy.splice(blockitems?.length - 1, 0, item);
                  newCopy[rowIdx] = copy;
                  setItems(newCopy);
                  return;
                }

                // // Place in between
                copy.splice(currentIdx > idx ? idx : idx - 1, 0, item);
                newCopy[rowIdx] = copy;
                setItems(newCopy);
              }}
            />
          );
        })}
        {/* <OrientableContainer
          orientation="HORIZONTAL"
          itemData={blockitems[0]}
          onItemDrop={(item: ItemData, idx: number) => {
            const currentIdx = blockitems.findIndex(
              (singleItem) => item.id === singleItem.id
            );

            // No-op, we moved in the same spot
            if (idx === currentIdx || idx === currentIdx + 1) {
              return;
            }

            const copy = blockitems.filter(
              (filtered) => filtered.id !== item.id
            );

            // Place in front
            if (idx === 0) {
              copy.splice(0, 0, item);
              setItems(copy);
              return;
            }

            // // Place at back
            if (idx === blockitems?.length) {
              copy.splice(blockitems?.length - 1, 0, item);
              setItems(copy);
              return;
            }

            // // Place in between
            copy.splice(currentIdx > idx ? idx : idx - 1, 0, item);
            setItems(copy);
          }}
        /> */}
      </DndProvider>
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
