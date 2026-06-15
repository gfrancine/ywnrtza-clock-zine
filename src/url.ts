import type { ClockPreset } from "ywnrtza/src/page-sketches/clock";

export function clockPresetToUrl(clockPreset: ClockPreset, baseUrl: string) {
  const url = new URL(baseUrl);
  url.search = "";
  for (const [key, val] of Object.entries(clockPreset)) {
    if (val) url.searchParams.set(key, val);
  }
  return url.toString();
}

const URL_PARAM_KEYS = [
  "colors",
  "bg",
  "face",
  "hourTicks",
  "hourHand",
  "minuteHand",
  "secondsHand",
];

export function clockPresetFromUrlSearch(
  searchStr: string,
): Partial<ClockPreset> {
  const urlParams = new URLSearchParams(searchStr);
  const parsedUrlParams: Record<string, string> = {};
  for (const key of URL_PARAM_KEYS) {
    const val = urlParams.get(key);
    if (val) parsedUrlParams[key] = val;
  }
  return parsedUrlParams;
}
