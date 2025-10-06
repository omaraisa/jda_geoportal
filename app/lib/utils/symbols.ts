import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";

// Soft color palettes for analysis results
const softColors = {
  point: [
    [173, 216, 230, 0.6], // Light blue
    [255, 182, 193, 0.6], // Light pink
    [144, 238, 144, 0.6], // Light green
    [255, 218, 185, 0.6], // Peach
    [221, 160, 221, 0.6], // Plum
    [176, 196, 222, 0.6], // Light steel blue
    [255, 228, 196, 0.6], // Bisque
    [240, 230, 140, 0.6], // Khaki
  ],
  line: [
    [144, 238, 144, 0.7], // Light green
    [255, 182, 193, 0.7], // Light pink
    [173, 216, 230, 0.7], // Light blue
    [255, 218, 185, 0.7], // Peach
    [221, 160, 221, 0.7], // Plum
    [176, 196, 222, 0.7], // Light steel blue
    [255, 228, 196, 0.7], // Bisque
    [240, 230, 140, 0.7], // Khaki
  ],
  polygon: [
    [255, 218, 185, 0.4], // Peach puff
    [173, 216, 230, 0.4], // Light blue
    [255, 182, 193, 0.4], // Light pink
    [144, 238, 144, 0.4], // Light green
    [221, 160, 221, 0.4], // Plum
    [176, 196, 222, 0.4], // Light steel blue
    [255, 228, 196, 0.4], // Bisque
    [240, 230, 140, 0.4], // Khaki
  ]
};

// Track last used color index for each type to ensure variety
let lastPointIndex = -1;
let lastLineIndex = -1;
let lastPolygonIndex = -1;

/**
 * Gets a random soft color for analysis results
 */
function getRandomSoftColor(type: 'point' | 'line' | 'polygon'): number[] {
  const colors = softColors[type];
  let lastIndex: number;
  let setLastIndex: (index: number) => void;

  switch (type) {
    case 'point':
      lastIndex = lastPointIndex;
      setLastIndex = (index) => lastPointIndex = index;
      break;
    case 'line':
      lastIndex = lastLineIndex;
      setLastIndex = (index) => lastLineIndex = index;
      break;
    case 'polygon':
      lastIndex = lastPolygonIndex;
      setLastIndex = (index) => lastPolygonIndex = index;
      break;
  }

  let randomIndex: number;
  do {
    randomIndex = Math.floor(Math.random() * colors.length);
  } while (randomIndex === lastIndex && colors.length > 1);

  setLastIndex(randomIndex);
  return colors[randomIndex];
}

/**
 * Gets a random soft point symbol for analysis results
 */
export function getAnalysisPointSymbol(): SimpleMarkerSymbol {
  const color = getRandomSoftColor('point');
  return new SimpleMarkerSymbol({
    color: color,
    size: 8,
    outline: {
      color: [70, 130, 180, 0.8], // Steel blue outline
      width: 1
    }
  });
}

/**
 * Gets a random soft line symbol for analysis results
 */
export function getAnalysisLineSymbol(): SimpleLineSymbol {
  const color = getRandomSoftColor('line');
  return new SimpleLineSymbol({
    color: color,
    width: 2
  });
}

/**
 * Gets a random soft polygon symbol for analysis results
 */
export function getAnalysisPolygonSymbol(): SimpleFillSymbol {
  const color = getRandomSoftColor('polygon');
  // Use an explicit outline with the same fill color and zero width.
  // Some renderers fall back to a default black outline if outline is omitted.
  const outlineColor = [color[0], color[1], color[2], 0];
  return new SimpleFillSymbol({
    color: color,
    outline: new SimpleLineSymbol({
      color: outlineColor,
      width: 0
    })
  });
}

// Legacy symbols (keeping for backward compatibility)
export const pointSymbol = new SimpleMarkerSymbol({
  color: [4, 123, 139, 1],
  outline: {
    color: [29, 29, 29, 1],
    width: 2,
  },
  size: 12,
  style: "circle",
});

export const lineSymbol = new SimpleLineSymbol({
  color: [231, 175, 57, 1],
  width: 3,
  style: "solid",
});

export const polygonSymbol = new SimpleFillSymbol({
  color: [59, 191, 173, 0.5],
  outline: {
    color: [29, 29, 29, 1],
    width: 2,
  },
  style: "solid",
});

export const queryPointSymbol = new SimpleMarkerSymbol({
  color: [0, 123, 255, 1], // Blue
  outline: {
    color: [255, 255, 255, 1],
    width: 2,
  },
  size: 12,
  style: "circle",
});

export const queryLineSymbol = new SimpleLineSymbol({
  color: [34, 139, 34, 1], // Green
  width: 3,
  style: "solid",
});

export const queryPolygonSymbol = new SimpleFillSymbol({
  color: [138, 43, 226, 0.5], // Purple
  outline: {
    color: [255, 255, 255, 1],
    width: 2,
  },
  style: "solid",
});
