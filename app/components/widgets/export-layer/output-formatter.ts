export class OutputNameFormatter {
  static formatOutputName(outputName: string, layerTitle?: string): string {
    // Use outputName or fallback to a default
    let formattedName = outputName?.trim()
      ? outputName.trim()
      : (layerTitle || "ExportedLayer");

    // Replace only non-ESRI supported characters (keep Unicode letters, numbers, and underscores)
    // ESRI feature class names: must start with a letter, only letters, numbers, and underscores, no spaces, max 160 chars
    formattedName = formattedName.replace(/[^\p{L}\p{N}_]/gu, "_");
    
    // Remove leading non-letter characters (ESRI requires starting with a letter)
    formattedName = formattedName.replace(/^[^A-Za-z\u0600-\u06FF]+/u, "");
    
    // Truncate to 160 chars
    formattedName = formattedName.slice(0, 160);

    return formattedName;
  }

  static normalizeOutputType(exportFormat: string): string {
    // Align outputType with GPService
    if (exportFormat === "shapefile") return "zip";
    if (exportFormat === "geojson") return "geojson";
    if (exportFormat === "csv") return "csv";
    if (exportFormat === "kml") return "kml";
    return exportFormat;
  }
}
