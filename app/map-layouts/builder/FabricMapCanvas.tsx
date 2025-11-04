'use client';

import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

interface MapLayoutElement {
  id: string;
  type: 'legend' | 'north-arrow' | 'title' | 'text' | 'logo' | 'scale-bar' | 'map-capture';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  text?: string;
  imageUrl?: string;
  properties?: Record<string, any>;
}

interface MapLayoutTemplate {
  id?: string;
  name: string;
  description: string;
  backgroundMapType: 'satellite' | 'streets' | 'topographic' | 'darkgray';
  layoutWidth: number;
  layoutHeight: number;
  elements: MapLayoutElement[];
}

interface FabricMapCanvasProps {
  template: MapLayoutTemplate;
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<MapLayoutElement>) => void;
  getElementDisplayText: (element: MapLayoutElement) => string;
  zoom: number;
  mapViewCaptured: string | null;
  readOnly?: boolean;
}

export default function FabricMapCanvas({
  template,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  getElementDisplayText,
  zoom,
  mapViewCaptured,
  readOnly = false
}: FabricMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  
  // Fixed canvas display size (fits in viewport while maintaining aspect ratio)
  const CANVAS_DISPLAY_WIDTH = 800;
  const CANVAS_DISPLAY_HEIGHT = 565; // Maintaining A4 aspect ratio
  
  // Calculate scale factor to display the layout in the canvas
  const displayScale = CANVAS_DISPLAY_WIDTH / template.layoutWidth;

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_DISPLAY_WIDTH,
      height: CANVAS_DISPLAY_HEIGHT,
      backgroundColor: '#f8f9fa',
      selection: !readOnly,
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;
    setIsCanvasReady(true);

    // Canvas event handlers - only attach if not in read-only mode
    if (!readOnly) {
      canvas.on('selection:created', (options) => {
        const activeObject = options.selected?.[0];
        if (activeObject && (activeObject as any).data?.elementId) {
          onSelectElement((activeObject as any).data.elementId);
        }
      });

      canvas.on('selection:updated', (options) => {
        const activeObject = options.selected?.[0];
        if (activeObject && (activeObject as any).data?.elementId) {
          onSelectElement((activeObject as any).data.elementId);
        }
      });

      canvas.on('selection:cleared', () => {
        onSelectElement(null);
      });

      canvas.on('object:modified', (options) => {
        const target = options.target;
        if (target && (target as any).data?.elementId) {
          // Convert canvas coordinates back to actual layout coordinates
          const actualScale = displayScale * zoom;
          const updates: Partial<MapLayoutElement> = {
            x: (target.left || 0) / actualScale,
            y: (target.top || 0) / actualScale,
            rotation: target.angle || 0
          };

          if (target.type === 'textbox' || target.type === 'text') {
            const textObj = target as any;
            updates.fontSize = (textObj.fontSize || 16) / actualScale;
          }

          if ((target as any).data?.elementType === 'map-capture' || (target as any).data?.elementType === 'logo' || 
              (target as any).data?.elementType === 'legend' || (target as any).data?.elementType === 'north-arrow' || 
              (target as any).data?.elementType === 'scale-bar') {
            updates.width = (target.width || 150) * (target.scaleX || 1) / actualScale;
            updates.height = (target.height || 150) * (target.scaleY || 1) / actualScale;
          }

          onUpdateElement((target as any).data.elementId, updates);
          canvas.renderAll();
        }
      });
    }

    return () => {
      canvas.dispose();
    };
  }, [readOnly, template.layoutWidth]); // Re-initialize when readOnly changes

  // Update canvas zoom
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.setZoom(zoom);
    canvas.renderAll();
  }, [zoom]);

  // Update elements on canvas
  useEffect(() => {
    if (!fabricCanvasRef.current || !isCanvasReady) return;

    const canvas = fabricCanvasRef.current;
    
    // Remove existing element objects
    const objects = canvas.getObjects().filter((obj: any) => obj.data?.elementId);
    objects.forEach((obj: any) => canvas.remove(obj));

    // Calculate the actual scale for positioning elements
    const actualScale = displayScale * zoom;

    // Add element objects
    template.elements.forEach((element) => {
      
      if (element.type === 'map-capture') {
        if (mapViewCaptured) {
          // Create map view as image
          fabric.FabricImage.fromURL(mapViewCaptured).then((mapImg) => {
            if (mapImg) {
              const elemWidth = (element.width || 1000) * actualScale;
              const elemHeight = (element.height || 800) * actualScale;
              
              mapImg.set({
                left: element.x * actualScale,
                top: element.y * actualScale,
                scaleX: elemWidth / (mapImg.width || 1),
                scaleY: elemHeight / (mapImg.height || 1),
                angle: element.rotation || 0,
                selectable: !readOnly,
                evented: !readOnly,
                data: { elementId: element.id, elementType: 'map-capture' }
              });
              canvas.add(mapImg);
              canvas.renderAll();
            }
          });
        } else {
          // Placeholder for map capture
          const mapPlaceholder = new fabric.Rect({
            left: element.x * actualScale,
            top: element.y * actualScale,
            width: (element.width || 1000) * actualScale,
            height: (element.height || 800) * actualScale,
            fill: 'rgba(200, 200, 200, 0.5)',
            stroke: '#999',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            angle: element.rotation || 0,
            selectable: !readOnly,
            evented: !readOnly,
            data: { elementId: element.id, elementType: 'map-capture' }
          });

          const placeholderText = new fabric.Text('📸 Capture Map View', {
            left: element.x * actualScale + ((element.width || 1000) * actualScale) / 2,
            top: element.y * actualScale + ((element.height || 800) * actualScale) / 2,
            fontSize: 24 * actualScale,
            fontFamily: 'Arial',
            fill: '#666',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            data: { elementId: element.id, elementType: 'map-text' }
          });

          canvas.add(mapPlaceholder);
          canvas.add(placeholderText);
        }
      } else if (element.type === 'legend') {
        // Create legend placeholder
        const legendRect = new fabric.Rect({
          left: element.x * actualScale,
          top: element.y * actualScale,
          width: (element.width || 200) * actualScale,
          height: (element.height || 300) * actualScale,
          fill: 'rgba(255, 255, 255, 0.9)',
          stroke: '#000',
          strokeWidth: 1,
          angle: element.rotation || 0,
          selectable: !readOnly,
          evented: !readOnly,
          data: { elementId: element.id, elementType: 'legend' }
        });

        const legendText = new fabric.Text('📋 Legend\n• Layer 1\n• Layer 2\n• Layer 3', {
          left: element.x * actualScale + 10,
          top: element.y * actualScale + 10,
          fontSize: 14 * actualScale,
          fontFamily: 'Arial',
          fill: '#000',
          selectable: false,
          evented: false,
          data: { elementId: element.id, elementType: 'legend-text' }
        });

        canvas.add(legendRect);
        canvas.add(legendText);
      } else if (element.type === 'north-arrow') {
        // Create north arrow
        const arrowSize = Math.min(element.width || 80, element.height || 80) * actualScale;
        
        const northArrow = new fabric.Triangle({
          left: element.x * actualScale,
          top: element.y * actualScale,
          width: arrowSize,
          height: arrowSize,
          fill: '#000',
          angle: (element.rotation || 0) - 90, // Point north by default
          selectable: !readOnly,
          evented: !readOnly,
          data: { elementId: element.id, elementType: 'north-arrow' }
        });

        const northText = new fabric.Text('N', {
          left: element.x * actualScale + arrowSize / 2,
          top: element.y * actualScale + arrowSize + 5,
          fontSize: 16 * actualScale,
          fontFamily: 'Arial',
          fill: '#000',
          fontWeight: 'bold',
          textAlign: 'center',
          originX: 'center',
          originY: 'top',
          selectable: false,
          evented: false,
          data: { elementId: element.id, elementType: 'north-text' }
        });

        canvas.add(northArrow);
        canvas.add(northText);
      } else if (element.type === 'scale-bar') {
        // Create scale bar
        const scaleWidth = (element.width || 200) * actualScale;
        const scaleHeight = (element.height || 20) * actualScale;
        
        const scaleBar = new fabric.Rect({
          left: element.x * actualScale,
          top: element.y * actualScale,
          width: scaleWidth,
          height: scaleHeight,
          fill: '#000',
          angle: element.rotation || 0,
          selectable: !readOnly,
          evented: !readOnly,
          data: { elementId: element.id, elementType: 'scale-bar' }
        });

        const scaleText = new fabric.Text('0    500m    1km', {
          left: element.x * actualScale,
          top: element.y * actualScale + scaleHeight + 5,
          fontSize: 12 * actualScale,
          fontFamily: 'Arial',
          fill: '#000',
          selectable: false,
          evented: false,
          data: { elementId: element.id, elementType: 'scale-text' }
        });

        canvas.add(scaleBar);
        canvas.add(scaleText);
      } else if (element.type === 'logo') {
        // Create logo placeholder or actual image
        if (element.imageUrl) {
          fabric.FabricImage.fromURL(element.imageUrl).then((logoImg) => {
            if (logoImg) {
              const elemWidth = (element.width || 150) * actualScale;
              const elemHeight = (element.height || 150) * actualScale;
              
              logoImg.set({
                left: element.x * actualScale,
                top: element.y * actualScale,
                scaleX: elemWidth / (logoImg.width || 1),
                scaleY: elemHeight / (logoImg.height || 1),
                angle: element.rotation || 0,
                selectable: !readOnly,
                evented: !readOnly,
                data: { elementId: element.id, elementType: 'logo' }
              });
              canvas.add(logoImg);
              canvas.renderAll();
            }
          });
        } else {
          // Placeholder for logo
          const logoPlaceholder = new fabric.Rect({
            left: element.x * actualScale,
            top: element.y * actualScale,
            width: (element.width || 150) * actualScale,
            height: (element.height || 150) * actualScale,
            fill: 'rgba(200, 200, 200, 0.5)',
            stroke: '#999',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            angle: element.rotation || 0,
            selectable: !readOnly,
            evented: !readOnly,
            data: { elementId: element.id, elementType: 'logo' }
          });

          const logoText = new fabric.Text('🖼️ Logo', {
            left: element.x * actualScale + ((element.width || 150) * actualScale) / 2,
            top: element.y * actualScale + ((element.height || 150) * actualScale) / 2,
            fontSize: 16 * actualScale,
            fontFamily: 'Arial',
            fill: '#666',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            data: { elementId: element.id, elementType: 'logo-text' }
          });

          canvas.add(logoPlaceholder);
          canvas.add(logoText);
        }
      } else if (element.type === 'title' || element.type === 'text') {
        // Create text element
        const textLeft = element.x * actualScale;
        const textTop = element.y * actualScale;
        const textSize = (element.fontSize || 24) * actualScale;
        
        const text = new fabric.Textbox(getElementDisplayText(element), {
          left: textLeft,
          top: textTop,
          fontSize: Math.max(textSize, 10),
          fontFamily: element.fontFamily || 'Arial',
          fill: element.color || '#000000',
          textAlign: element.textAlign || 'left',
          fontWeight: element.fontWeight || 'normal',
          angle: element.rotation || 0,
          width: 300 * actualScale, // Default width
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
      const targetObject = canvas.getObjects().find((obj: any) => obj.data?.elementId === selectedElementId);
      if (targetObject) {
        canvas.setActiveObject(targetObject);
      }
    }

    canvas.renderAll();
  }, [template.elements, selectedElementId, zoom, isCanvasReady, getElementDisplayText, displayScale, readOnly, mapViewCaptured]);

  // Export canvas as image for PNG generation
  const exportCanvasImage = () => {
    if (!fabricCanvasRef.current) return null;
    
    const canvas = fabricCanvasRef.current;
    
    // Export at full resolution
    const multiplier = template.layoutWidth / CANVAS_DISPLAY_WIDTH;
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: multiplier
    });
    
    return dataURL;
  };

  // Expose export function to parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & typeof globalThis & { exportMapLayoutCanvas: () => string | null }).exportMapLayoutCanvas = exportCanvasImage;
    }
  }, [exportCanvasImage, template.layoutWidth]);

  return (
    <div className="flex justify-center items-center bg-gray-100 p-4">
      <div className="border border-gray-300 shadow-lg bg-white">
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