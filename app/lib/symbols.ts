import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";

// Define colorful symbols
export const pointSymbol = new SimpleMarkerSymbol({
  color: [4, 123, 139, 1], // Primary color
  outline: {
    color: [29, 29, 29, 1], // Foreground color
    width: 2,
  },
  size: 12,
  style: "circle",
});

export const lineSymbol = new SimpleLineSymbol({
  color: [231, 175, 57, 1], // Secondary color
  width: 3,
  style: "solid",
});

export const polygonSymbol = new SimpleFillSymbol({
  color: [59, 191, 173, 0.5], // Tertiary color with 50% opacity
  outline: {
    color: [29, 29, 29, 1], // Foreground color
    width: 2,
  },
  style: "solid",
});

// Define symbols for query results
export const queryPointSymbol = new SimpleMarkerSymbol({
  color: [255, 0, 0, 1], // Red color
  outline: {
    color: [255, 255, 255, 1], // White outline
    width: 2,
  },
  size: 12,
  style: "circle",
});

export const queryLineSymbol = new SimpleLineSymbol({
  color: [255, 0, 0, 1], // Red color
  width: 3,
  style: "solid",
});

export const queryPolygonSymbol = new SimpleFillSymbol({
  color: [255, 0, 0, 0.5], // Red color with 50% opacity
  outline: {
    color: [255, 255, 255, 1], // White outline
    width: 2,
  },
  style: "solid",
});
