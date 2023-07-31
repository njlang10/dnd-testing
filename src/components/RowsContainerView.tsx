import React from "react";
import { DropContainer } from "./DropContainer";
import { DraggableTypes, RowContainer, OnDropFunc } from "../index";
import { BlockContainersView } from "./BlockContainersView";

/**
 * Manage all rows
 */
const ROW_ACCEPTS_DROPS_FROM: DraggableTypes[] = ["BLOCK", "CONTAINER", "ROW"];
export function RowsContainerView({
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
