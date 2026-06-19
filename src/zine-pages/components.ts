import type { PDFPage } from "pdf-lib";
import type { PageContext } from ".";
import { getFmtDateStrComponents, getPdfDrawingHelpers } from "./helpers";
import { drawAlignedText, getAlignedTextSize, mmToPts } from "../utils";

/** a pseudo-justified one line date str (e.g. `Mon 01: 20: 20`) that stretches accross the margin */
export function oneLineDateStr(ctx: PageContext, date: Date) {
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
