"use client";

import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

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
  mapScreenshot: string;
  elements: MapElement[];
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<MapElement>) => void;
  getElementDisplayText: (element: MapElement) => string;
  zoom: number;
  readOnly?: boolean;
}

const FabricMapLayout: React.FC<FabricMapLayoutProps> = ({
  mapScreenshot,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  getElementDisplayText,
  zoom,
  readOnly = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);

  // Canvas dimensions (A4 landscape at 300 DPI)
  const CANVAS_WIDTH = 3508;
  const CANVAS_HEIGHT = 2480;
  const DISPLAY_SCALE = 0.2; // Scale down for display

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH * DISPLAY_SCALE,
      height: CANVAS_HEIGHT * DISPLAY_SCALE,
      backgroundColor: '#ffffff',
      selection: !readOnly,
    });

    fabricCanvasRef.current = canvas;

    // Load map screenshot as background
    if (mapScreenshot) {
      const img = new Image();
      img.onload = () => {
        const fabricImg = new fabric.Image(img, {
          left: 0,
          top: 0,
          scaleX: (CANVAS_WIDTH * DISPLAY_SCALE) / img.width,
          scaleY: (CANVAS_HEIGHT * DISPLAY_SCALE) / img.height,
          selectable: false,
          evented: false,
        });
        canvas.add(fabricImg);
        canvas.sendToBack(fabricImg);
        canvas.renderAll();
      };
      img.src = mapScreenshot;
    }

    // Event handlers
    if (!readOnly) {
      canvas.on('selection:created', (options: any) => {
        const activeObject = options.selected?.[0];
        if (activeObject && activeObject.data?.elementId) {
          onSelectElement(activeObject.data.elementId);
        }
      });

      canvas.on('selection:updated', (options: any) => {
        const activeObject = options.selected?.[0];
        if (activeObject && activeObject.data?.elementId) {
          onSelectElement(activeObject.data.elementId);
        }
      });

      canvas.on('selection:cleared', () => {
        onSelectElement(null);
      });

      canvas.on('object:modified', (options: any) => {
        const target = options.target;
        if (target && target.data?.elementId) {
          const updates: Partial<MapElement> = {
            x: (target.left || 0) / DISPLAY_SCALE,
            y: (target.top || 0) / DISPLAY_SCALE,
            rotation: target.angle || 0
          };

          if (target.type === 'textbox' || target.type === 'text') {
            updates.fontSize = (target.fontSize || 16) / DISPLAY_SCALE;
          }

          onUpdateElement(target.data.elementId, updates);
        }
      });
    }

    return () => {
      canvas.dispose();
    };
  }, [readOnly]);

  // Update zoom
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setZoom(zoom);
    fabricCanvasRef.current.renderAll();
  }, [zoom]);

  // Update elements
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Remove existing elements
    const existingElements = canvas.getObjects().filter((obj: any) =>
      obj.data?.elementId && obj !== canvas.getObjects().find((o: any) => o.data?.type === 'background')
    );
    existingElements.forEach((obj: any) => canvas.remove(obj));

    // Add elements
    elements.forEach((element) => {
      const scale = DISPLAY_SCALE;

      if (element.type === 'TITLE' || element.type === 'DATE' || element.type === 'SCALE') {
        const text = new fabric.Textbox(getElementDisplayText(element), {
          left: element.x * scale,
          top: element.y * scale,
          fontSize: (element.fontSize || 24) * scale,
          fontFamily: element.fontFamily || 'Arial',
          fill: element.color || '#000000',
          textAlign: element.textAlign || 'left',
          fontWeight: element.fontWeight || 'normal',
          angle: element.rotation || 0,
          width: 400 * scale,
          selectable: !readOnly,
          editable: !readOnly,
          data: { elementId: element.id, type: element.type }
        });
        canvas.add(text);
      } else if (element.type === 'NORTH_ARROW') {
        // Simple triangle for north arrow
        const arrow = new fabric.Triangle({
          left: element.x * scale,
          top: element.y * scale,
          width: (element.width || 50) * scale,
          height: (element.height || 50) * scale,
          fill: '#000000',
          angle: (element.rotation || 0) - 90,
          selectable: !readOnly,
          data: { elementId: element.id, type: element.type }
        });
        canvas.add(arrow);
      } else if (element.type === 'JDA_LOGO') {
        // Placeholder rectangle for logo
        const logo = new fabric.Rect({
          left: element.x * scale,
          top: element.y * scale,
          width: (element.width || 100) * scale,
          height: (element.height || 50) * scale,
          fill: 'rgba(37, 48, 128, 0.8)',
          stroke: '#253080',
          strokeWidth: 2,
          angle: element.rotation || 0,
          selectable: !readOnly,
          data: { elementId: element.id, type: element.type }
        });

        const logoText = new fabric.Text('JDA', {
          left: element.x * scale + ((element.width || 100) * scale) / 2,
          top: element.y * scale + ((element.height || 50) * scale) / 2,
          fontSize: 16 * scale,
          fontFamily: 'Arial',
          fill: '#ffffff',
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          selectable: false,
          data: { elementId: element.id, type: 'logo-text' }
        });

        canvas.add(logo);
        canvas.add(logoText);
      }
    });

    // Select current element
    if (selectedElementId) {
      const targetObject = canvas.getObjects().find((obj: any) => obj.data?.elementId === selectedElementId);
      if (targetObject) {
        canvas.setActiveObject(targetObject);
      }
    }

    canvas.renderAll();
  }, [elements, selectedElementId, getElementDisplayText]);

  return (
    <div className="flex justify-center p-4">
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid #ccc',
          maxWidth: '100%',
          maxHeight: '70vh'
        }}
      />
    </div>
  );
};

export default FabricMapLayout;