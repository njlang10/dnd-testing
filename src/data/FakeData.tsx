import { RowContainer } from "..";
export const FAKE_DATA: RowContainer[] = [
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
          { id: 0, text: "One" },
          { id: 1, text: "Two" },
          { id: 2, text: "Three" },
        ],
      },
      {
        id: 1,
        orientation: "VERTICAL",
        containerType: "CONTAINER",
        contents: [
          { id: 3, text: "Four" },
          { id: 4, text: "Five" },
          { id: 5, text: "Six" },
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
          { id: 6, text: "Seven" },
          { id: 7, text: "Eight" },
          { id: 8, text: "Nine" },
        ],
      },
      {
        id: 4,
        orientation: "HORIZONTAL",
        containerType: "CONTAINER",
        contents: [
          { id: 9, text: "Ten" },
          { id: 10, text: "Eleven" },
          { id: 11, text: "Twelve" },
        ],
      },
    ],
  },
];
