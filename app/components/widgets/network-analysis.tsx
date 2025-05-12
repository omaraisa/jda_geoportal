"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";

const SortableStop = ({ stop, idx, id }: { stop: { x: number; y: number }; idx: number; id: string }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: "#f3f4f6",
    borderRadius: "0.375rem",
    padding: "0.25rem 0.5rem",
    marginBottom: "0.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  };
  const { t } = useTranslation();
  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span className="cursor-move">☰</span>
      {t("widgets.networkAnalysis.stop", { number: idx + 1 }) || `Stop ${idx + 1}`}: ({stop.x}, {stop.y})
    </li>
  );
};

const STOP_GRAPHICS_LAYER_ID = "network-analysis-stops";

const NetworkAnalysis: React.FC = () => {
  const { t } = useTranslation();
  const [addingStops, setAddingStops] = useState(false);
  const [stops, setStops] = useState<{ x: number; y: number }[]>([]);
  const view = useStateStore((state) => state.targetView);
  const mapClickHandlerRef = useRef<any>(null);
  const graphicsLayerRef = useRef<__esri.GraphicsLayer | null>(null);

  // Add GraphicsLayer to map if not present
  useEffect(() => {
    if (view && view.map) {
      let layer = view.map.findLayerById(STOP_GRAPHICS_LAYER_ID) as __esri.GraphicsLayer;
      if (!layer) {
        layer = new GraphicsLayer({ id: STOP_GRAPHICS_LAYER_ID });
        view.map.add(layer);
      }
      graphicsLayerRef.current = layer;
    }
  }, [view]);

  // Update stop graphics on map when stops change
  useEffect(() => {
    const layer = graphicsLayerRef.current;
    if (!layer) return;
    layer.removeAll();
    stops.forEach((stop, idx) => {
      // Create a circular marker symbol
      const markerSymbol = {
        type: "simple-marker",
        style: "circle",
        color: "#1976d2", // blue
        size: 18,
        outline: {
          color: "#fff",
          width: 2
        }
      };
      
      // Text symbol for the number
      const textSymbol = {
        type: "text",
        text: String(idx + 1),
        color: "white",
        font: {
          size: 12,
          weight: "bold"
        },
        verticalAlignment: "middle",
        horizontalAlignment: "center"
      };
      
      // Create a graphic with both symbols
      const graphic = new Graphic({
        geometry: {
          type: "point",
          x: stop.x,
          y: stop.y,
        } as __esri.Point,
        symbol: {
          type: "composite",
          components: [markerSymbol, textSymbol]
        } as any,
        attributes: { idx }
      });
     
      layer.add(graphic);
    });
  }, [stops]);

  // Attach/detach map click handler for adding stops (add only one stop per click)
  useEffect(() => {
    if (addingStops && view) {
      const handler = (event: any) => {
        const pt = event.mapPoint;
        if (pt) {
          setStops((prev) => [
            ...prev,
            { x: +pt.longitude.toFixed(6), y: +pt.latitude.toFixed(6) },
          ]);
          setAddingStops(false); // Stop listening after one stop is added
        }
      };
      mapClickHandlerRef.current = view.on("click", handler);
      return () => {
        if (mapClickHandlerRef.current) {
          mapClickHandlerRef.current.remove();
          mapClickHandlerRef.current = null;
        }
      };
    }
    return () => {
      if (mapClickHandlerRef.current) {
        mapClickHandlerRef.current.remove();
        mapClickHandlerRef.current = null;
      }
    };
  }, [addingStops, view]);

  const handleAddStop = () => setAddingStops(true);

  const handleFindRoute = () => {
    // eslint-disable-next-line no-console
    console.log("analyzing", stops);
  };

  const handleClearStops = () => {
    setStops([]);
    setAddingStops(false);
    // Remove all graphics from the layer
    if (graphicsLayerRef.current) {
      graphicsLayerRef.current.removeAll();
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = Number(active.id);
      const newIndex = Number(over.id);
      setStops((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex flex-col space-y-2 w-full">
        <h2 className="font-semibold text-lg mb-2">{t("widgets.networkAnalysis.title") || "Route Analysis"}</h2>
        <div className="flex gap-2">
          <button
            className={`btn btn-primary flex-grow ${addingStops ? "opacity-70" : ""}`}
            onClick={handleAddStop}
            disabled={addingStops}
          >
            {t("widgets.networkAnalysis.addStop") || "Add Stops"}
          </button>
        </div>
        {addingStops && (
          <div className="mt-2 text-sm text-blue-700">
            {t("widgets.networkAnalysis.clickMapToAddStops") || "Click on the map to add stops."}
          </div>
        )}
        <div className="mt-4">
          <div className="font-semibold mb-1">{t("widgets.networkAnalysis.stops") || "Stops"}:</div>
          <DndContext
            sensors={useSensors(useSensor(PointerSensor))}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stops.map((_, idx) => idx.toString())}
              strategy={verticalListSortingStrategy}
            >
              <ul className="list-decimal list-inside text-sm">
                {stops.length === 0 && (
                  <li className="text-muted">{t("widgets.networkAnalysis.noStops") || "No stops added."}</li>
                )}
                {stops.map((stop, idx) => (
                  <SortableStop key={idx} id={idx.toString()} stop={stop} idx={idx} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
        <button
          className="btn btn-secondary w-full mt-2"
          onClick={handleClearStops}
          disabled={stops.length === 0}
        >
          {t("widgets.networkAnalysis.clearStops") || "Clear"}
        </button>
        <button
          className="btn btn-success w-full mt-2"
          onClick={handleFindRoute}
          disabled={stops.length < 2}
        >
          {t("widgets.networkAnalysis.findRoute") || "Find Route"}
        </button>
      </div>
    </div>
  );
};

export default NetworkAnalysis;
