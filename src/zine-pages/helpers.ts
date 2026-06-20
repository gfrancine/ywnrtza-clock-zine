import P5 from "p5";
import type { PageSketchHooks } from "ywnrtza/src/common/types";
import {
  Clock,
  clockOptionsFromPreset,
  randomClockPreset,
  type ClockPreset,
} from "ywnrtza/src/page-sketches/clock";
import { inToMm } from "ywnrtza/src/common/utils";
import { clockPresetToUrl } from "../url";
import { qrcanvas } from "qrcanvas";
import { cmyk, PDFFont, PDFImage, PDFPage, type Color } from "pdf-lib";
import {
  canvasToBlob,
  getMmToPx,
  mmToPts,
  randomDate,
  splitIntoLines,
} from "../utils";
import type { PageContext, ZineContext } from ".";
import { footer } from "./components";

// export const MARGINS_MM = {
//   t: 2,
//   b: 2,
//   i: 3,
//   o: 3,
// }

export type RandomClockParams = {
  p: P5;
  hooks: PageSketchHooks;
  baseUrl: string;
  clockSizeMm: number;
  resolution: number; // ppi;
  baseDate?: Date;
  clockPreset?: Partial<ClockPreset>;
};

export type RandomClockResult = {
  date: Date;
  clockBlob: Blob;
  qrCodeBlob: Blob;
};

export async function randomClock({
  p,
  hooks,
  baseUrl,
  clockSizeMm,
  resolution,
  clockPreset,
  baseDate,
}: RandomClockParams): Promise<RandomClockResult> {
  const preset = { ...randomClockPreset(), ...clockPreset };
  baseDate = baseDate || randomDate();

  // clock
  const width = inToMm(resolution) * clockSizeMm, // size mm * 300ppi
    height = inToMm(resolution) * clockSizeMm;
  const pg = p.createGraphics(width, height);
  pg.noSmooth();
  pg.background(255);
  const getP = () => pg;
  const clock = new Clock(getP, hooks, {
    ...clockOptionsFromPreset(preset, getP, hooks),
    baseDate,
  });
  await clock.setup();
  clock.draw(0, 0, width, height);
  const clockBlob = await canvasToBlob(pg.elt);
  pg.remove();

  // qrcode
  const url = clockPresetToUrl(preset, baseUrl);
  const qrCodeCanvas: HTMLCanvasElement = qrcanvas({ data: url });
  const qrCodeBlob = await canvasToBlob(qrCodeCanvas);

  return {
    date: baseDate,
    clockBlob,
    qrCodeBlob,
  };
}

// prettier-ignore
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday",
              "Thursday", "Friday", "Saturday"];
// prettier-ignore
const MONTHS = ["January", "February", "March",
                "April", "May", "June",
                "July", "August", "September",
                "October", "November", "December"]

// for two-digit time string numbers ("00:00:00")
const pad2 = (n: number) => n.toString().padStart(2, "0");

export function getFmtDateStrComponents(date: Date) {
  const day = DAYS[date.getDay()];
  const m = MONTHS[date.getMonth()];
  return {
    day,
    day3: day.slice(0, 3),
    d: date.getDate(),
    m,
    m3: m.slice(0, 3),
    y: date.getFullYear(),
    hour: pad2(date.getHours()),
    min: pad2(date.getMinutes()),
    sec: pad2(date.getSeconds()),
  };
}

/**
 * ```txt
 * Monday
 * 15 Jun 2026
 * 23:00:00
 * ```
 */
export function to3LineDateString(date: Date) {
  const { day, d, m3, y, hour, min, sec } = getFmtDateStrComponents(date);
  return `${day}\n${d} ${m3} ${y}\n${hour}:${min}:${sec}`;
}

/**
 * ```txt
 * Monday 15 Jun 2026
 * 23:00:00
 * ```
 */
export function to2LineDateString(date: Date) {
  const { day, d, m3, y, hour, min, sec } = getFmtDateStrComponents(date);
  return `${day} ${d} ${m3} ${y}\n${hour}:${min}:${sec}`;
}

export function getAlignedTextSize(
  str: string,
  {
    font,
    size,
    leading = size,
  }: {
    font: PDFFont;
    size: number;
    leading?: number;
  },
) {
  let maxW = 0;
  const lines = splitIntoLines(str);
  lines.forEach((line) => {
    const w = font.widthOfTextAtSize(line, size);
    if (w > maxW) maxW = w;
    return [line, w];
  });
  const maxLineH = font.heightAtSize(size, { descender: true });
  const totalH = leading * lines.length + Math.max(leading, maxLineH) - leading;
  return { w: maxW, h: totalH };
}

export function drawAlignedText(
  page: PDFPage,
  str: string,
  {
    font,
    size,
    leading = size,
    align = "left",
    x = 0,
    y = 0,
    color,
  }: {
    align: "left" | "center" | "right";
    font: PDFFont;
    size: number;
    leading?: number;
    x: number;
    y: number;
    color?: Color;
  },
) {
  const lines: [line: string, width: number][] = splitIntoLines(str).map(
    (line) => {
      const w = font.widthOfTextAtSize(line, size);
      return [line, w];
    },
  );
  const maxLineH = font.heightAtSize(size, { descender: true });
  const totalH = leading * lines.length + Math.max(leading, maxLineH) - leading;

  lines.forEach(([line, width], i) => {
    const lineX =
      align === "left" ? x : align === "center" ? x - width / 2 : x - width;

    page.drawText(line, {
      x: lineX,
      y: y + totalH - (i + 1) * leading,
      size,
      lineHeight: leading,
      color,
      font,
    });
  });
}

export function getPdfDrawingHelpers({
  outW,
  outH,
}: {
  outW: number;
  outH: number;
}) {
  const fullPageRect = { width: outW, height: outH };
  /** DRY helper; because pdf-lib draws from the bottom-left */
  const fromTop = (y: number, h: number = 0) => outH - y - h;

  /** makes it easier to just drop in the values from illustrator */
  const whiteRectMm = (
    page: PDFPage,
    x: number,
    yFromTop: number,
    w: number,
    h: number,
  ) =>
    page.drawRectangle({
      x: mmToPts(x),
      y: fromTop(mmToPts(yFromTop), mmToPts(h)),
      width: mmToPts(w),
      height: mmToPts(h),
      color: cmyk(0, 0, 0, 0),
    });

  const drawImageMm = (
    page: PDFPage,
    image: PDFImage,
    x: number,
    yFromTop: number,
    w: number,
    h: number,
  ) => {
    whiteRectMm(page, x, yFromTop, w, h); // cover up the back just incase

    page.drawImage(image, {
      x: mmToPts(x),
      y: fromTop(mmToPts(yFromTop), mmToPts(h)),
      width: mmToPts(w),
      height: mmToPts(h),
    });
  };

  return {
    fullPageRect,
    fromTop,
    whiteRectMm,
    drawImageMm,
  };
}

/** DRY helpers for common p5.js-based page operations */
export function getP5PageHelpers(ctx: ZineContext) {
  const { outPdf, outW, outH, outWMm, outHMm, resolution, p } = ctx;

  const setupPage = () => {
    const mmToPx = getMmToPx(resolution);
    const pg = p.createGraphics(mmToPx(outWMm), mmToPx(outHMm));
    return { pg, mmToPx };
  };

  // render the canvas into the PDF and cleans up
  const renderToPage = async (pageCtx: PageContext, pg: P5.Graphics) => {
    const { page } = pageCtx;
    const renderedPage = await canvasToBlob(pg.elt).then((blob) =>
      blob.arrayBuffer(),
    );
    const renderedPageImg = await outPdf.embedPng(renderedPage);
    page.drawImage(renderedPageImg, { x: 0, y: 0, width: outW, height: outH });
    pg.remove();
    footer(page, ctx, pageCtx); // omit?
  };

  return { setupPage, renderToPage };
}
