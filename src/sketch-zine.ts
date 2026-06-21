import P5 from "p5";
import type { LeftOrRight, PageSketchHooks } from "ywnrtza/src/common/types";
import {
  CachedAssetLoader,
  loadCommonFonts,
  loadCommonImages,
} from "ywnrtza/src/common/assets";
import { loadRawTexts } from "ywnrtza/src/text";
import { getColors } from "ywnrtza/src/common/colors";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { downloadFileFromUrl, mmToPts } from "./utils";
import {
  drawEssayPage,
  drawBasicClockPageP5,
  mainPages,
  drawDoubleClockPage,
  drawQuadClockPage,
  drawClockAsClockPage,
} from "./zine-pages";
import type { PageContext, ZineContext } from "./zine-pages/types";
import {
  assert,
  randomFromArrayWeighted,
  type WeightedArray,
} from "ywnrtza/src/common/utils";

/**
 * when true, runs previewPageDevelopment instead of generatePages
 * and outputs to an iframe instead of downloading.
 */
const IS_PREVIEW_DEV_MODE = false;
const N_ZINES = 3; // how many pdfs/zines to generate at once
const OUT_W_MM = 70,
  OUT_H_MM = 200,
  OUT_W = mmToPts(OUT_W_MM),
  OUT_H = mmToPts(OUT_H_MM);
const CLOCK_SIZE_MM = 150; // default size of a clock image PNG
const RESOLUTION = 300; // ppi
const BASE_URL = "https://gfrancine.gitlab.io/ywnrtza-clock";
const DESIGNED_PDF_PATH = "clock-assets/designedpages.pdf";
const FONT_PATH = "assets/fonts/GeistPixel-Square.otf";

/**
 * replaces generatePages() for previewing pages in development or benchmarking.
 * Use by enabling the IS_PREVIEW_DEV_MODE constant above
 */
async function previewPageDevelopment(zineCtx: ZineContext) {
  const { outPdf, outW, outH } = zineCtx;

  console.log("previewing page in development");
  const startTime = performance.now();
  const page = outPdf.addPage([outW, outH]);
  const pageCtx: PageContext = {
    page,
    pageNumber: 1,
    position: "left",
  };

  // change this line !
  await drawClockAsClockPage(zineCtx, pageCtx);
  // --------

  console.log(`done! took ${Math.round(performance.now() - startTime)}ms`);
}

/** page generation */
async function generatePages(zineCtx: ZineContext) {
  const { outPdf, outW, outH } = zineCtx;
  // console.log("generating pages");

  const startTime = performance.now();
  const drawPromises = []; // generate pages in parallel

  let pageNumber = 1;
  const addPage = () => outPdf.addPage([outW, outH]);

  /** creates a page context with a new page */
  const newPageCtx = () => ({
    page: addPage(),
    pageNumber, // increment manually
    position: pageNumber % 2 === 0 ? "right" : ("left" as LeftOrRight),
  });

  const N_CLOCK_PAGES = 24 - 4; // -4 help pages + covers
  assert(N_CLOCK_PAGES % 2 === 0, "number of clock pages must be even");

  const drawClockPages = (length: number) => {
    for (let i = 0; i < length; i++) {
      const pageCtx = newPageCtx();

      const presets: WeightedArray<() => Promise<void>> = [
        [() => drawBasicClockPageP5(zineCtx, pageCtx), 4],
        [() => drawDoubleClockPage(zineCtx, pageCtx), 4],
        [() => drawQuadClockPage(zineCtx, pageCtx), 2],
        [() => drawClockAsClockPage(zineCtx, pageCtx), 1],
      ];
      const preset = randomFromArrayWeighted(presets);

      drawPromises.push(
        preset().then(() =>
          console.log(`page ${pageCtx.pageNumber}/${N_CLOCK_PAGES + 4} done`),
        ),
      );
      pageNumber++;
    }
  };

  const { drawFrontCover, drawBackCover, drawHelpPage1, drawHelpPage2 } =
    await mainPages(zineCtx);

  // add pages, part 1
  drawPromises.push(drawFrontCover(newPageCtx()));
  drawClockPages(N_CLOCK_PAGES / 2);

  // middle: instruction help pages
  drawPromises.push(drawHelpPage1(newPageCtx()), drawHelpPage2(newPageCtx()));
  pageNumber += 2;

  // add pages, part 2
  drawPromises.push(drawEssayPage(zineCtx, newPageCtx()));
  pageNumber++;

  drawClockPages(N_CLOCK_PAGES / 2 - 1);
  drawPromises.push(drawBackCover(newPageCtx()));

  await Promise.all(drawPromises);
  console.log(
    `pages generated! took ${Math.round(performance.now() - startTime)}ms`,
  );
}

/** Generate a full zine. Returns a data URL of the output PDF */
async function generateZine(p: P5, hooks: PageSketchHooks) {
  console.log("generating pdf");
  const startTime = performance.now();
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
  if (IS_PREVIEW_DEV_MODE) await previewPageDevelopment(zineCtx);
  else await generatePages(zineCtx);

  // save PDF
  // https://github.com/gfrancine/f-impose/blob/master/src/utils.ts
  console.log("saving output pdf");
  const outPdfUint8Array = await outPdf.save();
  const outPdfBlob = new Blob([outPdfUint8Array as BlobPart], {
    type: "application/pdf",
  });
  const outPdfUrl = URL.createObjectURL(outPdfBlob);
  console.log(
    `pdf generated! took ${Math.round(performance.now() - startTime)}ms`,
  );
  return outPdfUrl;
}

function sketch(p: P5) {
  console.log("press the 'S' key to generate the zine!");

  p.keyPressed = async () => {
    if (p.key !== "s") return;

    const assetLoader = new CachedAssetLoader(p);
    const hooks: PageSketchHooks = {
      colors: getColors(p),
      fonts: await loadCommonFonts(p),
      images: await loadCommonImages(p),
      rawTexts: await loadRawTexts(),
      ...assetLoader.getSketchHooks(),
    };

    // zine generation
    console.log("generating pdfs");
    const nZines = IS_PREVIEW_DEV_MODE ? 1 : N_ZINES;
    const startTime = performance.now();
    const outPdfUrls: string[] = [];
    const promises = [];
    for (let i = 0; i < nZines; i++) {
      promises.push(
        generateZine(p, hooks).then((outPdfUrl) => {
          outPdfUrls.push(outPdfUrl);
          console.log(`pdf ${i + 1}/${nZines} generated!`);
        }),
      );
    }
    await Promise.all(promises);

    // download or preview the output(s)
    if (IS_PREVIEW_DEV_MODE) {
      const previewFrame = document.getElementById(
        "zine-pdf-preview",
      ) as HTMLIFrameElement;
      previewFrame.classList.add("visible");
      previewFrame.src = outPdfUrls[0];
    } else {
      await Promise.all(
        outPdfUrls.map((url, i) =>
          downloadFileFromUrl(url, "output-" + (i + 1) + ".pdf"),
        ),
      );
    }

    console.log(
      `pdfs generated! took ${Math.round(performance.now() - startTime)}ms`,
    );
  };
}

export default sketch;
