import type { PDFPage } from "pdf-lib";
import type { PageContext, ZineContext } from ".";
import { getFmtDateStrComponents, getPdfDrawingHelpers } from "./helpers";
import { drawAlignedText, getAlignedTextSize, mmToPts } from "../utils";

/** a pseudo-justified one line date str (e.g. `Mon 01: 20: 20`) that stretches accross the margin */
export function oneLineDateStr(ctx: ZineContext, date: Date) {
  const { outW, outH, font } = ctx;
  const { fromTop } = getPdfDrawingHelpers({ outW, outH });

  const { day3, hour, min, sec } = getFmtDateStrComponents(date);
  const oneLineDateStr = `${day3} ${hour}: ${min}: ${sec}`
    .split(" ")
    .join(" ".repeat(12));

  /** only the Y position is needed */
  const drawOneLineDateText = (page: PDFPage, yFromTopMm: number) => {
    const fontInfo = {
      font,
      size: 9,
      leading: 9,
    };
    const textBounds = getAlignedTextSize(oneLineDateStr, fontInfo);
    drawAlignedText(page, oneLineDateStr, {
      ...fontInfo,
      align: "center",
      x: mmToPts(35), // center of the (70mm) page
      y: fromTop(mmToPts(yFromTopMm), textBounds.h),
    });
  };

  return drawOneLineDateText;
}

export function footer(page: PDFPage, ctx: ZineContext, pageCtx: PageContext) {
  const { outPdf, outW, outH, designedPages, clockParams, font } = ctx;
  const { fullPageRect, whiteRectMm, fromTop, drawImageMm } =
    getPdfDrawingHelpers({ outW, outH });

  const folioStr = `( ${pageCtx.pageNumber} )`;
  const leftStr =
    pageCtx.position === "left" ? folioStr : "Garlic Cracker Press";
  const rightStr =
    pageCtx.position === "right"
      ? folioStr
      : "You Will Never See This Clock Again";

  const fontInfo = {
    font,
    size: 8,
    leading: 9,
  };
  drawAlignedText(page, leftStr, {
    ...fontInfo,
    align: "left",
    x: mmToPts(3),
    y: mmToPts(2),
  });
  drawAlignedText(page, rightStr, {
    ...fontInfo,
    align: "right",
    x: mmToPts(70 - 3),
    y: mmToPts(2),
  });
}
