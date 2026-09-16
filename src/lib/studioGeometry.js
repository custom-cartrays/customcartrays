// Studio V2 geometry helpers. UI geometry must never redefine the manufacturing CAD.
export const TRAY = Object.freeze({
  widthIn: 17,
  heightIn: 11.5,
  designWidthIn: 16.5,
  designHeightIn: 11,
  topMarginIn: 0.5,
  bottomMarginIn: 0,
  sideMarginIn: 0.25,
});

export const PRINT = Object.freeze({
  targetDpi: 300,
  // 16.5 x 11 in at 300 DPI.
  widthPx: 4950,
  heightPx: 3300,
});

export function containSize(sourceWidthPx, sourceHeightPx, boxWidth, boxHeight, scalePercent = 100) {
  if (!sourceWidthPx || !sourceHeightPx || !boxWidth || !boxHeight) return { width: 0, height: 0, factor: 0 };
  const factor = Math.min(boxWidth / sourceWidthPx, boxHeight / sourceHeightPx) * (scalePercent / 100);
  return { width: sourceWidthPx * factor, height: sourceHeightPx * factor, factor };
}

export function effectiveDpi(sourceWidthPx, sourceHeightPx, scalePercent = 100) {
  if (!sourceWidthPx || !sourceHeightPx || !scalePercent) return null;
  const fit = Math.min(TRAY.designWidthIn / sourceWidthPx, TRAY.designHeightIn / sourceHeightPx);
  const placedWidthIn = sourceWidthPx * fit * (scalePercent / 100);
  const placedHeightIn = sourceHeightPx * fit * (scalePercent / 100);
  const dpiX = sourceWidthPx / placedWidthIn;
  const dpiY = sourceHeightPx / placedHeightIn;
  return Math.floor(Math.min(dpiX, dpiY));
}

export function qualityFromDpi(dpi) {
  if (!dpi) return { level: 'unknown', label: 'Upload an image to check quality' };
  if (dpi >= 300) return { level: 'excellent', label: 'Excellent print quality' };
  if (dpi >= 200) return { level: 'good', label: 'Good print quality' };
  if (dpi >= 150) return { level: 'fair', label: 'Fair — may look softer when printed' };
  return { level: 'low', label: 'Low resolution — use a larger image if possible' };
}

export function placementMetadata({ sourceSize, scale, x, y, rotation }) {
  const dpi = sourceSize ? effectiveDpi(sourceSize.w, sourceSize.h, scale) : null;
  return {
    studioVersion: 2,
    physicalTray: `${TRAY.widthIn}x${TRAY.heightIn}`,
    designArea: `${TRAY.designWidthIn}x${TRAY.designHeightIn}`,
    fit: 'contain',
    sourcePixels: sourceSize ? `${sourceSize.w}x${sourceSize.h}` : null,
    effectiveDpi: dpi,
    quality: qualityFromDpi(dpi).level,
    scale,
    x,
    y,
    rotation,
  };
}
