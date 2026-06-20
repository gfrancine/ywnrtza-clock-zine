/*

PDF page presets for the zine -- some just drawing a pre-designed page 
(see clock-assets/designedpages.pdf), some basing off them closely and 
just drawing things on top, some generated from scratch with P5.

*/

import { PDFDocument, PDFEmbeddedPage, PDFFont, PDFPage } from "pdf-lib";
import { canvasToBlob, getMmToPx, mmToPts, ptsToMm } from "../utils";
import {
  randomClock,
  drawAlignedText,
  getAlignedTextSize,
  getPdfDrawingHelpers,
  to2LineDateString,
  type RandomClockParams,
  to3LineDateString,
  getP5PageHelpers,
} from "./helpers";
import {
  DATE_TEXT_SIZE_PTS,
  footer,
  oneLineDateStr,
  threeLineDateWithQr,
  threeLineDateWithQrInline,
  type P5ComponentContext,
} from "./components";
import type { LeftOrRight, PageSketchHooks } from "ywnrtza/src/common/types";
import type P5 from "p5";
import { inToMm } from "ywnrtza/src/common/utils";

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

  const drawFrontCover = (pageCtx: PageContext) => {
    const { page } = pageCtx;
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

  const drawBackCover = (pageCtx: PageContext) => {
    const { page } = pageCtx;
    page.drawPage(designedPages[1], fullPageRect);
    drawImageMm(page, clockImage, 3, 66, 64, 20);
  };

  // instruction help pages

  const drawOneLineDateText = oneLineDateStr(ctx, baseDate);

  const drawHelpPage1 = (pageCtx: PageContext) => {
    const { page } = pageCtx;
    page.drawPage(designedPages[2], fullPageRect);
    whiteRectMm(page, 3, 20.7, 64, 3.15);
    drawOneLineDateText(page, 20.7);
  };

  const drawHelpPage2 = (pageCtx: PageContext) => {
    const { page } = pageCtx;
    page.drawPage(designedPages[3], fullPageRect);
    whiteRectMm(page, 3, 144.5, 64, 3.15);
    drawOneLineDateText(page, 144.5);
  };

  return { drawFrontCover, drawBackCover, drawHelpPage1, drawHelpPage2 };
}

export async function drawEssayPage(ctx: ZineContext, pageCtx: PageContext) {
  const { outPdf, outW, outH, designedPages, clockParams } = ctx;
  const { drawImageMm, whiteRectMm } = getPdfDrawingHelpers({ outW, outH });
  const { page } = pageCtx;

  const clock = await randomClock({
    ...clockParams,
    clockSizeMm: 100,
  });
  const clockImage = await outPdf.embedPng(await clock.clockBlob.arrayBuffer());

  page.drawPage(designedPages[4]);

  whiteRectMm(page, 3, 2, 64, 3.15);
  const drawOneLineDateText = oneLineDateStr(ctx, clock.date);
  drawOneLineDateText(page, 2);

  drawImageMm(page, clockImage, 3, 7.5, 64, 45);
}

export async function drawBasicClockPage(
  ctx: ZineContext,
  pageCtx: PageContext,
) {
  const { outPdf, outW, outH, clockParams, font } = ctx;
  const { fromTop, drawImageMm } = getPdfDrawingHelpers({ outW, outH });
  const { page } = pageCtx;

  const clock = await randomClock(clockParams);
  const clockImage = await outPdf.embedPng(await clock.clockBlob.arrayBuffer());
  const qrImage = await outPdf.embedPng(await clock.qrCodeBlob.arrayBuffer());

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

/** a demo of the basic clock page drawn in P5 */
export async function drawBasicClockPageP5(
  ctx: ZineContext,
  pageCtx: PageContext,
) {
  const { clockParams, p, sketchHooks } = ctx;
  const { setupPage, renderToPage } = getP5PageHelpers(ctx);
  const { pg, mmToPx } = setupPage();
  pg.background(255);
  const p5Ctx: P5ComponentContext = { pg, hooks: sketchHooks };

  // clock image
  const clock = await randomClock(clockParams);
  const clockImgDataUrl = URL.createObjectURL(clock.clockBlob);
  const clockImg = await p.loadImage(clockImgDataUrl);
  URL.revokeObjectURL(clockImgDataUrl);
  const clockRect = [
    mmToPx(3), // x
    mmToPx(2), // y
    pg.width - mmToPx(6), // w
    pg.height / 2 - mmToPx(2), // h
  ] as const;
  pg.image(clockImg, ...clockRect);

  const GAP = mmToPx(ptsToMm(DATE_TEXT_SIZE_PTS)) * 0.8;
  await threeLineDateWithQrInline(p5Ctx, ctx, {
    x: pg.width / 2,
    y: clockRect[1] + clockRect[3] + GAP,
    clock,
  });

  await renderToPage(pageCtx, pg);
}

export async function drawDoubleClockPage(
  ctx: ZineContext,
  pageCtx: PageContext,
) {
  //
}

export async function drawQuadClockPage(
  ctx: ZineContext,
  pageCtx: PageContext,
) {
  //
}

export async function drawClockAsClockPage(
  ctx: ZineContext,
  pageCtx: PageContext,
) {
  //
}
