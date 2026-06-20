/*

PDF page presets for the zine -- some just drawing a pre-designed page 
(see clock-assets/designedpages.pdf), some basing off them closely and 
just drawing things on top, some generated from scratch with P5.

*/

import { PDFDocument, PDFEmbeddedPage, PDFFont, PDFPage } from "pdf-lib";
import { drawAlignedText, getAlignedTextSize, mmToPts } from "../utils";
import {
  randomClock,
  getPdfDrawingHelpers,
  to2LineDateString,
  type RandomClockParams,
  to3LineDateString,
} from "./helpers";
import { footer, oneLineDateStr } from "./components";
import type { LeftOrRight } from "ywnrtza/src/common/types";

export type ZineContext = {
  outPdf: PDFDocument;
  outW: number;
  outH: number;
  designedPages: PDFEmbeddedPage[];
  clockParams: RandomClockParams;
  font: PDFFont;
};

export type PageContext = {
  pageNumber: number;
  position: LeftOrRight;
};

/** cover pages + help pages */
export async function mainPages(ctx: ZineContext) {
  const { outPdf, outW, outH, designedPages, clockParams, font } = ctx;
  const { fullPageRect, whiteRectMm, fromTop, drawImageMm } =
    getPdfDrawingHelpers({ outW, outH });

  const baseDate = new Date(); // set to today
  const clock = await randomClock({
    ...clockParams,
    clockSizeMm: 100,
    clockPreset: {
      ...clockParams.clockPreset,
      // colors: "blackWhite",
    },
    baseDate,
  });
  const clockImage = await outPdf.embedPng(await clock.clockBlob.arrayBuffer());
  const qrImage = await outPdf.embedPng(await clock.qrCodeBlob.arrayBuffer());

  // covers

  const drawFrontCover = () => {
    // const coverPage = (await outPdf.copyPages(designedPdf, [0]))[0];
    // outPdf.addPage(coverPage);
    const page = outPdf.addPage([outW, outH]);
    page.drawPage(designedPages[0], fullPageRect);

    drawImageMm(page, clockImage, 3, 26.5, 63.5, 77);
    drawImageMm(page, qrImage, 29, 167, 12, 12);

    whiteRectMm(page, 21.5, 179, 27, 9);
    const str = "Generated on\n" + to2LineDateString(baseDate);
    const fontInfo = {
      font,
      size: 9,
      leading: 9,
    };
    const textBounds = getAlignedTextSize(str, fontInfo);
    drawAlignedText(page, str, {
      ...fontInfo,
      align: "center",
      x: mmToPts(35),
      y: fromTop(mmToPts(179), textBounds.h),
    });
  };

  const drawBackCover = () => {
    const page = outPdf.addPage([outW, outH]);
    page.drawPage(designedPages[1], fullPageRect);
    drawImageMm(page, clockImage, 3, 66, 64, 20);
  };

  // instruction help pages

  const drawOneLineDateText = oneLineDateStr(ctx, baseDate);

  const drawHelpPage1 = () => {
    const page = outPdf.addPage([outW, outH]);
    page.drawPage(designedPages[2], fullPageRect);
    whiteRectMm(page, 3, 20.7, 64, 3.15);
    drawOneLineDateText(page, 20.7);
  };

  const drawHelpPage2 = () => {
    const page = outPdf.addPage([outW, outH]);
    page.drawPage(designedPages[3], fullPageRect);
    whiteRectMm(page, 3, 144.5, 64, 3.15);
    drawOneLineDateText(page, 144.5);
  };

  return { drawFrontCover, drawBackCover, drawHelpPage1, drawHelpPage2 };
}

export async function drawEssayPage(ctx: ZineContext) {
  const { outPdf, outW, outH, designedPages, clockParams } = ctx;
  const { drawImageMm, whiteRectMm } = getPdfDrawingHelpers({ outW, outH });

  const clock = await randomClock({
    ...clockParams,
    clockSizeMm: 100,
  });
  const clockImage = await outPdf.embedPng(await clock.clockBlob.arrayBuffer());

  const page = outPdf.addPage([outW, outH]);
  page.drawPage(designedPages[4]);

  whiteRectMm(page, 3, 2, 64, 3.15);
  const drawOneLineDateText = oneLineDateStr(ctx, clock.date);
  drawOneLineDateText(page, 2);

  drawImageMm(page, clockImage, 3, 7.5, 64, 45);
}

export async function drawSimpleClockPage(
  ctx: ZineContext,
  pageCtx: PageContext,
) {
  const { outPdf, outW, outH, designedPages, clockParams, font } = ctx;
  const { fullPageRect, whiteRectMm, fromTop, drawImageMm } =
    getPdfDrawingHelpers({ outW, outH });

  const clock = await randomClock(clockParams);
  const clockImage = await outPdf.embedPng(await clock.clockBlob.arrayBuffer());
  const qrImage = await outPdf.embedPng(await clock.qrCodeBlob.arrayBuffer());

  const page = outPdf.addPage([outW, outH]);

  // clock
  page.drawImage(clockImage, {
    x: mmToPts(3),
    y: fromTop(mmToPts(3), mmToPts(80)),
    width: mmToPts(64),
    height: mmToPts(80),
  });

  // text + QR
  const fontInfo = {
    font,
    size: 9,
    leading: 9,
  };
  const str = to3LineDateString(clock.date);
  const textBounds = getAlignedTextSize(str, fontInfo);
  drawAlignedText(page, str, {
    ...fontInfo,
    align: "center",
    x: mmToPts(35),
    y: fromTop(mmToPts(85), textBounds.h),
  });

  drawImageMm(page, qrImage, 30, 96, 10, 10);

  // footer
  footer(page, ctx, pageCtx);
}

export async function drawSampleP5Page(ctx: ZineContext, pageCtx: PageContext) {
  const { outPdf, outW, outH, designedPages, clockParams, font } = ctx;
  const { fullPageRect, whiteRectMm, fromTop, drawImageMm } =
    getPdfDrawingHelpers({ outW, outH });
}
