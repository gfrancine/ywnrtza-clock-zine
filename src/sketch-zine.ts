import P5 from "p5";
import type { PageSketchHooks } from "ywnrtza/src/common/types";
import {
  CachedAssetLoader,
  loadCommonFonts,
  loadCommonImages,
} from "ywnrtza/src/common/assets";
import { loadRawTexts } from "ywnrtza/src/text";
import { getColors } from "ywnrtza/src/common/colors";
import {
  Clock,
  clockOptionsFromPreset,
  randomClockPreset,
} from "ywnrtza/src/page-sketches/clock";
import { inToMm, randomInRangeInt } from "ywnrtza/src/common/utils";
import { clockPresetToUrl } from "./url";

function randomDate(start: Date = new Date(0), end: Date = new Date()) {
  return new Date(randomInRangeInt(start.getTime(), end.getTime()));
}

function sketch(p: P5) {
  const N_CLOCKS = 8;
  const BASE_URL = "https://gfrancine.gitlab.io/ywnrtza-clock";

  p.setup = async () => {
    p.noSmooth();
  };

  p.keyPressed = async () => {
    if (p.key === "s") {
      const assetLoader = new CachedAssetLoader(p);
      const hooks: PageSketchHooks = {
        colors: getColors(p),
        fonts: await loadCommonFonts(p),
        images: await loadCommonImages(p),
        rawTexts: await loadRawTexts(),
        ...assetLoader.getSketchHooks(),
      };

      for (let i = 0; i < N_CLOCKS; i++) {
        const width = inToMm(300) * 150,
          height = inToMm(300) * 150;
        const pg = p.createGraphics(width, height);
        pg.noSmooth();
        const getP = () => pg;
        const preset = randomClockPreset();
        const url = clockPresetToUrl(preset, BASE_URL);
        console.log(url);
        const clock = new Clock(getP, hooks, {
          ...clockOptionsFromPreset(preset, getP, hooks),
          baseDate: randomDate(),
        });

        clock.draw(0, 0, width, height);

        pg.elt.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `clock-${i}-${clock.date.toString()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        });
      }
    }
  };
}

export default sketch;
