import type P5 from "p5";
import type { PDFPage } from "pdf-lib";
import type { P5ComponentContext, PageContext, ZineContext } from "./types";
import {
  getFmtDateStrComponents,
  getPdfDrawingHelpers,
  drawAlignedText,
  getAlignedTextSize,
  to3LineDateString,
  type RandomClockResult,
} from "./helpers";
import { getMmToPx, mmToPts, ptsToMm } from "../utils";

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

export const DATE_TEXT_SIZE_PTS = 9;
export const SMALL_QR_SIZE_MM = 10;
export const getDateTextSizePx = (resolution: number) =>
  getMmToPx(resolution)(ptsToMm(DATE_TEXT_SIZE_PTS));
export const getSmallQrSizePx = (resolution: number) =>
  getMmToPx(resolution)(SMALL_QR_SIZE_MM);

export class ThreeLineDateP5 {
  private p5Ctx: P5ComponentContext;
  private ctx: ZineContext;
  date: Date;
  str: string;
  textSize: number;

  constructor(
    p5Ctx: P5ComponentContext,
    ctx: ZineContext,
    { date }: { date: Date },
  ) {
    this.p5Ctx = p5Ctx;
    this.ctx = ctx;
    this.date = date;
    this.str = to3LineDateString(date);
    const { resolution } = this.ctx;
    this.textSize = getDateTextSizePx(resolution);
  }

  private applyStyle() {
    const { pg, hooks } = this.p5Ctx;
    pg.textFont(hooks.fonts.geistPixelSquare);
    pg.textSize(this.textSize);
    pg.textLeading(this.textSize);
    pg.textAlign("center", "top");
    pg.fill(0);
  }

  getSize() {
    const { pg } = this.p5Ctx;
    pg.push();
    this.applyStyle();
    const { w, h } = pg.textBounds(this.str, 0, 0);
    pg.pop();
    return { w, h };
  }

  /** uses center-origin x because text is center-aligned */
  draw(x: number, y: number) {
    const { pg } = this.p5Ctx;
    pg.push();
    this.applyStyle();
    pg.text(this.str, x, y);
    pg.pop();
  }
}

export class SmallQrCodeP5 {
  private p5Ctx: P5ComponentContext;
  private ctx: ZineContext;
  private qrCodeBlob: Blob;
  qrImg?: P5.Image;
  size: number;

  constructor(
    p5Ctx: P5ComponentContext,
    ctx: ZineContext,
    { qrCodeBlob }: { qrCodeBlob: Blob },
  ) {
    this.p5Ctx = p5Ctx;
    this.ctx = ctx;
    this.qrCodeBlob = qrCodeBlob;
    const { resolution } = this.ctx;
    this.size = getSmallQrSizePx(resolution);
  }

  async setup() {
    const { hooks } = this.p5Ctx;
    const qrImgDataUrl = URL.createObjectURL(this.qrCodeBlob);
    this.qrImg = await hooks.loadImage(qrImgDataUrl);
    URL.revokeObjectURL(qrImgDataUrl);

    return this;
  }

  draw(x: number, y: number) {
    if (!this.qrImg) return;
    const { pg } = this.p5Ctx;
    pg.push();
    pg.image(this.qrImg, x, y, this.size, this.size);
    pg.pop();
  }
}

/** uses center-origin x */
export async function threeLineDateWithQrP5(
  p5Ctx: P5ComponentContext,
  ctx: ZineContext,
  { clock }: { clock: RandomClockResult },
) {
  const { date, qrCodeBlob } = clock;
  const dateText = new ThreeLineDateP5(p5Ctx, ctx, { date });
  const gap = dateText.textSize * 0.5;
  const qrCode = await new SmallQrCodeP5(p5Ctx, ctx, { qrCodeBlob }).setup();

  // not in the mood to use classes :')

  const getSize = () => ({
    w: Math.max(dateText.getSize().w, qrCode.size),
    h: dateText.getSize().h + gap + qrCode.size,
  });

  const draw = (x: number, y: number) => {
    dateText.draw(x, y);
    qrCode.draw(x - qrCode.size / 2, y + dateText.getSize().h + gap);
  };

  return { getSize, draw };
}

/** uses center-origin x */
export async function threeLineDateWithQrInlineP5(
  p5Ctx: P5ComponentContext,
  ctx: ZineContext,
  { clock }: { clock: RandomClockResult },
) {
  const { date, qrCodeBlob } = clock;

  const dateText = new ThreeLineDateP5(p5Ctx, ctx, { date });
  const dateTextSize = dateText.getSize();
  const qrCode = await new SmallQrCodeP5(p5Ctx, ctx, { qrCodeBlob }).setup();

  const GAP = dateText.textSize * 0.5;
  const totalWidth = qrCode.size + dateTextSize.w + GAP;

  const getSize = () => ({
    w: totalWidth,
    h: Math.max(qrCode.size, dateTextSize.h),
  });

  const draw = (x: number, y: number) => {
    dateText.draw(x - totalWidth / 2 + dateTextSize.w / 2, y);
    qrCode.draw(x + totalWidth / 2 - qrCode.size, y);
  };

  return { draw, getSize };
}
