'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import jsPDF from 'jspdf';
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";

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

interface FabricMapLayoutProps {
  mapScreenshot?: string;
  elements: MapElement[];
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<MapElement>) => void;
  getElementDisplayText: (element: MapElement) => string;
  zoom: number;
  readOnly?: boolean;
}

export default function FabricMapLayout({
  mapScreenshot,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  getElementDisplayText,
  zoom,
  readOnly = false
}: FabricMapLayoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  
  // Fixed map layout dimensions (A4 landscape at 300 DPI)
  const MAP_WIDTH = 3508;
  const MAP_HEIGHT = 2480;
  
  // Fixed canvas display size (fits in viewport)
  const CANVAS_DISPLAY_WIDTH = 1000;
  const CANVAS_DISPLAY_HEIGHT = 707; // Maintaining 3508:2480 aspect ratio
  
  // Calculate scale factor to display the map layout in the canvas
  const displayScale = CANVAS_DISPLAY_WIDTH / MAP_WIDTH;

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_DISPLAY_WIDTH,
      height: CANVAS_DISPLAY_HEIGHT,
      backgroundColor: '#f0f0f0',
      selection: !readOnly,
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;
    setIsCanvasReady(true);

    // Canvas event handlers - only attach if not in read-only mode
    if (!readOnly) {
      canvas.on('selection:created', (e: fabric.IEvent) => {
        const activeObject = e.selected?.[0];
        if (activeObject && activeObject.data?.elementId) {
          onSelectElement(activeObject.data.elementId);
        }
      });

      canvas.on('selection:updated', (e: fabric.IEvent) => {
        const activeObject = e.selected?.[0];
        if (activeObject && activeObject.data?.elementId) {
          onSelectElement(activeObject.data.elementId);
        }
      });

      canvas.on('selection:cleared', () => {
        onSelectElement(null);
      });

      canvas.on('object:modified', (e: fabric.IEvent) => {
        const target = e.target;
        if (target && target.data?.elementId) {
          // Convert canvas coordinates back to actual layout coordinates
          const actualScale = displayScale * zoom;
          const updates: Partial<MapElement> = {
            x: (target.left || 0) / actualScale,
            y: (target.top || 0) / actualScale,
            rotation: target.angle || 0
          };

          if (target.type === 'textbox' || target.type === 'text') {
            const textObj = target as fabric.Text;
            updates.fontSize = (textObj.fontSize || 16) / actualScale;
          }

          if (target.data?.elementType === 'NORTH_ARROW' || target.data?.elementType === 'JDA_LOGO') {
            updates.width = (target.width || 150) * (target.scaleX || 1) / actualScale;
            updates.height = (target.height || 150) * (target.scaleY || 1) / actualScale;
          }

          onUpdateElement(target.data.elementId, updates);
          canvas.renderAll();
        }
      });
    }

    return () => {
      canvas.dispose();
    };
  }, [readOnly]);

  // Update canvas zoom
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.setZoom(zoom);
    canvas.renderAll();
  }, [zoom]);

  // Load map screenshot as background
  useEffect(() => {
    if (!fabricCanvasRef.current || !mapScreenshot || !isCanvasReady) return;

    const canvas = fabricCanvasRef.current;

    fabric.Image.fromURL(mapScreenshot, (img: fabric.Image) => {
      // Scale the image to fit the fixed canvas size
      const imageScale = displayScale * zoom;
      
      img.set({
        left: 0,
        top: 0,
        scaleX: imageScale,
        scaleY: imageScale,
        selectable: false,
        evented: false,
        excludeFromExport: false
      });

      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });
  }, [mapScreenshot, zoom, isCanvasReady, displayScale]);

  // Update elements on canvas
  useEffect(() => {
    if (!fabricCanvasRef.current || !isCanvasReady) return;

    const canvas = fabricCanvasRef.current;
    
    // Remove existing element objects (but keep background)
    const objects = canvas.getObjects().filter((obj: fabric.Object) => obj.data?.elementId);
    objects.forEach((obj: fabric.Object) => canvas.remove(obj));

    // Calculate the actual scale for positioning elements
    const actualScale = displayScale * zoom;

    // Add element objects
    elements.forEach((element) => {
      
      if (element.type === 'NORTH_ARROW') {
        // Load north arrow image
        fabric.Image.fromURL('/north-arrow.png', (arrowImg: fabric.Image) => {
          if (arrowImg) {
            const arrowWidth = (element.width || 120) * actualScale;
            const arrowHeight = (element.height || 120) * actualScale;
            
            arrowImg.set({
              left: element.x * actualScale,
              top: element.y * actualScale,
              scaleX: arrowWidth / (arrowImg.width || 120),
              scaleY: arrowHeight / (arrowImg.height || 120),
              angle: element.rotation || 0,
              selectable: !readOnly,
              evented: !readOnly,
              data: { elementId: element.id, elementType: 'NORTH_ARROW' }
            });
            canvas.add(arrowImg);
            canvas.renderAll();
          }
        });
      } else if (element.type === 'JDA_LOGO') {
        // Load JDA logo image
        fabric.Image.fromURL('/jda_logo.png', (logoImg: fabric.Image) => {
          if (logoImg) {
            const logoWidth = (element.width || 500) * actualScale;
            // Maintain aspect ratio
            const aspectRatio = (logoImg.height || 1) / (logoImg.width || 1);
            const logoHeight = logoWidth * aspectRatio;
            
            logoImg.set({
              left: element.x * actualScale,
              top: element.y * actualScale,
              scaleX: logoWidth / (logoImg.width || 500),
              scaleY: logoHeight / (logoImg.height || 500),
              angle: element.rotation || 0,
              selectable: !readOnly,
              evented: !readOnly,
              data: { elementId: element.id, elementType: 'JDA_LOGO' }
            });
            canvas.add(logoImg);
            canvas.renderAll();
          }
        });
      } else {
        // Create text element (TITLE, DATE, SCALE)
        const textLeft = element.x * actualScale;
        const textTop = element.y * actualScale;
        const textSize = (element.fontSize || 32) * actualScale;
        
        const text = new fabric.Textbox(getElementDisplayText(element), {
          left: textLeft,
          top: textTop,
          fontSize: Math.max(textSize, 10),
          fontFamily: element.fontFamily || 'Arial',
          fill: element.color || '#253080',
          textAlign: element.textAlign || 'left',
          fontWeight: element.fontWeight || 'normal',
          angle: element.rotation || 0,
          width: 400 * actualScale, // Default width
          selectable: !readOnly,
          editable: !readOnly,
          evented: !readOnly,
          data: { elementId: element.id, elementType: element.type }
        });

        canvas.add(text);
      }
    });

    // Select the currently selected element
    if (selectedElementId) {
      const targetObject = canvas.getObjects().find((obj: fabric.Object) => obj.data?.elementId === selectedElementId);
      if (targetObject) {
        canvas.setActiveObject(targetObject);
      }
    }

    canvas.renderAll();
  }, [elements, selectedElementId, zoom, isCanvasReady, getElementDisplayText, displayScale, readOnly]);

  // Export canvas as image for PDF generation
  const exportCanvasImage = () => {
    if (!fabricCanvasRef.current) return null;
    
    const canvas = fabricCanvasRef.current;
    
    // Export at full resolution
    const multiplier = MAP_WIDTH / CANVAS_DISPLAY_WIDTH;
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: multiplier
    });
    
    return dataURL;
  };

  // Generate PDF
  const generatePDF = () => {
    const canvasDataUrl = exportCanvasImage();
    if (!canvasDataUrl) return;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    pdf.addImage(canvasDataUrl, 'PNG', 0, 0, 297, 210);

    const fileName = `map-layout-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
    pdf.save(fileName);
  };

  // Expose functions to parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).exportMapLayoutCanvas = exportCanvasImage;
      (window as any).generateMapLayoutPDF = generatePDF;
    }
  }, []);

  return (
    <div className="flex justify-center items-center bg-gray-100 p-4">
      <div className="border border-gray-300 shadow-lg">
        <canvas 
          ref={canvasRef} 
          style={{ 
            width: `${CANVAS_DISPLAY_WIDTH}px`, 
            height: `${CANVAS_DISPLAY_HEIGHT}px`,
            maxWidth: '100%',
            maxHeight: '100%'
          }} 
        />
      </div>
    </div>
  );
}