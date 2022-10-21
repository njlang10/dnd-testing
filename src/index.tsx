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
        minHeight: "100%",
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
        height: orientation === "VERTICAL" ? "25px" : "100%",
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
        height: "100%",
      }}
    >
      {container.contents.map((individualBlock, blockIdx) => {
        return (
          <>
            <DropContainer
              key={`pre_block_${coordinates}`}
              dropLocation="PRE_BLOCK"
              acceptedTypes={["BLOCK"]}
              coordinates={{ ...coordinates, subContainerIdx: blockIdx }}
              orientation={container.orientation}
              onDrop={onDrop}
            />
            <SingleBlock
              contents={individualBlock}
              coordinates={{ ...coordinates, subContainerIdx: blockIdx }}
            />
          </>
        );
      })}
      <DropContainer
        key={`post_block_${{ coordinates }}`}
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
const CONTAINER: BlockContainer = {
  id: 0,
  orientation: "HORIZONTAL",
  containerType: "CONTAINER",
  contents: [
    { id: 0, text: "Hello" },
    { id: 1, text: "GoodBye" },
    { id: 2, text: "Again" },
  ],
};

function App() {
  // const [blockitems, setItems] = useState<ItemData[][]>(() => [
  //   [
  //     { id: 0, text: "Hello", containerIdx: 0, currentIdx: 0 },
  //     { id: 1, text: "GoodBye", containerIdx: 0, currentIdx: 1 },
  //     { id: 2, text: "Again", containerIdx: 0, currentIdx: 2 },
  //   ],
  //   [
  //     { id: 0, text: "New", containerIdx: 0, currentIdx: 0 },
  //     { id: 1, text: "Phone", containerIdx: 0, currentIdx: 1 },
  //     { id: 2, text: "Who Dis?", containerIdx: 0, currentIdx: 2 },
  //   ],
  // ]);

  // console.log("items are ", blockitems);
  const [blocks, setBlocks] = useState<BlockContainer>(() => {
    return CONTAINER;
  });

  console.log("blocks are ", blocks);

  const onDrop: OnDropFunc = (type, fromCoords, toCoords) => {
    const sameRow = fromCoords.rowIdx === toCoords.rowIdx;
    const sameContainer = fromCoords?.containerIdx === toCoords?.containerIdx;

    const copyOfBlocks = { ...blocks };

    switch (type) {
      case "BLOCK":
        const oldRowIdx = fromCoords?.subContainerIdx;
        const newRowIdx = toCoords?.subContainerIdx;
        if (
          sameRow &&
          sameContainer &&
          oldRowIdx != null &&
          newRowIdx != null
        ) {
          const movedBlock = copyOfBlocks.contents[oldRowIdx];
          // Add it in
          copyOfBlocks.contents.splice(newRowIdx, 0, movedBlock);
          // Remove the old idx
          copyOfBlocks.contents.splice(
            oldRowIdx < newRowIdx ? oldRowIdx + 1 : oldRowIdx - 1,
            1
          );
        }

        setBlocks(copyOfBlocks);
        return;
    }
  };

  return (
    <div className="App">
      <DndProvider backend={HTML5Backend}>
        <BlockContainerView
          container={blocks}
          coordinates={{ rowIdx: 0, containerIdx: 0 }}
          onDrop={onDrop}
        />
      </DndProvider>
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
