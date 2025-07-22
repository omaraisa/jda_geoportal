import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";

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
  color: [255, 0, 0, 1],
  outline: {
    color: [255, 255, 255, 1],
    width: 2,
  },
  size: 12,
  style: "circle",
});

export const queryLineSymbol = new SimpleLineSymbol({
  color: [255, 0, 0, 1],
  width: 3,
  style: "solid",
});

export const queryPolygonSymbol = new SimpleFillSymbol({
  color: [255, 0, 0, 0.5],
  outline: {
    color: [255, 255, 255, 1],
    width: 2,
  },
  style: "solid",
});
