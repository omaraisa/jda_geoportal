"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import dynamic from 'next/dynamic';

// Define map element interface
interface MapElement {
  id: string;
  type: 'TITLE' | 'DATE' | 'SCALE' | 'NORTH_ARROW' | 'JDA_LOGO';
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
  fontWeight?: 'normal' | 'bold';
  rotation?: number;
}

// Define props interface for FabricMapLayout
interface FabricMapLayoutProps {
  mapScreenshot: string;
  elements: MapElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<MapElement>) => void;
  getElementDisplayText: (element: MapElement) => string;
  zoom: number;
  readOnly: boolean;
}

// Dynamically import the FabricMapLayout to avoid SSR issues with canvas
const FabricMapLayout = dynamic<FabricMapLayoutProps>(() => import('./fabric-map-layout-simple'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-gray-600">Loading Map Layout...</p>
      </div>
    </div>
  )
});

const MapLayoutComponent: React.FC = () => {
  const { t } = useTranslation();
  const targetView = useStateStore((state) => state.targetView);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mapScreenshot, setMapScreenshot] = useState<string>('');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.3); // Start with smaller zoom for better overview
  const setLayoutModeActive = useStateStore((state) => state.setLayoutModeActive);

  // Activate full-screen layout mode when component mounts
  useEffect(() => {
    setLayoutModeActive(true);
    return () => {
      setLayoutModeActive(false);
    };
  }, [setLayoutModeActive]);

  // Default map elements configuration
  const [elements, setElements] = useState<MapElement[]>([
    {
      id: 'title',
      type: 'TITLE',
      x: 1754, // Center of A4 landscape
      y: 80,
      fontSize: 72,
      fontFamily: 'Arial',
      color: '#253080',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    {
      id: 'date',
      type: 'DATE',
      x: 3400,
      y: 2400,
      fontSize: 36,
      fontFamily: 'Arial',
      color: '#253080',
      textAlign: 'right'
    },
    {
      id: 'scale',
      type: 'SCALE',
      x: 50,
      y: 2400,
      fontSize: 32,
      fontFamily: 'Arial',
      color: '#253080',
      textAlign: 'left'
    },
    {
      id: 'north-arrow',
      type: 'NORTH_ARROW',
      x: 50,
      y: 50,
      width: 120,
      height: 120,
      rotation: 0
    },
    {
      id: 'jda-logo',
      type: 'JDA_LOGO',
      x: 2900,
      y: 20,
      width: 500,
      height: 200
    }
  ]);

  // Get display text for each element
  const getElementDisplayText = (element: MapElement): string => {
    switch (element.type) {
      case 'TITLE':
        return 'Map Export';
      case 'DATE':
        return `Date: ${new Date().toLocaleDateString()}`;
      case 'SCALE':
        const scale = targetView?.scale ? `1:${Math.round(targetView.scale).toLocaleString()}` : 'Unknown';
        return `Scale: ${scale}`;
      default:
        return '';
    }
  };

  // Update element properties
  const onUpdateElement = (elementId: string, updates: Partial<MapElement>) => {
    setElements(prev => 
      prev.map(element => 
        element.id === elementId ? { ...element, ...updates } : element
      )
    );
  };

  // Handle map screenshot capture
  const captureMapScreenshot = async () => {
    if (!targetView) {
      alert("No map view available");
      return;
    }

    try {
      setIsGenerating(true);
      
      // Capture map at A4 aspect ratio to avoid distortion
      const screenshot = await targetView.takeScreenshot({
        format: "png",
        quality: 100,
        width: 3508,
        height: 2480
      });

      setMapScreenshot(screenshot.dataUrl);
      
      // Also update north arrow rotation based on map rotation
      const mapRotation = (targetView as any).rotation || (targetView as any).camera?.heading || 0;
      onUpdateElement('north-arrow', { rotation: mapRotation });
      
    } catch (error) {
      console.error('Error capturing map:', error);
      alert('Failed to capture map');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate PDF
  const generatePDF = () => {
    if (typeof window !== 'undefined' && (window as any).generateMapLayoutPDF) {
      (window as any).generateMapLayoutPDF();
    } else {
      alert('PDF generation not ready. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="p-4 bg-white border-b">
        <h3 className="text-lg font-semibold mb-4">{t('mapLayouts.title', 'Map Print')}</h3>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={captureMapScreenshot}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-md transition-colors ${
              isGenerating 
                ? 'bg-gray-400 cursor-not-allowed text-gray-700' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isGenerating 
              ? 'Capturing...' 
              : 'Capture Map'
            }
          </button>
          
          <button
            onClick={generatePDF}
            disabled={!mapScreenshot}
            className={`px-4 py-2 rounded-md transition-colors ${
              !mapScreenshot 
                ? 'bg-gray-400 cursor-not-allowed text-gray-700' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Generate PDF
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm">Zoom:</span>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm w-12">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Selected element info */}
        {selectedElementId && (
          <div className="text-sm text-gray-600">
            Selected: {elements.find(e => e.id === selectedElementId)?.type}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto">
        {mapScreenshot ? (
          <FabricMapLayout
            mapScreenshot={mapScreenshot}
            elements={elements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={onUpdateElement}
            getElementDisplayText={getElementDisplayText}
            zoom={zoom}
            readOnly={false}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Capture the map first to start designing your layout</p>
              <button
                onClick={captureMapScreenshot}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md"
              >
                Capture Current Map View
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapLayoutComponent;