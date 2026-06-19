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
import { cmyk, PDFImage, PDFPage } from "pdf-lib";
import { canvasToBuffer, mmToPts, randomDate } from "../utils";

export type GenerateClockParams = {
  p: P5;
  hooks: PageSketchHooks;
  baseUrl: string;
  clockSizeMm: number;
  baseDate?: Date;
  clockPreset?: Partial<ClockPreset>;
};

export async function generateClock({
  p,
  hooks,
  baseUrl,
  clockSizeMm,
  clockPreset,
  baseDate,
}: GenerateClockParams) {
  const preset = { ...randomClockPreset(), ...clockPreset };
  baseDate = baseDate || randomDate();

  // clock
  const width = inToMm(300) * clockSizeMm, // size mm * 300ppi
    height = inToMm(300) * clockSizeMm;
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
  const clockBuffer = await canvasToBuffer(pg.elt);

  // qrcode
  const url = clockPresetToUrl(preset, baseUrl);
  const qrCodeCanvas: HTMLCanvasElement = qrcanvas({ data: url });
  const qrCodeBuffer = await canvasToBuffer(qrCodeCanvas);

  return {
    date: baseDate,
    qrCodeBuffer,
    clockBuffer,
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
    sec: pad2(date.getMinutes()),
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
  return `${day}\n${d} ${m3} ${y}\n${hour}${min}:${sec}`;
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
