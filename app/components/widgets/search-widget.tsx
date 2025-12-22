"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { addQueryResult, clearSelection } from "@/lib/utils/query";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";

interface SearchResult {
  layer: FeatureLayer;
  features: any[];
  count: number;
}

interface ExpandedLayer {
  layerId: string;
  layerTitle: string;
  features: any[];
}

export default function SearchWidget() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const sendMessage = useStateStore((state) => state.sendMessage);
  const widgets = useStateStore((state) => state.widgets);
  const updateStats = useStateStore((state) => state.updateStats);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedLayer, setExpandedLayer] = useState<ExpandedLayer | null>(null);
  const [searchGraphicsLayer, setSearchGraphicsLayer] = useState<GraphicsLayer | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || !view) return;

      setIsSearching(true);
      try {
        const results = await performSearch(query);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        sendMessage({
          title: t("systemMessages.error.searchError.title"),
          body: t("systemMessages.error.searchError.body"),
          type: "error",
          duration: 5,
        });
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [view, sendMessage, t]
  );

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
      setExpandedLayer(null);
    }
  }, [searchQuery, debouncedSearch]);

  const performSearch = async (query: string): Promise<SearchResult[]> => {
    if (!view) return [];
    
    const basemapLayers = view.map.layers
      .toArray()
      .filter((layer: any) => layer.group === "Basemap" && layer instanceof FeatureLayer) as FeatureLayer[];

    const results: SearchResult[] = [];

    for (const layer of basemapLayers) {
      try {
        const layerResults = await searchLayer(layer, query);
        if (layerResults.features.length > 0) {
          results.push(layerResults);
        }
      } catch (error) {
        console.warn(`Failed to search layer ${layer.title}:`, error);
      }
    }

    return results;
  };

  const searchLayer = async (layer: FeatureLayer, query: string): Promise<SearchResult> => {
    // Build a search query that searches across all text fields
    const textFields = layer.fields
      .filter((field: any) => field.type === "string")
      .map((field: any) => field.name);

    if (textFields.length === 0) {
      return { layer, features: [], count: 0 };
    }

    const whereClause = textFields
      .map(field => `UPPER(${field}) LIKE UPPER('%${query}%')`)
      .join(" OR ");

    const searchQuery: any = {
      where: whereClause,
      outFields: ["*"],
      returnGeometry: true
    };

    // Only use pagination if supported by the service to avoid errors
    if (layer.capabilities?.query?.supportsPagination) {
      searchQuery.num = 50;
    }

    const response = await layer.queryFeatures(searchQuery);
    return {
      layer,
      features: response.features,
      count: response.features.length,
    };
  };

  const handleLayerClick = (result: SearchResult) => {
    setExpandedLayer({
      layerId: result.layer.id,
      layerTitle: result.layer.title,
      features: result.features,
    });
  };

  const handleBackToResults = () => {
    setExpandedLayer(null);
  };

  const handleFeatureClick = (feature: any, layer: FeatureLayer) => {
    if (!view) return;
    
    // Ensure the search graphics layer exists
    if (!searchGraphicsLayer) {
      const layer = new GraphicsLayer({
        title: "Search Results",
        group: "My Layers"
      });
      setSearchGraphicsLayer(layer);
      view.map.add(layer);
    }
    
    // Clear previous graphics
    searchGraphicsLayer.removeAll();

    let symbol;
    switch (feature.geometry.type) {
      case "polyline":
        symbol = {
          type: "simple-line",
          color: [0, 255, 255, 0.8],
          width: 4,
          style: "solid"
        };
        break;
      case "polygon":
        symbol = {
          type: "simple-fill",
          color: [0, 255, 255, 0.3],
          style: "solid",
          outline: {
            color: [0, 255, 255, 1],
            width: 2
          }
        };
        break;
      default: // point and multipoint
        symbol = {
          type: "simple-marker",
          style: "circle",
          color: [0, 255, 255, 0.8],
          size: 12,
          outline: {
            color: [255, 255, 255],
            width: 2,
          },
        };
    }

    const graphic = new Graphic({
      geometry: feature.geometry,
      attributes: feature.attributes,
      symbol: symbol as any,
    });

    searchGraphicsLayer.add(graphic);

    // Zoom to the feature
    if (feature.geometry && view) {
      view.goTo(feature.geometry);
    }

    // Select the feature in the layer
    if (view) {
      view.whenLayerView(layer).then((layerView: any) => {
        if (layerView.setSelection) {
          layerView.setSelection([feature.attributes.OBJECTID]);
        }
      });
    }

    updateStats("Search Feature Selected");
  };

  const clearResults = () => {
    setSearchQuery("");
    setSearchResults([]);
    setExpandedLayer(null);
    if (searchGraphicsLayer) {
      searchGraphicsLayer.removeAll();
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          {t("widgets.search.title", "Search | بحث")}
        </h2>
      </div>

      {/* Search Input */}
      {!expandedLayer && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("widgets.search.placeholder", "Search basemap layers...")}
            className="w-full px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {expandedLayer ? (
          // Expanded layer view
          <div>
            <Button variant="secondary" onClick={handleBackToResults} className="mb-4">
              ← {t("widgets.search.backToResults", "Back to Results")}
            </Button>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {expandedLayer.layerTitle}
            </h3>
            <div className="space-y-2">
              {expandedLayer.features.map((feature, index) => (
                <div
                  key={index}
                  onClick={() => handleFeatureClick(feature, view?.map.layers.find((l: any) => l.id === expandedLayer.layerId) as FeatureLayer)}
                  className="p-3 bg-white/50 rounded-lg cursor-pointer hover:bg-white/40 transition-colors border border-border shadow-md"
                >
                  <div className="text-foreground">
                    {(() => {
                      const objectId = feature.attributes.OBJECTID;
                      const matchingKey = Object.keys(feature.attributes).find(key => 
                        key !== 'OBJECTID' && key !== 'SHAPE' && 
                        String(feature.attributes[key]).toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      const fields = [];
                      if (objectId !== undefined) {
                        fields.push(['OBJECTID', objectId]);
                      }
                      if (matchingKey) {
                        fields.push([matchingKey, feature.attributes[matchingKey]]);
                      } else {
                        // If no match, take the first non-excluded field
                        const firstKey = Object.keys(feature.attributes).find(key => key !== 'OBJECTID' && key !== 'SHAPE');
                        if (firstKey) {
                          fields.push([firstKey, feature.attributes[firstKey]]);
                        }
                      }
                      return fields.map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Results overview
          <div className="space-y-3">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleLayerClick(result)}
                className="p-4 bg-white/70 rounded-lg cursor-pointer hover:bg-white/60 transition-colors border-2 border-white"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-foreground font-semibold">{result.layer.title}</h3>
                    <p className="text-muted text-sm">
                      {t("widgets.search.featuresFound", "{{count}} features found", { count: result.count })}
                    </p>
                  </div>
                  <div className="text-black">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
            {searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="text-center text-muted py-8">
                {t("widgets.search.noResults", "No results found")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clear Button */}
      {(searchResults.length > 0 || (searchGraphicsLayer && searchGraphicsLayer.graphics.length > 0)) && (
        <Button variant="secondary" onClick={clearResults} className="w-full">
          {t("widgets.search.clearResults", "Clear Results")}
        </Button>
      )}
    </div>
  );
}

// Debounce utility function
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}