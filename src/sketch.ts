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
import { clockPresetFromUrlSearch, clockPresetToUrl } from "./url";

function sketch(p: P5) {
  const loadingText = document.getElementById("loading-text") as HTMLElement;
  const container = document.getElementById("sketch-container") as HTMLElement;
  const timeDisplay = document.getElementById("time-display") as HTMLElement;
  const copyButton = document.getElementById("copy-link") as HTMLElement;
  let clock: Clock;

  p.setup = async () => {
    loadingText.innerHTML = "Loading assets...";

    p.createCanvas(container.offsetWidth, container.offsetHeight);
    p.noSmooth();
    p.frameRate(5);

    const getP = () => p;
    const assetLoader = new CachedAssetLoader(p);
    const hooks: PageSketchHooks = {
      colors: getColors(p),
      fonts: await loadCommonFonts(p),
      images: await loadCommonImages(p),
      rawTexts: await loadRawTexts(),
      ...assetLoader.getSketchHooks(),
    };

    console.log("loaded assets");
    loadingText.innerHTML = "Generating clock...";

    // parse url
    const clockPreset = {
      ...randomClockPreset(),
      ...clockPresetFromUrlSearch(window.location.search),
    };
    const url = clockPresetToUrl(clockPreset, window.location.href);
    // window.history.replaceState(null, "", url);
    copyButton?.addEventListener("click", () => {
      navigator.clipboard.writeText(url);
    });

    // create clock
    clock = new Clock(
      getP,
      hooks,
      clockOptionsFromPreset(clockPreset, getP, hooks),
    );
    await clock.setup();

    loadingText.innerHTML = "";
  };

  // p.deltaTime is unreliable when resizing canvases
  let lastT = Date.now();
  p.draw = () => {
    const t = Date.now();
    const dt = t - lastT;
    lastT = t;

    p.background(255);
    clock.update(dt);
    clock.draw(0, 0, p.width, p.height);
    timeDisplay.innerHTML = clock.date.toString();
  };

  const resizeCanvas = () =>
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
  });
  resizeObserver.observe(container);
  // container.addEventListener("resize", resizeCanvas);
  // p.windowResized = resizeCanvas

  p.keyPressed = () => {
    if (p.key === "s") p.saveCanvas(clock.date.toString(), "png");
  };
}

export default sketch;
