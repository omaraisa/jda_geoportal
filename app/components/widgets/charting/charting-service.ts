import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import StatisticDefinition from "@arcgis/core/rest/support/StatisticDefinition";

export interface ChartData {
  category: string | number;
  value: number;
}

export class ChartingService {
  
  /**
   * Calculates a single statistic for a field across all features
   */
  static async getFieldStatistics(
    layer: FeatureLayer, 
    field: string, 
    operation: "count" | "sum" | "avg" | "min" | "max"
  ): Promise<number> {
    const statDefinition = new StatisticDefinition({
      onStatisticField: field,
      outStatisticFieldName: "stat_result",
      statisticType: operation
    });

    const query = layer.createQuery();
    query.outStatistics = [statDefinition];

    const response = await layer.queryFeatures(query);
    if (response.features.length > 0) {
        return response.features[0].attributes["stat_result"];
    }
    return 0;
  }

  /**
   * Calculates statistics grouped by a category field
   */
  static async getCategoryStatistics(
    layer: FeatureLayer,
    categoryField: string,
    valueField: string | null,
    operation: "count" | "sum" | "avg" | "min" | "max"
  ): Promise<ChartData[]> {
    const query = layer.createQuery();
    
    if (operation === "count") {
        // For count, we group by categoryField and count occurrences
        const statDefinition = new StatisticDefinition({
            onStatisticField: categoryField,
            outStatisticFieldName: "value",
            statisticType: "count"
        });
        query.outStatistics = [statDefinition];
        query.groupByFieldsForStatistics = [categoryField];
    } else if (valueField) {
        const statDefinition = new StatisticDefinition({
            onStatisticField: valueField,
            outStatisticFieldName: "value",
            statisticType: operation
        });
        query.outStatistics = [statDefinition];
        query.groupByFieldsForStatistics = [categoryField];
    } else {
        throw new Error("Value field is required for operations other than count");
    }

    // Order by category
    query.orderByFields = [`${categoryField} ASC`];

    try {
        const response = await layer.queryFeatures(query);
        
        return response.features.map(feature => ({
          category: feature.attributes[categoryField] || "Unknown",
          value: feature.attributes["value"]
        }));
    } catch (error) {
        console.error("Error calculating statistics:", error);
        throw error;
    }
  }
}
