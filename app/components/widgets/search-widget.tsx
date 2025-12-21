"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { addQueryResult, clearSelection } from "@/lib/utils/query";

interface SearchResult {
  layer: FeatureLayer;
  features: any[];
  count: number;
}

interface ExpandedLayer {
  layerId: string;
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
  const [graphicsLayer, setGraphicsLayer] = useState<GraphicsLayer | null>(null);

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

    const searchQuery = {
      where: whereClause,
      outFields: ["*"],
      returnGeometry: true,
      num: 50, // Limit results per layer
    };

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
      features: result.features,
    });
  };

  const handleBackToResults = () => {
    setExpandedLayer(null);
  };

  const handleFeatureClick = (feature: any, layer: FeatureLayer) => {
    if (!view) return;
    
    // Clear previous graphics
    if (graphicsLayer) {
      view.map.remove(graphicsLayer);
    }

    // Create new graphics layer for the selected feature
    const newGraphicsLayer = new GraphicsLayer({
      title: `Search Result - ${layer.title}`,
      group: "My Layers"
    } as any);

    const graphic = new Graphic({
      geometry: feature.geometry,
      attributes: feature.attributes,
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [0, 255, 0, 0.8],
        size: 12,
        outline: {
          color: [255, 255, 255],
          width: 2,
        },
      } as any,
    });

    newGraphicsLayer.add(graphic);
    view.map.add(newGraphicsLayer);
    setGraphicsLayer(newGraphicsLayer);

    // Zoom to the feature
    if (feature.geometry && view) {
      view.goTo(feature.geometry);
    }

    updateStats("Search Feature Selected");
  };

  const clearResults = () => {
    setSearchQuery("");
    setSearchResults([]);
    setExpandedLayer(null);
    if (graphicsLayer) {
      view?.map.remove(graphicsLayer);
      setGraphicsLayer(null);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">
          {t("widgets.search.title", "Search | بحث")}
        </h2>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("widgets.search.placeholder", "Search basemap layers...")}
          className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {expandedLayer ? (
          // Expanded layer view
          <div>
            <button
              onClick={handleBackToResults}
              className="mb-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← {t("widgets.search.backToResults", "Back to Results")}
            </button>
            <h3 className="text-lg font-semibold text-white mb-4">
              {expandedLayer.layerId}
            </h3>
            <div className="space-y-2">
              {expandedLayer.features.map((feature, index) => (
                <div
                  key={index}
                  onClick={() => handleFeatureClick(feature, view?.map.layers.find((l: any) => l.id === expandedLayer.layerId) as FeatureLayer)}
                  className="p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="text-white">
                    {Object.entries(feature.attributes)
                      .filter(([key]) => key !== 'OBJECTID' && key !== 'SHAPE')
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
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
                className="p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors border border-gray-600"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-semibold">{result.layer.title}</h3>
                    <p className="text-gray-400 text-sm">
                      {t("widgets.search.featuresFound", "{{count}} features found", { count: result.count })}
                    </p>
                  </div>
                  <div className="text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
            {searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                {t("widgets.search.noResults", "No results found")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clear Button */}
      {(searchResults.length > 0 || graphicsLayer) && (
        <button
          onClick={clearResults}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {t("widgets.search.clearResults", "Clear Results")}
        </button>
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