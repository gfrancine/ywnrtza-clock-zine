import { inToMm, randomInRangeInt } from "ywnrtza/src/common/utils";
import { PDFFont, PDFPage, type Color } from "pdf-lib";

export function randomDate(start: Date = new Date(0), end: Date = new Date()) {
  return new Date(randomInRangeInt(start.getTime(), end.getTime()));
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject("no blob");
      else resolve(blob);
      // blob?.arrayBuffer().then((buffer) => resolve(buffer));
    });
  });
}

export function downloadFileFromUrl(url: string, fileName: string) {
  // const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // a.download = `clock-${i}-${clock.date.toString()}.png`;
  a.download = fileName;
  a.click();
  // URL.revokeObjectURL(url);
}

// https://github.com/gfrancine/f-impose/blob/master/src/utils.ts
export const mmToPts = (mm: number) => mm * 2.83465;
export const ptsToMm = (pt: number) => pt / 2.83465;

export type MmToPx = (mm: number) => number;
export const getMmToPx = (resolution: number) => (mm: number) =>
  inToMm(resolution) * mm;

// text box drawing utils
// sigh https://github.com/Hopding/pdf-lib/issues/701

// console.log(
//   font.widthOfTextAtSize("Foo Bar", 6),
//   font.widthOfTextAtSize("Foo Bar ", 6),
//   font.widthOfTextAtSize("Foo\nBar", 6), // it doesn't handle line returns
//   font.widthOfTextAtSize("Foo", 6),
//   font.heightAtSize(6),
// );

export function splitIntoLines(str: string) {
  return str.split("\n");
  // .map((line) => line.trim());
}
