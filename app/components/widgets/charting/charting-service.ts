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
    valueFields: string[] | null,
    operation: "count" | "sum" | "avg" | "min" | "max"
  ): Promise<any[]> {
    const query = layer.createQuery();
    
    if (operation === "count") {
        // For count, we group by categoryField and count occurrences
        const statDefinition = new StatisticDefinition({
            onStatisticField: categoryField,
            outStatisticFieldName: "count_value",
            statisticType: "count"
        });
        query.outStatistics = [statDefinition];
        query.groupByFieldsForStatistics = [categoryField];
    } else if (valueFields && valueFields.length > 0) {
        query.outStatistics = valueFields.map(field => new StatisticDefinition({
            onStatisticField: field,
            outStatisticFieldName: field,
            statisticType: operation
        }));
        query.groupByFieldsForStatistics = [categoryField];
    } else {
        throw new Error("Value fields are required for operations other than count");
    }

    // Order by category
    query.orderByFields = [`${categoryField} ASC`];

    try {
        const response = await layer.queryFeatures(query);
        
        return response.features.map(feature => {
            const result: any = {
                category: feature.attributes[categoryField] || "Unknown",
            };
            
            if (operation === "count") {
                result["count"] = feature.attributes["count_value"];
            } else {
                valueFields?.forEach(field => {
                    result[field] = feature.attributes[field];
                });
            }
            return result;
        });
    } catch (error) {
        console.error("Error calculating statistics:", error);
        throw error;
    }
  }
}
