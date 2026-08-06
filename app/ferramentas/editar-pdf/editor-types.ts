export type EditorElementType = "text" | "image" | "rectangle" | "ellipse" | "line" | "arrow" | "draw" | "highlight" | "cover" | "signature";

export type EditorPoint = { x: number; y: number };

export type EditorElement = {
  id: string;
  pageId: string;
  type: EditorElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  z: number;
  locked: boolean;
  text?: string;
  imageUrl?: string;
  imageBytes?: Uint8Array;
  imageFormat?: "png" | "jpg";
  points?: EditorPoint[];
  color: string;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  lineStyle: "solid" | "dashed" | "dotted";
  fontFamily: "Arial" | "Helvetica" | "Times New Roman" | "Courier" | "Georgia" | "Verdana";
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
  lineHeight: number;
};

export type EditorPage = {
  id: string;
  sourceIndex: number | null;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  thumbnailUrl?: string;
  excluded: boolean;
  originalIndex: number;
};

export type EditorSnapshot = { pages: EditorPage[]; elements: EditorElement[] };
