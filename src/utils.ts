import { randomInRangeInt } from "ywnrtza/src/common/utils";
import { PDFFont, PDFPage, type Color } from "pdf-lib";

export function randomDate(start: Date = new Date(0), end: Date = new Date()) {
  return new Date(randomInRangeInt(start.getTime(), end.getTime()));
}

export function canvasToBuffer(
  canvas: HTMLCanvasElement,
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject("no blob");
      blob?.arrayBuffer().then((buffer) => resolve(buffer));
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

// text box drawing utils
// sigh https://github.com/Hopding/pdf-lib/issues/701

// console.log(
//   font.widthOfTextAtSize("Foo Bar", 6),
//   font.widthOfTextAtSize("Foo Bar ", 6),
//   font.widthOfTextAtSize("Foo\nBar", 6), // it doesn't handle line returns
//   font.widthOfTextAtSize("Foo", 6),
//   font.heightAtSize(6),
// );

function splitIntoLines(str: string) {
  return str.split("\n");
  // .map((line) => line.trim());
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
