export const featureBasedLayerTypes = ["csv", "feature", "map-image","geojson"];

export const imageBasedLayerTypes = [
    "tile",
    "vector-tile",
    "imagery",
    "wms",
    "wmts"
];

export const threeDLayerTypes = [
    "scene",
    "elevation",
    "point-cloud",
    "building-scene",
    "integrated-mesh",
    "dimension"
];

export const realTimeLayerTypes = [
    "stream"
];

export const routeLayerTypes = [
    "route"
];
export const layerGroups = ["MyLayers", "Basemap", 
    "Atkins",
    "Building",
    "LandParcels",
    "LandUse",
    "Projects",
    "AdministrativeRegions",
    "Government_Services",
    "Geology",
    "Elevation",
    "GeographicalNames",
    "Imagery",
    "LandCover",
    "Transport",
    "Nationaladdress",
    "PopulationDistribution",
    "TheSaudiArabiaNationalSpatialReferenceSystem",
    "Utilities",
    "Water",
    "AdministrativeBoundary",
    "NationalAddress",
];

export const portal_usertype_groups : { [key: string]: string } = {
    "gportal_viewer": "viewer",
    "gportal_editor": "editor",
    "gportal_admin": "admin"
};
