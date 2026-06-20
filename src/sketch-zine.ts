import P5 from "p5";
import type { LeftOrRight, PageSketchHooks } from "ywnrtza/src/common/types";
import {
  CachedAssetLoader,
  loadCommonFonts,
  loadCommonImages,
} from "ywnrtza/src/common/assets";
import { loadRawTexts, wrapText } from "ywnrtza/src/text";
import { getColors } from "ywnrtza/src/common/colors";
import { PDFDocument, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { mmToPts } from "./utils";
import {
  drawEssayPage,
  drawBasicClockPage,
  drawBasicClockPageP5,
  mainPages,
  type ZineContext,
} from "./zine-pages";

// main

async function generateZine(p: P5) {
  const OUT_W_MM = 70,
    OUT_H_MM = 200,
    OUT_W = mmToPts(OUT_W_MM),
    OUT_H = mmToPts(OUT_H_MM);
  const CLOCK_SIZE_MM = 150;
  const RESOLUTION = 300;
  const BASE_URL = "https://gfrancine.gitlab.io/ywnrtza-clock";
  const DESIGNED_PDF_PATH = "clock-assets/designedpages.pdf";
  const FONT_PATH = "assets/fonts/GeistPixel-Square.otf";

  const previewFrame = document.getElementById(
    "zine-pdf-preview",
  ) as HTMLIFrameElement;
  previewFrame.classList.add("visible");

  const assetLoader = new CachedAssetLoader(p);
  const hooks: PageSketchHooks = {
    colors: getColors(p),
    fonts: await loadCommonFonts(p),
    images: await loadCommonImages(p),
    rawTexts: await loadRawTexts(),
    ...assetLoader.getSketchHooks(),
  };

  // PDF Generation
  // --------

  console.log("Generating PDF");
  const outPdf = await PDFDocument.create();
  outPdf.registerFontkit(fontkit);

  // load pre-designed pages
  // https://github.com/gfrancine/f-impose/blob/master/src/components/App.tsx
  // https://github.com/gfrancine/f-impose/blob/master/src/presets/helpers.ts
  console.log("loading designed pages");
  const designedPdfBuffer = await fetch(DESIGNED_PDF_PATH).then((res) =>
    res.arrayBuffer(),
  );
  const designedPdf = await PDFDocument.load(designedPdfBuffer);
  const designedPages = await outPdf.embedPages(designedPdf.getPages());

  // embed fonts
  const fontBuffer = await fetch(FONT_PATH).then((res) => res.arrayBuffer());
  const font = await outPdf.embedFont(fontBuffer);

  const zineCtx: ZineContext = {
    outPdf,
    outW: OUT_W,
    outH: OUT_H,
    outWMm: OUT_W_MM,
    outHMm: OUT_H_MM,
    resolution: RESOLUTION,
    designedPages,
    clockParams: {
      p,
      hooks,
      baseUrl: BASE_URL,
      clockSizeMm: CLOCK_SIZE_MM,
      resolution: RESOLUTION,
    },
    font,
    p,
    sketchHooks: hooks,
  };

  // page generation
  console.log("generating pages");
  const startTime = performance.now();
  const drawPromises = []; // generate pages in parallel

  let pageNumber = 1;
  const addPage = () => outPdf.addPage([OUT_W, OUT_H]);

  /** creates a page context with a new page */
  const newPageCtx = () => ({
    page: addPage(),
    pageNumber, // increment manually
    position: pageNumber % 2 === 0 ? "right" : ("left" as LeftOrRight),
  });

  const drawClockPages = (length: number) => {
    for (let i = 0; i < length; i++) {
      console.log("generating page " + pageNumber);
      const pageCtx = newPageCtx();
      drawPromises.push(drawBasicClockPageP5(zineCtx, pageCtx));
      pageNumber++;
    }
  };

  const { drawFrontCover, drawBackCover, drawHelpPage1, drawHelpPage2 } =
    await mainPages(zineCtx);

  // add pages, part 1
  console.log("drawing front cover");
  drawPromises.push(drawFrontCover(newPageCtx()));
  drawClockPages(2);

  // middle: instruction help pages
  console.log("drawing instruction pages");
  drawPromises.push(drawHelpPage1(newPageCtx()), drawHelpPage2(newPageCtx()));
  pageNumber += 2;

  // add pages, part 2
  drawPromises.push(drawEssayPage(zineCtx, newPageCtx()));
  pageNumber++;

  drawClockPages(2 - 1);
  console.log("drawing back cover");
  drawPromises.push(drawBackCover(newPageCtx()));

  await Promise.all(drawPromises);
  console.log(
    `page generation done! took took ${Math.round(performance.now() - startTime)}ms`,
  );

  // save PDF
  // https://github.com/gfrancine/f-impose/blob/master/src/utils.ts
  console.log("saving output pdf");
  const outPdfUint8Array = await outPdf.save();
  const outPdfBlob = new Blob([outPdfUint8Array as BlobPart], {
    type: "application/pdf",
  });
  const outPdfUrl = URL.createObjectURL(outPdfBlob);
  // await downloadFileFromUrl(outPdfUrl, "output.pdf");
  previewFrame.src = outPdfUrl;
  console.log(`done! took ${Math.round(performance.now() - startTime)}ms`);
}

function sketch(p: P5) {
  console.log("press the 'S' key to generate the zine!");

  // p.setup = async () => {
  //    p.noSmooth();
  // };

  p.keyPressed = async () => {
    if (p.key === "s") await generateZine(p);
  };
}

export default sketch;
