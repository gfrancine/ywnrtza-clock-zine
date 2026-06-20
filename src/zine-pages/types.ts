import type { PDFDocument, PDFEmbeddedPage, PDFFont, PDFPage } from "pdf-lib";
import type { RandomClockParams } from "./helpers";
import type {
  LeftOrRight,
  P5Context,
  PageSketchHooks,
} from "ywnrtza/src/common/types";
import type P5 from "p5";

export type ZineContext = {
  outPdf: PDFDocument;
  outW: number;
  outH: number;
  outWMm: number;
  outHMm: number;
  resolution: number;
  designedPages: PDFEmbeddedPage[];
  clockParams: RandomClockParams;
  font: PDFFont;
  p: P5;
  sketchHooks: PageSketchHooks;
};

export type PageContext = {
  page: PDFPage;
  pageNumber: number;
  position: LeftOrRight;
};

export type P5ComponentContext = {
  pg: P5Context;
  hooks: PageSketchHooks;
};
