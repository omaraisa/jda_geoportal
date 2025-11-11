"use client";

import React, { useEffect, useState, useRef } from "react";
import useStateStore from "@/stateStore";

const MapCapturePreview: React.FC = () => {
  const mapPrintWidgetOpen = useStateStore((state) => state.mapPrintWidgetOpen);
  const [previewBounds, setPreviewBounds] = useState({ width: 0, height: 0, left: 0, top: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapPrintWidgetOpen) return;

    const calculatePreviewBounds = () => {
      // A4 landscape ratio: 297mm x 210mm = 1.414:1
      const targetRatio = 297 / 210;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const viewportRatio = viewportWidth / viewportHeight;

      let previewWidth: number;
      let previewHeight: number;

      if (viewportRatio > targetRatio) {
        // Viewport is wider than target ratio - constrain by height
        previewHeight = viewportHeight * 0.9; // Use 90% of viewport height
        previewWidth = previewHeight * targetRatio;
      } else {
        // Viewport is taller than target ratio - constrain by width
        previewWidth = viewportWidth * 0.9; // Use 90% of viewport width
        previewHeight = previewWidth / targetRatio;
      }

      // Center the preview
      const left = (viewportWidth - previewWidth) / 2;
      const top = (viewportHeight - previewHeight) / 2;

      setPreviewBounds({
        width: previewWidth,
        height: previewHeight,
        left,
        top,
      });
    };

    calculatePreviewBounds();
    window.addEventListener('resize', calculatePreviewBounds);

    return () => {
      window.removeEventListener('resize', calculatePreviewBounds);
    };
  }, [mapPrintWidgetOpen]);

  if (!mapPrintWidgetOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-40"
      style={{
        zIndex: 40, // Below sidebar (50) but above map content
      }}
    >
      {/* Overlay border showing capture area */}
      <div
        className="absolute border-4 border-blue-500 shadow-lg"
        style={{
          left: `${previewBounds.left}px`,
          top: `${previewBounds.top}px`,
          width: `${previewBounds.width}px`,
          height: `${previewBounds.height}px`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Label */}
        <div className="absolute -top-10 left-0 bg-blue-500 text-white px-4 py-2 rounded-t-lg text-sm font-semibold">
          Screenshot Preview Area (A4 Landscape)
        </div>
        
        {/* Corner markers */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full"></div>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  );
};

export default MapCapturePreview;
