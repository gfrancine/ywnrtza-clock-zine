/*

PDF page presets for the zine -- some just drawing a pre-designed page 
(see clock-assets/designedpages.pdf), some basing off them closely and 
just drawing things on top, some generated from scratch with P5.

*/

import { mmToPts, ptsToMm } from "../utils";
import {
  randomClock,
  drawAlignedText,
  getAlignedTextSize,
  getPdfDrawingHelpers,
  to2LineDateString,
  to3LineDateString,
  getP5PageHelpers,
  getClockP5Image,
  getFmtDateStrComponents,
} from "./helpers";
import {
  DATE_TEXT_SIZE_PTS,
  footer,
  getDateTextSizePx,
  oneLineDateStr,
  threeLineDateWithQrP5,
  threeLineDateWithQrInlineP5,
  ThreeLineDateP5,
  SmallQrCodeP5,
} from "./components";
import type { PageContext, ZineContext } from "./types";
import type { Callback } from "ywnrtza/src/common/types";

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
  const { clockParams, p } = ctx;
  const { setupPage, renderToPage } = getP5PageHelpers(ctx);
  const { pg, mmToPx, p5Ctx } = setupPage();
  pg.background(255);

  // clock image
  const clock = await randomClock(clockParams);
  const clockImg = await getClockP5Image(p5Ctx, clock);

  const clockRect = [
    mmToPx(3), // x
    mmToPx(2), // y
    pg.width - mmToPx(6), // w
    pg.height / 2 - mmToPx(2), // h
  ] as const;
  pg.image(clockImg, ...clockRect);

  const GAP = mmToPx(ptsToMm(DATE_TEXT_SIZE_PTS)) * 0.8;
  const dateQr = await threeLineDateWithQrP5(p5Ctx, ctx, { clock });
  dateQr.draw(pg.width / 2, clockRect[1] + clockRect[3] + GAP);

  await renderToPage(pageCtx, pg);
}

export async function drawDoubleClockPage(
  ctx: ZineContext,
  pageCtx: PageContext,
) {
  const { clockParams, resolution } = ctx;
  const { setupPage, renderToPage } = getP5PageHelpers(ctx);
  const { pg, mmToPx, p5Ctx } = setupPage();
  pg.background(255);

  let currentY = mmToPx(2);

  for (let i = 0; i < 2; i++) {
    const clock = await randomClock(clockParams);
    const clockImg = await getClockP5Image(p5Ctx, clock);
    const dateQr = await threeLineDateWithQrInlineP5(p5Ctx, ctx, { clock });
    const gap = getDateTextSizePx(resolution) * 0.3;

    dateQr.draw(pg.width / 2, currentY);
    currentY += dateQr.getSize().h + gap;

    const clockSize = [
      pg.width - mmToPx(6), // w
      pg.height * 0.4, // h
    ] as const;
    pg.image(clockImg, mmToPx(3), currentY, ...clockSize);
    currentY += clockSize[1] + gap;
  }

  await renderToPage(pageCtx, pg);
}

export async function drawQuadClockPage(
  ctx: ZineContext,
  pageCtx: PageContext,
) {
  //
  const { clockParams, resolution } = ctx;
  const { setupPage, renderToPage } = getP5PageHelpers(ctx);
  const { pg, mmToPx, p5Ctx } = setupPage();
  pg.background(255);

  let currentY = mmToPx(2);

  for (let i = 0; i < 4; i++) {
    const clock = await randomClock({ ...clockParams, clockSizeMm: 80 });
    const clockImg = await getClockP5Image(p5Ctx, clock);
    const dateQr = await threeLineDateWithQrInlineP5(p5Ctx, ctx, { clock });
    const gap = getDateTextSizePx(resolution) * 0.3;

    const clockSize = [
      pg.width * 0.65 - mmToPx(6), // w
      pg.height * 0.16, // h
    ] as const;

    const x =
      pageCtx.position === "left"
        ? mmToPx(3)
        : pg.width - clockSize[0] - mmToPx(3);

    dateQr.draw(x + clockSize[0] / 2, currentY);
    currentY += dateQr.getSize().h + gap;

    pg.image(clockImg, x, currentY, ...clockSize);
    currentY += clockSize[1] + gap;
  }

  await renderToPage(pageCtx, pg);
}

export async function drawClockAsClockPage(
  ctx: ZineContext,
  pageCtx: PageContext,
) {
  const { clockParams, sketchHooks } = ctx;
  const { setupPage, renderToPage } = getP5PageHelpers(ctx);
  const { pg, mmToPx, p5Ctx } = setupPage();
  pg.background(255);

  const clock = await randomClock(clockParams);
  const clockImg = await getClockP5Image(p5Ctx, clock);
  // const smallQr = await new SmallQrCodeP5(p5Ctx, ctx, {
  //   qrCodeBlob: clock.qrCodeBlob,
  // }).setup();

  const clockSize = [
    pg.width * 0.75, // w
    pg.height * 0.8, // h
  ] as const;

  pg.translate(mmToPx(70) / 2 - clockSize[0] / 2, mmToPx(2));

  // hour 'ticks'
  const RADIUS_SCALE = 1;

  for (let i = 0; i < 12; i++) {
    const hour = i === 0 ? 12 : i;
    const theta = (hour / 12) * (Math.PI * 2);
    const x =
        clockSize[0] / 2 +
        Math.sin(theta) * ((clockSize[0] / 2) * RADIUS_SCALE),
      y =
        clockSize[1] / 2 -
        Math.cos(theta) * ((clockSize[1] / 2) * RADIUS_SCALE);

    // if (hour === 6) {
    //   smallQr.draw(x-smallQr.size/2,y);
    //   continue;
    // }

    const {
      day3,
      d,
      m3,
      y2,
      hour: hr,
      min,
      sec,
    } = getFmtDateStrComponents(clock.date);
    const textStr = `${day3}\n${d} ${m3} ${y2}\n${hr}:${min}:${sec}`;
    pg.textFont(sketchHooks.fonts.geistPixelSquare);
    const textSize = mmToPx(ptsToMm(7));
    pg.textSize(textSize);
    pg.textLeading(textSize);
    pg.textAlign("center", "top");
    pg.text(textStr, x, y);
  }

  // hands
  // start working with a single size and stretch instead
  pg.push();
  pg.scale(1, clockSize[1] / clockSize[0]);
  const clockRadius = clockSize[0] / 2;
  const handWidth = clockRadius * 0.16;
  const seconds = clock.date.getSeconds(),
    minutes = clock.date.getMinutes(),
    hours = clock.date.getHours();

  const drawHandTransformed = (progress: number, drawHand: Callback) => {
    pg.push();
    pg.blendMode("multiply");
    pg.translate(clockRadius, clockRadius);
    pg.rotate(progress * Math.PI * 2 - Math.PI);
    pg.translate(-handWidth / 2, 0);
    drawHand();
    pg.pop();
  };

  drawHandTransformed(minutes / 60 + (seconds / 60) * (1 / 60), () => {
    const handLength = clockRadius * 1.1;
    pg.image(clockImg, 0, 0, handWidth, handLength);
  });

  drawHandTransformed((hours % 12) / 12 + (minutes / 60) * (1 / 12), () => {
    const handLength = clockRadius * 0.8;
    pg.image(clockImg, 0, 0, handWidth, handLength);
  });
  pg.pop();

  await renderToPage(pageCtx, pg);
}
