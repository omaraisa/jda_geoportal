export const GP_URL = process.env.NEXT_PUBLIC_UPLOAD_GP_URL!;
export const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL!;

export const POLLING_CONFIG = {
  interval: 2000,
  maxTries: 30,
};

export const ACCEPTED_FILE_TYPES = {
  "application/json": [".json", ".geojson"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/csv": [".csv"],
  "text/plain": [".txt"],
  "application/zip": [".zip"],
  "application/gpx+xml": [".gpx"],
  "application/vnd.google-earth.kml+xml": [".kml"],
  "application/vnd.google-earth.kmz": [".kmz"],
  "application/acad": [".dwg", ".dxf"],
};

export const SUPPORTED_FILE_EXTENSIONS = "csv, txt, xlsx, json, kml, kmz, dwg, dxf, zipped shapefile";

export const STATUS_URLS = {
  getStatusUrl: (jobId: string) => 
    `https://gis.jda.gov.sa/agserver/rest/services/DataConversionTool/GPServer/Data%20Conversion%20Tool/jobs/${jobId}?f=json`,
  getResultUrl: (jobId: string) => 
    `https://gis.jda.gov.sa/agserver/rest/services/DataConversionTool/GPServer/Data%20Conversion%20Tool/jobs/${jobId}/results/Output?f=json`,
  getFileUrl: (jobId: string, fileName: string) => 
    `https://gis.jda.gov.sa/agserver/rest/directories/arcgisjobs/dataconversiontool_gpserver/${jobId}/scratch/${fileName}`,
};
