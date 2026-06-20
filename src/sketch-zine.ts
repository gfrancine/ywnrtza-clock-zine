import P5 from "p5";
import type { LeftOrRight, PageSketchHooks } from "ywnrtza/src/common/types";
import {
  CachedAssetLoader,
  loadCommonFonts,
  loadCommonImages,
} from "ywnrtza/src/common/assets";
import { loadRawTexts, wrapText } from "ywnrtza/src/text";
import { getColors } from "ywnrtza/src/common/colors";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { mmToPts } from "./utils";
import {
  drawEssayPage,
  drawSimpleClockPage,
  mainPages,
  type ZineContext,
} from "./zine-pages";

// main

async function generateZine(p: P5) {
  const CLOCK_SIZE_MM = 150;
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
  const OUT_W = mmToPts(70),
    OUT_H = mmToPts(200);

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
    designedPages,
    clockParams: { p, hooks, baseUrl: BASE_URL, clockSizeMm: CLOCK_SIZE_MM },
    font,
  };

  // page generation
  console.log("generating pages");

  let pageNumber = 1;
  const getPageCtx = () => ({
    pageNumber,
    position: pageNumber % 2 === 0 ? "right" : ("left" as LeftOrRight),
  });

  const { drawFrontCover, drawBackCover, drawHelpPage1, drawHelpPage2 } =
    await mainPages(zineCtx);

  // add pages, part 1
  await drawFrontCover();

  for (let i = 0; i < 6; i++) {
    console.log("generating page " + pageNumber);
    await drawSimpleClockPage(zineCtx, getPageCtx());
    // ... TODO
    pageNumber++;
  }

  // middle: instruction help pages
  await drawHelpPage1();
  await drawHelpPage2();
  pageNumber += 2;

  // add pages, part 2
  await drawEssayPage(zineCtx);
  pageNumber++;

  for (let i = 0; i < 6 - 1; i++) {
    console.log("generating page " + pageNumber);
    await drawSimpleClockPage(zineCtx, getPageCtx());
    // ... TODO
    pageNumber++;
  }

  await drawBackCover();

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
  console.log("done!");
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
