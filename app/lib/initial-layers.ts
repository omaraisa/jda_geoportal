// config/initialLayers.js
import {InitialLayersConfiguration} from "@/interface";
export const baseMapLayerConfigurations : InitialLayersConfiguration[] = [
  {
    title: "Jeddah Historical",
    type: "feature",
    sourceType: "url", // 'url' | 'portal'
    url: "https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/JeddahHistorical/FeatureServer",
    portalItemId: null,
    groups: [],
    visible: true,
    labelsEnabled: true,
    labelingInfo: null,
    renderer: null,
    opacity: 1,
    minScale: 0,
    maxScale: 18,
  },
  {
    title: "Parcel",
    type: "feature",
    sourceType: "url", // 'url' | 'portal'
    url: "https://gis.jda.gov.sa/agserver/rest/services/Hosted/Parcel/FeatureServer",
    portalItemId: null,
    groups: [],
    visible: false,
    labelsEnabled: true,
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        outline: {
          color: [255, 255, 0, 1], // Yellow outline
          width: 1,
        },
      },
    },
    opacity: 1,
    labelingInfo: [
      {
        labelExpressionInfo: { expression: "$feature.parcelnumber" },
        symbol: {
          type: "text",
          color: "yellow",
          haloColor: "black",
          haloSize: "1px",
          font: {
            size: 12,
            family: "Arial",
            weight: "bold",
          },
        },
        minScale: 5000,
        maxScale: 100,
      },
    ],
    minScale: 0,
    maxScale: 18,
  },
];

export const sceneLayerConfigurations : InitialLayersConfiguration[] = [
  {
    title: "Buildings",
    type: "feature",
    sourceType: "url", // 'url' | 'portal'
    url: "https://gis.jda.gov.sa/agserver/rest/services/Hosted/Buildings/FeatureServer",
    portalItemId: null,
    groups: [],
    visible: false,
    labelsEnabled: true,
    labelingInfo: null,
    opacity: 1,
    minScale: 0,
    maxScale: 18,
    renderer: {
      type: "simple", // autocasts as new SimpleRenderer()
      symbol: {
        type: "polygon-3d", // autocasts as new PolygonSymbol3D()
        symbolLayers: [
          {
            type: "extrude", // autocasts as new ExtrudeSymbol3DLayer()
            material: { color: [200, 200, 200, 0.8] }, // Light blue with transparency
            edges: {
              type: "solid", // autocasts as new SolidEdges3D()
              color: [50, 50, 50, 0.5], // Dark gray edges with transparency
            },
          },
        ],
      },
      label: "Buildings",
      visualVariables: [
        {
          type: "size", // Indicates this is a size visual variable
          field: "height", // Field containing the height values
          valueUnit: "meters", // Unit of the height values
          valueExpression: "$feature.height", // Directly use the height field
        },
      ],
    },
    // elevationInfo: {
    //   mode: 'on-the-ground', // Ensure buildings are extruded from the ground
    // },
  },
  {
    title: "Parcel",
    type: "feature",
    sourceType: "url", // 'url' | 'portal'
    url: "https://gis.jda.gov.sa/agserver/rest/services/Hosted/Parcel/FeatureServer",
    portalItemId: null,
    groups: [],
    visible: false,
    labelsEnabled: true,
    labelingInfo: null,
    renderer: null,
    opacity: 1,
    minScale: 0,
    maxScale: 18,
  },
];
