import P5 from "p5";
import type { PageSketchHooks } from "ywnrtza/src/common/types";
import {
  CachedAssetLoader,
  loadCommonFonts,
  loadCommonImages,
} from "ywnrtza/src/common/assets";
import { loadRawTexts, wrapText } from "ywnrtza/src/text";
import { getColors } from "ywnrtza/src/common/colors";
import {
  Clock,
  clockOptionsFromPreset,
  randomClockPreset,
} from "ywnrtza/src/page-sketches/clock";
import { inToMm } from "ywnrtza/src/common/utils";
import { clockPresetToUrl } from "./url";
import { qrcanvas } from "qrcanvas";
import { cmyk, PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  canvasToBuffer,
  downloadFileFromUrl,
  drawAlignedText,
  getAlignedTextSize,
  mmToPts,
  randomDate,
} from "./utils";

// main

async function generateZine(p: P5) {
  const N_CLOCKS = 2;
  const CLOCK_SIZE_MM = 150;
  const BASE_URL = "https://gfrancine.gitlab.io/ywnrtza-clock";

  const clocks: {
    date: Date;
    clockBuffer: ArrayBuffer;
    qrCodeBuffer: ArrayBuffer;
  }[] = [];

  const assetLoader = new CachedAssetLoader(p);
  const hooks: PageSketchHooks = {
    colors: getColors(p),
    fonts: await loadCommonFonts(p),
    images: await loadCommonImages(p),
    rawTexts: await loadRawTexts(),
    ...assetLoader.getSketchHooks(),
  };

  // generate clock images
  for (let i = 0; i < N_CLOCKS; i++) {
    console.log("generating clock #" + i);
    const preset = randomClockPreset();
    const baseDate = randomDate();

    // clock
    const width = inToMm(300) * CLOCK_SIZE_MM, // size mm * 300ppi
      height = inToMm(300) * CLOCK_SIZE_MM;
    const pg = p.createGraphics(width, height);
    pg.noSmooth();
    const getP = () => pg;
    const clock = new Clock(getP, hooks, {
      ...clockOptionsFromPreset(preset, getP, hooks),
      baseDate,
    });
    await clock.setup();
    clock.draw(0, 0, width, height);
    const clockBuffer = await canvasToBuffer(pg.elt);

    // qrcode
    const url = clockPresetToUrl(preset, BASE_URL);
    const qrCodeCanvas: HTMLCanvasElement = qrcanvas({ data: url });
    const qrCodeBuffer = await canvasToBuffer(qrCodeCanvas);

    clocks.push({
      date: baseDate,
      qrCodeBuffer,
      clockBuffer,
    });
  }

  // PDF Generation
  // --------
  console.log("Generating PDF");
  const DESIGNED_PDF_PATH = "clock-assets/proof-16jun2026.pdf";
  const FONT_PATH = "assets/fonts/GeistPixel-Square.otf";
  const OUT_W = mmToPts(70),
    OUT_H = mmToPts(200);
  const OUT_MARGIN = mmToPts(3);

  const outPdf = await PDFDocument.create();
  outPdf.registerFontkit(fontkit);

  // load pre-designed pages
  // https://github.com/gfrancine/f-impose/blob/master/src/components/App.tsx
  // https://github.com/gfrancine/f-impose/blob/master/src/presets/helpers.ts
  /*
  
  Specs:
  1. front cover
  2. 2 clocks
  [last]. back cover
  
  */
  console.log("loading designed pages");
  const designedPdfBuffer = await fetch(DESIGNED_PDF_PATH).then((res) =>
    res.arrayBuffer(),
  );
  const designedPdf = await PDFDocument.load(designedPdfBuffer);
  const designedPages = await outPdf.embedPages(designedPdf.getPages());

  // embed fonts
  const fontBuffer = await fetch(FONT_PATH).then((res) => res.arrayBuffer());
  const font = await outPdf.embedFont(fontBuffer);

  // add cover
  console.log("generating pages");
  // const coverPage = (await outPdf.copyPages(designedPdf, [0]))[0];
  // outPdf.addPage(coverPage);
  const FULL_PAGE_RECT = {
    x: 0,
    y: 0,
    width: OUT_W,
    height: OUT_H,
  };
  const coverPage = outPdf.addPage([OUT_W, OUT_H]);
  coverPage.drawPage(designedPages[0], FULL_PAGE_RECT);

  // add pages, part 1
  for (let i = 0; i < 2; i++) {
    console.log("generating page #" + i);
    const page = outPdf.addPage([OUT_W, OUT_H]);
    const clockImg = await outPdf.embedPng(clocks[0].clockBuffer);
    // page.drawImage(clockImg, FULL_PAGE_RECT);

    const dateStr = wrapText(clocks[0].date.toString(), 10).join("\n");
    const textSize = getAlignedTextSize(dateStr, { font, size: 6, leading: 7 });
    page.drawRectangle({
      width: textSize.w,
      height: textSize.h,
      y: 0,
      x: OUT_W / 2 - textSize.w / 2,
      borderWidth: 1,
      borderColor: cmyk(0, 0, 0, 1),
    });

    drawAlignedText(page, dateStr, {
      font,
      size: 6,
      leading: 7,
      align: "center",
      x: OUT_W / 2,
      y: 0,
      color: cmyk(0, 0, 0, 1),
    });
  }

  // save PDF
  // https://github.com/gfrancine/f-impose/blob/master/src/utils.ts
  console.log("saving output pdf");
  const outPdfUint8Array = await outPdf.save();
  const outPdfBlob = new Blob([outPdfUint8Array as BlobPart], {
    type: "application/pdf",
  });
  const outPdfUrl = URL.createObjectURL(outPdfBlob);
  await downloadFileFromUrl(outPdfUrl, "output.pdf");
  console.log("done!");
}

function sketch(p: P5) {
  p.setup = async () => {
    // p.noSmooth();
  };

  p.keyPressed = async () => {
    if (p.key === "s") await generateZine(p);
  };
}

export default sketch;
