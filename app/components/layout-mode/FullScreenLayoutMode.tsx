"use client";

import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import useStateStore from "@/stateStore";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";

// Properties Panel Components
const TextPropertiesPanel: React.FC<{ object: fabric.Text; canvas: fabric.Canvas | null }> = ({ object, canvas }) => {
  const { t } = useTranslation();
  const [text, setText] = useState(object.text || '');
  const [fontSize, setFontSize] = useState(object.fontSize || 12);
  const [fontFamily, setFontFamily] = useState(object.fontFamily || 'Arial');
  const [fill, setFill] = useState(() => {
    const objFill = object.fill;
    if (typeof objFill === 'string') return objFill;
    return '#000000'; // Default fallback for Pattern/Gradient
  });

  useEffect(() => {
    const objFill = object.fill;
    setFill(typeof objFill === 'string' ? objFill : '#000000');
    setFontSize(object.fontSize || 12);
    setFontFamily(object.fontFamily || 'Arial');
  }, [object]);

  const updateText = (property: keyof fabric.Text, value: any) => {
    object.set(property, value);
    canvas?.renderAll();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.textContent', 'Text Content')}</label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            updateText('text', e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.fontSize', 'Font Size')}</label>
        <input
          type="number"
          value={fontSize}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setFontSize(value);
            updateText('fontSize', value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          min="8"
          max="200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.fontFamily', 'Font Family')}</label>
        <select
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            updateText('fontFamily', e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="Tajawal, Arial, Helvetica, sans-serif">Tajawal</option>
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.textColor', 'Text Color')}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={fill}
            onChange={(e) => {
              setFill(e.target.value);
              updateText('fill', e.target.value);
            }}
            className="w-10 h-8 border border-gray-300 rounded"
          />
          <input
            type="text"
            value={fill}
            onChange={(e) => {
              setFill(e.target.value);
              updateText('fill', e.target.value);
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="#000000"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => updateText('fontWeight', object.fontWeight === 'bold' ? 'normal' : 'bold')}
          className={`px-3 py-1 text-xs rounded ${object.fontWeight === 'bold' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          {t('layoutMode.propertiesPanel.bold', 'Bold')}
        </button>
        <button
          onClick={() => updateText('fontStyle', object.fontStyle === 'italic' ? 'normal' : 'italic')}
          className={`px-3 py-1 text-xs rounded ${object.fontStyle === 'italic' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          {t('layoutMode.propertiesPanel.italic', 'Italic')}
        </button>
        <button
          onClick={() => updateText('underline', !object.underline)}
          className={`px-3 py-1 text-xs rounded ${object.underline ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          {t('layoutMode.propertiesPanel.underline', 'Underline')}
        </button>
      </div>
    </div>
  );
};

const ShapePropertiesPanel: React.FC<{ object: fabric.Rect | fabric.Circle; canvas: fabric.Canvas | null }> = ({ object, canvas }) => {
  const { t } = useTranslation();
  const [fill, setFill] = useState(() => {
    const objFill = object.fill;
    return typeof objFill === 'string' ? objFill : '#cccccc';
  });
  const [stroke, setStroke] = useState(() => {
    const objStroke = object.stroke;
    return typeof objStroke === 'string' ? objStroke : '#000000';
  });
  const [strokeWidth, setStrokeWidth] = useState(object.strokeWidth || 1);
  const [opacity, setOpacity] = useState(object.opacity || 1);

  useEffect(() => {
    const objFill = object.fill;
    const objStroke = object.stroke;
    setFill(typeof objFill === 'string' ? objFill : '#cccccc');
    setStroke(typeof objStroke === 'string' ? objStroke : '#000000');
    setStrokeWidth(object.strokeWidth || 1);
    setOpacity(object.opacity || 1);
  }, [object]);

  const updateShape = (property: keyof fabric.Object, value: any) => {
    (object as fabric.Object).set(property, value);
    canvas?.renderAll();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.fillColor', 'Fill Color')}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={fill}
            onChange={(e) => {
              setFill(e.target.value);
              updateShape('fill', e.target.value);
            }}
            className="w-10 h-8 border border-gray-300 rounded"
          />
          <input
            type="text"
            value={fill}
            onChange={(e) => {
              setFill(e.target.value);
              updateShape('fill', e.target.value);
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="#cccccc"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.strokeColor', 'Stroke Color')}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={stroke}
            onChange={(e) => {
              setStroke(e.target.value);
              updateShape('stroke', e.target.value);
            }}
            className="w-10 h-8 border border-gray-300 rounded"
          />
          <input
            type="text"
            value={stroke}
            onChange={(e) => {
              setStroke(e.target.value);
              updateShape('stroke', e.target.value);
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="#000000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.strokeWidth', 'Stroke Width')}</label>
        <input
          type="number"
          value={strokeWidth}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setStrokeWidth(value);
            updateShape('strokeWidth', value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          min="0"
          max="20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.opacity', 'Opacity')}</label>
        <input
          type="range"
          value={opacity}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            setOpacity(value);
            updateShape('opacity', value);
          }}
          className="w-full"
          min="0"
          max="1"
          step="0.1"
        />
        <div className="text-xs text-gray-500 mt-1">{Math.round(opacity * 100)}%</div>
      </div>
    </div>
  );
};

const GroupPropertiesPanel: React.FC<{ object: fabric.Group; canvas: fabric.Canvas | null; isLegend?: boolean; legendColumns?: number; onLegendColumnsChange?: (columns: number) => void; legendTitle?: string; onLegendTitleChange?: (title: string) => void }> = ({ object, canvas, isLegend = false, legendColumns = 1, onLegendColumnsChange, legendTitle = 'مفتاح الخريطة', onLegendTitleChange }) => {
  const { t } = useTranslation();
  const [opacity, setOpacity] = useState(object.opacity || 1);
  const [scaleX, setScaleX] = useState(object.scaleX || 1);
  const [scaleY, setScaleY] = useState(object.scaleY || 1);

  useEffect(() => {
    setOpacity(object.opacity || 1);
    setScaleX(object.scaleX || 1);
    setScaleY(object.scaleY || 1);
  }, [object]);

  const updateGroup = (property: keyof fabric.Group, value: any) => {
    object.set(property, value);
    canvas?.renderAll();
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        <p><strong>{t('layoutMode.propertiesPanel.type', 'Type:')}</strong> {isLegend ? 'Legend' : 'Group'}</p>
        <p><strong>{t('layoutMode.propertiesPanel.objects', 'Objects:')}</strong> {object._objects?.length || 0}</p>
      </div>

      {isLegend && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.columns', 'Columns')}</label>
            <select
              value={legendColumns}
              onChange={(e) => {
                const newColumns = parseInt(e.target.value);
                onLegendColumnsChange?.(newColumns);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={1}>1 Column</option>
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
              <option value={4}>4 Columns</option>
              <option value={5}>5 Columns</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.title', 'Title')}</label>
            <input
              type="text"
              value={legendTitle}
              onChange={(e) => {
                const newTitle = e.target.value;
                onLegendTitleChange?.(newTitle);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Enter legend title"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.opacity', 'Opacity')}</label>
        <input
          type="range"
          value={opacity}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            setOpacity(value);
            updateGroup('opacity', value);
          }}
          className="w-full"
          min="0"
          max="1"
          step="0.1"
        />
        <div className="text-xs text-gray-500 mt-1">{Math.round(opacity * 100)}%</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.scaleX', 'Scale X')}</label>
          <input
            type="number"
            value={scaleX.toFixed(2)}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setScaleX(value);
              updateGroup('scaleX', value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            step="0.1"
            min="0.1"
            max="5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('layoutMode.propertiesPanel.scaleY', 'Scale Y')}</label>
          <input
            type="number"
            value={scaleY.toFixed(2)}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setScaleY(value);
              updateGroup('scaleY', value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            step="0.1"
            min="0.1"
            max="5"
          />
        </div>
      </div>

      <button
        onClick={() => {
          object.set({ scaleX: 1, scaleY: 1 });
          setScaleX(1);
          setScaleY(1);
          canvas?.renderAll();
        }}
        className="w-full px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
      >
        {t('layoutMode.propertiesPanel.resetScale', 'Reset Scale')}
      </button>
    </div>
  );
};

const FullScreenLayoutMode: React.FC = () => {
  const { t, i18n } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const targetView = useStateStore((state) => state.targetView);
  const setLayoutModeActive = useStateStore((state) => state.setLayoutModeActive);
  const language = useStateStore((state) => state.language);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [mapImageLoaded, setMapImageLoaded] = useState(false);
  const [mapTitle, setMapTitle] = useState('Map Export');
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [showProperties, setShowProperties] = useState(true);

  // Synchronize i18n with state store language
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  // Fixed canvas dimensions for A4 landscape at 300 DPI
  const CANVAS_WIDTH = 3508;
  const CANVAS_HEIGHT = 2480;

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
    });

    fabricCanvasRef.current = canvas;

    // Scale canvas to fit screen while maintaining aspect ratio
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const scaleX = containerWidth / CANVAS_WIDTH;
    const scaleY = containerHeight / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave some margin

    canvas.setZoom(scale);
    canvas.setWidth(CANVAS_WIDTH * scale);
    canvas.setHeight(CANVAS_HEIGHT * scale);

    // Add selection event listeners
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // Load map as background
    loadMapBackground();

    // Add default layout elements
    addDefaultElements();

    return () => {
      canvas.dispose();
    };
  }, []);

  const loadMapBackground = async () => {
    if (!targetView || !fabricCanvasRef.current) return;

    try {
      // Import the calculateCaptureBounds function to get the exact preview area
      const { calculateCaptureBounds } = await import('../MapCapturePreview');
      const previewBounds = calculateCaptureBounds();

      // Calculate the area parameter for takeScreenshot to match the preview exactly
      // The area parameter uses screen coordinates (pixels on the screen)
      const area = {
        x: previewBounds.left,
        y: previewBounds.top,
        width: previewBounds.width,
        height: previewBounds.height
      };

      // Take high-resolution screenshot of the exact preview area
      // Use 2x multiplier for high quality while maintaining the exact area
      const screenshot = await targetView.takeScreenshot({
        format: "png",
        quality: 100,
        area: area,
        width: previewBounds.width * 2,  // 2x resolution for quality
        height: previewBounds.height * 2
      });

      fabric.Image.fromURL(screenshot.dataUrl, (img) => {
        if (!fabricCanvasRef.current) return;

        // Scale image to fill canvas
        img.scaleToWidth(CANVAS_WIDTH);
        img.scaleToHeight(CANVAS_HEIGHT);
        img.set({
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
        });

        // Set as background
        fabricCanvasRef.current.setBackgroundImage(img, fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
        setMapImageLoaded(true);
      });
    } catch (error) {
      console.error('Error loading map:', error);
    }
  };

  const addDefaultElements = () => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Add semi-transparent background for title
    const titleBg = new fabric.Rect({
      left: 0,
      top: 0,
      width: CANVAS_WIDTH,
      height: 150,
      fill: 'rgba(255, 255, 255, 0.8)',
      selectable: false,
      evented: false,
    });
    canvas.add(titleBg);

    // Add title text
    const title = new fabric.Text(mapTitle, {
      left: CANVAS_WIDTH / 2,
      top: 75,
      fontSize: 72,
      fontFamily: 'Tajawal, Arial, Helvetica, sans-serif',
      fontWeight: 'bold',
      fill: '#253080',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
    });
    canvas.add(title);

    // Add semi-transparent background for bottom elements
    const bottomBg = new fabric.Rect({
      left: 0,
      top: CANVAS_HEIGHT - 100,
      width: CANVAS_WIDTH,
      height: 100,
      fill: 'rgba(255, 255, 255, 0.8)',
      selectable: false,
      evented: false,
    });
    canvas.add(bottomBg);

    // Add date text
    const currentDate = new Date().toLocaleDateString();
    const dateText = new fabric.Text(`Date: ${currentDate}`, {
      left: CANVAS_WIDTH - 20,
      top: CANVAS_HEIGHT - 50,
      fontSize: 36,
      fontFamily: 'Arial',
      fill: '#253080',
      originX: 'right',
      originY: 'center',
      selectable: false,
      evented: false,
    });
    canvas.add(dateText);

    // Add scale text
    const scale = targetView?.scale ? `1:${Math.round(targetView.scale).toLocaleString()}` : 'Unknown';
    const scaleText = new fabric.Text(`Scale: ${scale}`, {
      left: 20,
      top: CANVAS_HEIGHT - 50,
      fontSize: 32,
      fontFamily: 'Arial',
      fill: '#253080',
      originY: 'center',
      selectable: false,
      evented: false,
    });
    canvas.add(scaleText);

    // Add north arrow (only if not already exists)
    const existingNorthArrow = canvas.getObjects().find(obj =>
      obj.type === 'image' && (obj as any).getSrc && (obj as any).getSrc().includes('north-arrow')
    );

    if (!existingNorthArrow) {
      fabric.Image.fromURL('/north-arrow.png', (img) => {
        if (!fabricCanvasRef.current) return;

        // Get map rotation
        const mapRotation = (targetView as any)?.rotation || (targetView as any)?.camera?.heading || 0;
        
        // Scale image proportionally to fit within 120x120 while maintaining aspect ratio
        const maxSize = 120;
        const scaleX = maxSize / img.width!;
        const scaleY = maxSize / img.height!;
        const scale = Math.min(scaleX, scaleY);
        
        img.scale(scale);
        
        img.set({
          left: 80,
          top: 80,
          angle: mapRotation,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
        });
        
        fabricCanvasRef.current.add(img);
      });
    }

    // Add JDA logo
    fabric.Image.fromURL('/jda_logo.png', (img) => {
      if (!fabricCanvasRef.current) return;

      const aspectRatio = img.height! / img.width!;
      const newWidth = 500;
      const newHeight = newWidth * aspectRatio;

      img.set({
        left: CANVAS_WIDTH - 520,
        top: 75,
        width: newWidth,
        height: newHeight,
        originY: 'center',
      });
      
      fabricCanvasRef.current.add(img);
    });

    canvas.renderAll();
  };

  const handleExportPDF = () => {
    if (!fabricCanvasRef.current) return;

    setIsGenerating(true);

    try {
      // Get username from state store
      const { userInfo } = useStateStore.getState();
      const fullName = userInfo?.fullName || 'Unknown User';

      // Export canvas as image with double resolution
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2, // Double the resolution for higher quality PDF
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Create a temporary canvas to add watermark
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        console.error('Could not get canvas context for watermark');
        pdf.addImage(dataURL, 'PNG', 0, 0, 297, 210);
        const fileName = `map-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
        pdf.save(fileName);
        setIsGenerating(false);
        return;
      }

      // Load the original image
      const img = new Image();
      img.onload = () => {
        // Use the original high-resolution dimensions (already doubled by multiplier: 2)
        const highResWidth = img.width;
        const highResHeight = img.height;

        tempCanvas.width = highResWidth;
        tempCanvas.height = highResHeight;

        // Draw the original high-resolution image without scaling
        tempCtx.drawImage(img, 0, 0);

        // Add watermark
        tempCtx.save();

        // Set watermark properties
        tempCtx.globalAlpha = 0.1; // Very transparent
        tempCtx.fillStyle = '#000000';
        tempCtx.font = 'bold 24px Arial';
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';

        // Rotate context for diagonal text
        tempCtx.translate(highResWidth / 2, highResHeight / 2);
        tempCtx.rotate(-Math.PI / 6); // -30 degrees diagonal

        // Calculate spacing for repeated watermark (scaled for high resolution)
        const textWidth = tempCtx.measureText(fullName).width;
        const textHeight = 24;
        const spacingX = textWidth + 100; // Horizontal spacing
        const spacingY = textHeight + 80; // Vertical spacing

        // Calculate how many watermarks to place
        const numX = Math.ceil(highResWidth / spacingX) + 2;
        const numY = Math.ceil(highResHeight / spacingY) + 2;

        // Draw repeated diagonal watermarks
        for (let i = -numX; i < numX; i++) {
          for (let j = -numY; j < numY; j++) {
            const x = i * spacingX;
            const y = j * spacingY;
            tempCtx.fillText(fullName, x, y);
          }
        }

        tempCtx.restore();

        // Convert to data URL and add to PDF
        const watermarkedDataURL = tempCanvas.toDataURL('image/png', 1.0);
        pdf.addImage(watermarkedDataURL, 'PNG', 0, 0, 297, 210);

        const fileName = `map-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
        pdf.save(fileName);
        setIsGenerating(false);
      };

      img.onerror = () => {
        console.error('Failed to load image for watermarking');
        // Fallback: save PDF without watermark
        pdf.addImage(dataURL, 'PNG', 0, 0, 297, 210);
        const fileName = `map-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
        pdf.save(fileName);
        setIsGenerating(false);
      };

      img.src = dataURL;
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGenerating(false);
    }
  };

  const handleExitLayoutMode = () => {
    setLayoutModeActive(false);
    // Show sidebar when exiting layout mode
    const toggleSidebar = useStateStore.getState().toggleSidebar;
    toggleSidebar(true);
  };

  const handleAddText = () => {
    if (!fabricCanvasRef.current) return;

    const text = new fabric.Text('New Text', {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      fontSize: 48,
      fontFamily: 'Arial',
      fill: '#253080',
      originX: 'center',
      originY: 'center',
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  };

  const [legendSize, setLegendSize] = useState<'small' | 'medium' | 'large'>('large');
  const [legendData, setLegendData] = useState<any[]>([]);
  const [hasLegend, setHasLegend] = useState(false);
  const [legendColumns, setLegendColumns] = useState<number>(1);
  const [legendTitle, setLegendTitle] = useState<string>('مفتاح الخريطة');

  // Helper function to wrap text based on available width with better distribution
  const wrapText = (text: string, maxWidth: number, fontSize: number, fontFamily: string): string[] => {
    if (!text) return [''];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [text];

    ctx.font = `${fontSize}px ${fontFamily}`;
    
    // Check if the entire text fits on one line
    const fullTextWidth = ctx.measureText(text).width;
    if (fullTextWidth <= maxWidth) {
      return [text];
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    // Try to distribute words more evenly
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testMetrics = ctx.measureText(testLine);
      
      if (testMetrics.width > maxWidth && currentLine) {
        // Check if we should add the word to current line or start new line
        const currentLineWidth = ctx.measureText(currentLine).width;
        const wordWidth = ctx.measureText(word).width;
        const spaceWidth = ctx.measureText(' ').width;
        
        // If adding this word would exceed by less than 15% of maxWidth, keep it
        // This prevents leaving just one or two words hanging
        const exceedBy = (currentLineWidth + spaceWidth + wordWidth) - maxWidth;
        const threshold = maxWidth * 0.15; // 15% threshold
        
        if (exceedBy <= threshold && words.indexOf(word) < words.length - 1) {
          // Add the word to current line if it doesn't exceed too much
          currentLine = testLine;
        } else {
          // Start a new line
          lines.push(currentLine);
          currentLine = word;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  };

  // Update existing title text when mapTitle changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects();

    // Find the title text object (it's positioned at center with large font)
    const titleObject = objects.find(obj => 
      obj.type === 'text' && 
      (obj as fabric.Text).fontSize === 72 && 
      (obj as fabric.Text).textAlign === 'center'
    );

    if (titleObject && titleObject.type === 'text') {
      (titleObject as fabric.Text).set('text', mapTitle);
      canvas.renderAll();
    }
  }, [mapTitle]);

  // Extract legend data from visible layers
  const extractLegendData = async () => {
    if (!targetView) return [];

    const visibleLayers = targetView.map.layers
      .toArray()
      .filter((layer: any) => 
        layer.visible && 
        (layer as any).group !== "HiddenLayers" &&
        layer.title
      );

    const legendItems: any[] = [];

    for (const layer of visibleLayers) {
      try {
        const renderer = (layer as any).renderer;
        if (!renderer) continue;

        let symbols: any[] = [];

        if (renderer.type === 'simple') {
          // SimpleRenderer - symbol is directly on renderer
          const symbol = renderer.symbol;
          if (symbol) {
            symbols.push({
              symbol: symbol,
              label: layer.title || 'Layer',
              type: symbol.type
            });
          }
        } else if (renderer.type === 'unique-value') {
          // UniqueValueRenderer - symbols are in uniqueValueInfos
          const uniqueValueInfos = renderer.uniqueValueInfos || [];
          for (const info of uniqueValueInfos.slice(0, 5)) { // Limit to 5 per layer
            if (info.symbol && info.label) {
              symbols.push({
                symbol: info.symbol,
                label: info.label,
                type: info.symbol.type
              });
            }
          }
        } else if (renderer.type === 'class-breaks') {
          // ClassBreaksRenderer - symbols are in classBreakInfos
          const classBreakInfos = renderer.classBreakInfos || [];
          for (const info of classBreakInfos.slice(0, 5)) { // Limit to 5 per layer
            if (info.symbol && info.label) {
              symbols.push({
                symbol: info.symbol,
                label: info.label,
                type: info.symbol.type
              });
            }
          }
        }

        if (symbols.length > 0) {
          legendItems.push({
            layerTitle: layer.title,
            symbols: symbols
          });
        }

      } catch (error) {
        console.warn('Error processing layer for legend:', layer.title, error);
      }
    }

    return legendItems;
  };

  const handleLegendColumnsChange = (newColumns: number) => {
    if (!hasLegend || legendData.length === 0) return;

    setLegendColumns(newColumns);

    // Remove existing legend
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const legendGroup = objects.find(obj => {
      if (obj.type === 'group') {
        const group = obj as fabric.Group;
        return group._objects?.some((o: any) => o.type === 'text' && o.text === legendTitle);
      }
      return false;
    });

    if (legendGroup) {
      canvas.remove(legendGroup);
    }

    // Create new legend with updated column count
    const newLegendGroup = createLegendGroup(legendData, legendSize, newColumns, legendTitle);
    canvas.add(newLegendGroup);
    canvas.setActiveObject(newLegendGroup);
    canvas.renderAll();
  };

  const handleAddLegend = async () => {
    if (!fabricCanvasRef.current || !targetView) return;

    const canvas = fabricCanvasRef.current;

    if (hasLegend) {
      // Remove existing legend
      const objects = canvas.getObjects();
      const legendGroup = objects.find(obj => {
        if (obj.type === 'group') {
          const group = obj as fabric.Group;
          return group._objects?.some((o: any) => o.type === 'text' && o.text === legendTitle);
        }
        return false;
      });
      if (legendGroup) {
        canvas.remove(legendGroup);
        canvas.renderAll();
      }
      setHasLegend(false);
      return;
    }

    // Add new legend
    // Extract real legend data
    const data = await extractLegendData();
    setLegendData(data);

    if (data.length === 0) {
      // Add placeholder if no legend data
      const legendGroup = createLegendGroup([{ layerTitle: 'Legend', symbols: [{ color: '#cccccc', label: 'No legend data available', type: 'simple-fill' }] }], legendSize, legendColumns, legendTitle);
      canvas.add(legendGroup);
      canvas.setActiveObject(legendGroup);
      canvas.renderAll();
      setHasLegend(true);
      return;
    }

    // Create legend group with real data using current legendSize and columns
    const legendGroup = createLegendGroup(data, legendSize, legendColumns, legendTitle);
    canvas.add(legendGroup);
    canvas.setActiveObject(legendGroup);
    canvas.renderAll();
    setHasLegend(true);
  };

  const createLegendGroup = (data: any[], size: 'small' | 'medium' | 'large', columns: number = 1, title: string = 'Legend') => {
    const canvas = fabricCanvasRef.current!;
    
    // Size configurations
    const configs = {
      small: { width: 280, fontSize: 11, titleSize: 14, symbolSize: 16, padding: 12, itemSpacing: 24, symbolPadding: 8 },
      medium: { width: 380, fontSize: 13, titleSize: 16, symbolSize: 20, padding: 16, itemSpacing: 28, symbolPadding: 10 },
      large: { width: 480, fontSize: 15, titleSize: 18, symbolSize: 24, padding: 20, itemSpacing: 32, symbolPadding: 12 }
    };

    const config = configs[size];
    
    // Calculate total legend width based on columns
    const columnWidth = config.width;
    const legendWidth = (columnWidth * columns) + (config.padding * (columns - 1));
    const legendLeft = CANVAS_WIDTH - legendWidth - 50;

    const legendElements: fabric.Object[] = [];

    // Calculate items per column for even distribution
    const totalSymbols = data.reduce((sum, layer) => sum + layer.symbols.length, 0);
    const itemsPerColumn = Math.ceil(totalSymbols / columns);
    
    // Track current column and position
    const startY = 100; // Starting Y position for legend content relative to legend top
    let columnY = Array(columns).fill(startY);
    let columnItemCount = Array(columns).fill(0);
    let totalItems = 0;
    const maxItems = 1000; // Allow all layers to be displayed

    // Add legend items distributed across columns
    for (const layerData of data) {
      if (totalItems >= maxItems) break;

      // Process each symbol in the layer
      for (const symbol of layerData.symbols) {
        if (totalItems >= maxItems) break;

        // Find the column with the least items
        let targetColumn = 0;
        let minItems = columnItemCount[0];
        for (let col = 1; col < columns; col++) {
          if (columnItemCount[col] < minItems) {
            minItems = columnItemCount[col];
            targetColumn = col;
          }
        }

        // Calculate position in the target column
        const columnLeft = legendLeft + (targetColumn * (columnWidth + config.padding));
        const currentY = columnY[targetColumn];

        // Create symbol container background for better visibility
        const symbolContainer = new fabric.Rect({
          left: columnLeft + config.padding,
          top: currentY - config.symbolSize / 2 - 2,
          width: config.symbolSize + 4,
          height: config.symbolSize + 4,
          fill: 'rgba(248, 249, 250, 0.8)',
          stroke: '#e9ecef',
          strokeWidth: 1,
          rx: 3,
          ry: 3,
        });
        legendElements.push(symbolContainer);

        // Create appropriate symbol based on type
        const symbolElement = createBetterSymbolElement(symbol.symbol, {
          left: columnLeft + config.padding + 2,
          top: currentY - config.symbolSize / 2,
          size: config.symbolSize
        });
        
        if (symbolElement) {
          legendElements.push(symbolElement);
        }

        // Symbol label with text wrapping for better positioning
        const availableLabelWidth = columnWidth - (config.padding + config.symbolSize + config.symbolPadding + 8);
        const wrappedLabelLines = wrapText(symbol.label, availableLabelWidth, config.fontSize, 'Tajawal, Arial, Helvetica, sans-serif');
        
        // Add each line of wrapped label text
        for (let i = 0; i < wrappedLabelLines.length; i++) {
          const labelText = new fabric.Text(wrappedLabelLines[i], {
            left: columnLeft + config.padding + config.symbolSize + config.symbolPadding + 4,
            top: currentY + (i * (config.fontSize + 2)), // Line height with small spacing
            fontSize: config.fontSize,
            fontFamily: 'Tajawal, Arial, Helvetica, sans-serif',
            fill: '#2c3e50',
            originY: 'center',
          });
          legendElements.push(labelText);
        }

        // Adjust column Y position based on number of wrapped lines
        const labelHeight = Math.max(config.itemSpacing, wrappedLabelLines.length * (config.fontSize + 2));
        columnY[targetColumn] += labelHeight;
        columnItemCount[targetColumn]++;
        totalItems++;
      }
    }

    // Calculate legend height based on the tallest column
    const maxColumnHeight = Math.max(...columnY) - startY;
    const legendHeight = Math.max(120, maxColumnHeight + config.padding * 4 + config.titleSize + 8);
    const legendTop = CANVAS_HEIGHT - legendHeight - 120;

    // Adjust all element positions to account for the calculated legendTop
    legendElements.forEach(element => {
      element.top! += legendTop;
    });

    // Create legend background with correct height
    const legendBg = new fabric.Rect({
      left: legendLeft,
      top: legendTop,
      width: legendWidth,
      height: legendHeight,
      fill: 'rgba(255, 255, 255, 0.6)',
      stroke: '#dddddd',
      strokeWidth: 1,
      rx: 8,
      ry: 8,
      shadow: new fabric.Shadow({
        color: 'rgba(0, 0, 0, 0.15)',
        blur: 10,
        offsetX: 2,
        offsetY: 2,
      }),
    });
    legendElements.unshift(legendBg); // Add background first

    // Legend title with better styling
    const legendTitle = new fabric.Text(title, {
      left: legendLeft + legendWidth / 2,
      top: legendTop + config.padding + 5,
      fontSize: config.titleSize,
      fontFamily: 'Tajawal, Arial, Helvetica, sans-serif',
      fontWeight: '600',
      fill: '#2c3e50',
      originX: 'center',
      originY: 'center',
    });
    legendElements.splice(1, 0, legendTitle); // Insert title after background

    // Title underline
    const titleUnderline = new fabric.Rect({
      left: legendLeft + config.padding,
      top: legendTop + config.padding * 2 + config.titleSize - 2,
      width: legendWidth - (config.padding * 2),
      height: 2,
      fill: '#3498db',
      rx: 1,
      ry: 1,
    });
    legendElements.splice(2, 0, titleUnderline); // Insert underline after title

    // Group all legend elements
    const legendGroup = new fabric.Group(legendElements, {
      left: legendLeft,
      top: legendTop,
      width: legendWidth,
      height: legendHeight,
      hasControls: true,
      lockScalingFlip: true,
    });

    // Store original text properties for scaling
    const textElements = legendElements.filter(el => el.type === 'text') as fabric.Text[];
    const originalTextProps = textElements.map(text => ({
      element: text,
      originalFontSize: text.fontSize || 12, // Default to 12 if undefined
      originalLeft: text.left,
      originalTop: text.top,
    }));

    // Add scaling event listener to maintain crisp text rendering
    legendGroup.on('scaling', () => {
      const scaleX = legendGroup.scaleX || 1;
      const scaleY = legendGroup.scaleY || 1;

      // Check if scaling is uniform (corner scaling) vs non-uniform (edge scaling)
      const scaleRatio = Math.max(scaleX, scaleY) / Math.min(scaleX, scaleY);
      const isUniformScaling = scaleRatio < 1.2; // Allow small tolerance for "uniform" scaling

      if (isUniformScaling) {
        // Uniform scaling - scale text proportionally
        const scale = Math.max(scaleX, scaleY);
        originalTextProps.forEach(({ element, originalFontSize }) => {
          const newFontSize = Math.min(12, Math.max(4, originalFontSize * scale));
          element.set({
            fontSize: newFontSize,
            scaleX: 1 / scale,
            scaleY: 1 / scale,
          });
        });
      } else {
        // Non-uniform scaling - adjust text size based on width scaling to maintain readability
        const widthScale = scaleX;
        originalTextProps.forEach(({ element, originalFontSize }) => {
          // Reduce font size when width is shrunk, but keep minimum of 10px
          const newFontSize = Math.min(12, Math.max(4, originalFontSize * widthScale));
          element.set({
            fontSize: newFontSize,
            scaleX: 1,
            scaleY: 1,
          });
        });
      }

      canvas.renderAll();
    });

    // Reset text properties when scaling ends
    legendGroup.on('modified', () => {
      const finalScaleX = legendGroup.scaleX || 1;
      const finalScaleY = legendGroup.scaleY || 1;

      // Check if final scaling is uniform
      const finalScaleRatio = Math.max(finalScaleX, finalScaleY) / Math.min(finalScaleX, finalScaleY);
      const isFinalUniformScaling = finalScaleRatio < 1.2;

      if (isFinalUniformScaling) {
        // Apply final uniform scaled font sizes
        const finalScale = Math.max(finalScaleX, finalScaleY);
        originalTextProps.forEach(({ element, originalFontSize }) => {
          const newFontSize = Math.min(16, Math.max(10, originalFontSize * finalScale));
          element.set({
            fontSize: newFontSize,
            scaleX: 1,
            scaleY: 1,
          });
        });
      } else {
        // Non-uniform final scaling - adjust text size based on width scaling
        const widthScale = finalScaleX;
        originalTextProps.forEach(({ element, originalFontSize }) => {
          const newFontSize = Math.min(16, Math.max(10, originalFontSize * widthScale));
          element.set({
            fontSize: newFontSize,
            scaleX: 1,
            scaleY: 1,
          });
        });
      }

      canvas.renderAll();
    });

    return legendGroup;
  };

  // Helper function to create proper symbol elements based on symbol type with better appearance
  const createBetterSymbolElement = (symbol: any, options: { left: number, top: number, size: number }) => {
    const { left, top, size } = options;
    
    try {
      if (!symbol || !symbol.type) return null;

      switch (symbol.type) {
        case 'simple-fill':
          // Polygon symbol - rectangle with fill and outline
          const fillColor = getColorFromSymbol(symbol);
          let outlineColor = symbol.outline?.color ? getColorFromSymbolProperty(symbol.outline.color) : '#666666';
          
          // If outline is completely transparent, use a default visible color
          if (outlineColor.includes('rgba') && outlineColor.endsWith(', 0)')) {
            outlineColor = '#e0d2b8'; // Light brown to match the fill
          }
          
          const outlineWidth = Math.max(1, (symbol.outline?.width || 2) / 2);
          
          return new fabric.Rect({
            left: left,
            top: top,
            width: size,
            height: size,
            fill: fillColor || '#cccccc',
            stroke: outlineColor,
            strokeWidth: outlineWidth,
            rx: 2,
            ry: 2,
          });

        case 'simple-line':
          // Line symbol - horizontal line with proper styling
          const lineColor = getColorFromSymbol(symbol) || '#000000';
          const lineWidth = Math.max(2, Math.min(6, (symbol.width || 2)));
          
          // Create a line that spans the symbol area
          return new fabric.Line([
            left + 2, 
            top + size/2, 
            left + size - 2, 
            top + size/2
          ], {
            stroke: lineColor,
            strokeWidth: lineWidth,
            strokeLineCap: 'round',
          });

        case 'simple-marker':
          // Point symbol - circle, square, or other marker
          const markerColor = getColorFromSymbol(symbol) || '#ff0000';
          const markerSize = Math.min(size * 0.8, 18);
          const markerOutlineColor = symbol.outline?.color ? 
            getColorFromSymbolProperty(symbol.outline.color) : '#333333';
          const markerOutlineWidth = symbol.outline?.width ? 
            Math.max(1, symbol.outline.width / 2) : 1;
          
          const markerStyle = symbol.style || 'circle';
          const centerX = left + size / 2;
          const centerY = top + size / 2;
          
          if (markerStyle === 'square' || markerStyle === 'x') {
            return new fabric.Rect({
              left: centerX,
              top: centerY,
              width: markerSize,
              height: markerSize,
              fill: markerColor,
              stroke: markerOutlineColor,
              strokeWidth: markerOutlineWidth,
              originX: 'center',
              originY: 'center',
              rx: 1,
              ry: 1,
            });
          } else if (markerStyle === 'diamond') {
            return new fabric.Rect({
              left: centerX,
              top: centerY,
              width: markerSize,
              height: markerSize,
              fill: markerColor,
              stroke: markerOutlineColor,
              strokeWidth: markerOutlineWidth,
              angle: 45,
              originX: 'center',
              originY: 'center',
            });
          } else if (markerStyle === 'triangle') {
            // Create triangle using polygon points
            const points = [
              { x: centerX, y: centerY - markerSize/2 },
              { x: centerX - markerSize/2, y: centerY + markerSize/2 },
              { x: centerX + markerSize/2, y: centerY + markerSize/2 }
            ];
            return new fabric.Polygon(points, {
              fill: markerColor,
              stroke: markerOutlineColor,
              strokeWidth: markerOutlineWidth,
            });
          } else {
            // Default to circle
            return new fabric.Circle({
              left: centerX,
              top: centerY,
              radius: markerSize / 2,
              fill: markerColor,
              stroke: markerOutlineColor,
              strokeWidth: markerOutlineWidth,
              originX: 'center',
              originY: 'center',
            });
          }

        case 'picture-marker':
        case 'picture-fill':
          // Picture symbols - use a stylized placeholder
          return new fabric.Rect({
            left: left,
            top: top,
            width: size,
            height: size,
            fill: 'rgba(230, 230, 230, 0.8)',
            stroke: '#999999',
            strokeWidth: 1,
            strokeDashArray: [3, 3],
            rx: 2,
            ry: 2,
          });

        default:
          // Unknown symbol type - default styled rectangle
          return new fabric.Rect({
            left: left,
            top: top,
            width: size,
            height: size,
            fill: getColorFromSymbol(symbol) || '#cccccc',
            stroke: '#666666',
            strokeWidth: 1,
            rx: 2,
            ry: 2,
          });
      }
    } catch (error) {
      console.warn('Error creating symbol element:', error);
      // Fallback to simple rectangle
      return new fabric.Rect({
        left: left,
        top: top,
        width: size,
        height: size,
        fill: getColorFromSymbol(symbol) || '#cccccc',
        stroke: '#666666',
        strokeWidth: 1,
        rx: 2,
        ry: 2,
      });
    }
  };

  // Helper function to extract color from a color property
  const getColorFromSymbolProperty = (colorProp: any): string => {
    try {
      if (Array.isArray(colorProp)) {
        const [r, g, b, a] = colorProp;
        // Handle case where alpha might be in 0-255 range instead of 0-1
        const alpha = a !== undefined ? (a <= 1 ? a : a / 255) : 1;
        // If alpha is very small (like 1/255), treat as fully opaque
        const finalAlpha = alpha < 0.01 ? 1 : alpha;
        const result = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${finalAlpha})`;
        return result;
      } else if (typeof colorProp === 'string') {
        return colorProp;
      } else if (colorProp && typeof colorProp === 'object' && colorProp.r !== undefined && colorProp.g !== undefined && colorProp.b !== undefined) {
        const alpha = colorProp.a !== undefined ? (colorProp.a <= 1 ? colorProp.a : colorProp.a / 255) : 1;
        const finalAlpha = alpha < 0.01 ? 1 : alpha;
        const result = `rgba(${colorProp.r}, ${colorProp.g}, ${colorProp.b}, ${finalAlpha})`;
        return result;
      }
      
      return '#666666';
    } catch (error) {
      console.warn('Error processing color:', error);
      return '#666666';
    }
  };

  // Helper function to extract color from ArcGIS symbol
  const getColorFromSymbol = (symbol: any): string | null => {
    try {
      if (!symbol) return null;

      // Handle different symbol types
      if (symbol.type === 'simple-fill') {
        const color = symbol.color;
        if (color) {
          const colorStr = getColorFromSymbolProperty(color);
          // If the color is completely transparent, use a default visible color
          if (colorStr.includes('rgba') && colorStr.endsWith(', 0)')) {
            return '#e0d2b8'; // Light brown color for visibility
          }
          return colorStr;
        }
        // If no fill color, check outline
        const outline = symbol.outline;
        if (outline && outline.color) {
          const outlineColorStr = getColorFromSymbolProperty(outline.color);
          // If outline is completely transparent, use a default visible color
          if (outlineColorStr.includes('rgba') && outlineColorStr.endsWith(', 0)')) {
            return '#cccccc'; // Default gray
          }
          return outlineColorStr;
        }
      } else if (symbol.type === 'simple-marker') {
        const color = symbol.color;
        if (color) {
          const colorStr = getColorFromSymbolProperty(color);
          // If the color is completely transparent, use a default visible color
          if (colorStr.includes('rgba') && colorStr.endsWith(', 0)')) {
            return '#ff6b6b'; // Default red
          }
          return colorStr;
        }
        // If no fill color, check outline
        const outline = symbol.outline;
        if (outline && outline.color) {
          const outlineColorStr = getColorFromSymbolProperty(outline.color);
          // If outline is completely transparent, use a default visible color
          if (outlineColorStr.includes('rgba') && outlineColorStr.endsWith(', 0)')) {
            return '#333333'; // Default dark gray
          }
          return outlineColorStr;
        }
      } else if (symbol.type === 'simple-line') {
        const color = symbol.color;
        if (color) {
          const colorStr = getColorFromSymbolProperty(color);
          // If the color is completely transparent, use a default visible color
          if (colorStr.includes('rgba') && colorStr.endsWith(', 0)')) {
            return '#a80000'; // Default dark red
          }
          return colorStr;
        }
      } else if (symbol.type === 'picture-fill' || symbol.type === 'picture-marker') {
        // For picture symbols, return a default color
        return '#cccccc';
      } else if (symbol.type === 'text') {
        const color = symbol.color;
        if (color) {
          const colorStr = getColorFromSymbolProperty(color);
          // If the color is completely transparent, use a default visible color
          if (colorStr.includes('rgba') && colorStr.endsWith(', 0)')) {
            return '#000000'; // Default black
          }
          return colorStr;
        }
      }

      // Fallback for unknown symbol types
      return '#666666';
    } catch (error) {
      console.warn('Error extracting color from symbol:', error);
      return '#666666';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-100 overflow-hidden"
      style={{ zIndex: 15 }}
      ref={containerRef}
    >
      {/* Custom styles for Esri Legend */}
      <style jsx>{`
        .esri-legend {
          background-color: transparent !important;
        }
        .esri-legend__service {
          background-color: transparent !important;
        }
        .esri-legend__layer {
          background-color: transparent !important;
        }
        .esri-legend__layer-table {
          background-color: transparent !important;
        }
        .esri-legend__layer-caption {
          color: #253080 !important;
          font-weight: bold !important;
        }
        .esri-legend__symbol {
          background-color: transparent !important;
        }
      `}</style>
      
      {/* Canvas Container */}
      <div className="w-full h-full flex">
        {/* Right Sidebar */}
        <div className="w-80 lg:w-96 bg-white border-r border-gray-300 shadow-lg flex flex-col">
          {/* Header Actions */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExitLayoutMode}
                className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-xs lg:text-sm lg:px-3 lg:py-2"
              >
                {t('layoutMode.exit', 'Exit Layout Mode')}
              </button>

              <button
                onClick={handleAddText}
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs lg:text-sm lg:px-3 lg:py-2"
              >
                {t('layoutMode.addText', 'Add Text')}
              </button>

              <button
                onClick={handleAddLegend}
                className={`px-2 py-1 text-white rounded hover:opacity-90 transition-colors text-xs lg:text-sm lg:px-3 lg:py-2 ${
                  hasLegend 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                {hasLegend ? t('layoutMode.removeLegend', 'Remove Legend') : t('layoutMode.addLegend', 'Add Legend')}
              </button>

              <button
                onClick={() => loadMapBackground()}
                className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs lg:text-sm lg:px-3 lg:py-2"
              >
                {t('layoutMode.refreshMap', 'Refresh Map')}
              </button>

              <button
                onClick={() => setShowProperties(!showProperties)}
                className={`px-2 py-1 text-white rounded hover:opacity-90 transition-colors text-xs lg:text-sm lg:px-3 lg:py-2 ${
                  showProperties ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                {showProperties ? t('layoutMode.hideProperties', 'Hide Properties') : t('layoutMode.showProperties', 'Show Properties')}
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isGenerating || !mapImageLoaded}
                className={`px-3 py-1 lg:px-4 lg:py-2 rounded font-medium transition-colors text-xs lg:text-sm ${
                  isGenerating || !mapImageLoaded
                    ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                    : 'bg-[#253080] hover:bg-[#1e2660] text-white'
                }`}
              >
                {isGenerating 
                  ? t('layoutMode.generating', 'Generating PDF...') 
                  : t('layoutMode.exportPDF', 'Export PDF')
                }
              </button>
            </div>
          </div>

          {/* Properties Panel */}
          {showProperties && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{t('layoutMode.properties', 'Properties')}</h3>
                <button
                  onClick={() => setShowProperties(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {selectedObject ? (
                <div className="space-y-4">
                  {selectedObject.type === 'text' && (
                    <TextPropertiesPanel 
                      object={selectedObject as fabric.Text} 
                      canvas={fabricCanvasRef.current}
                    />
                  )}
                  {selectedObject.type === 'rect' && (
                    <ShapePropertiesPanel 
                      object={selectedObject as fabric.Rect} 
                      canvas={fabricCanvasRef.current}
                    />
                  )}
                  {selectedObject.type === 'circle' && (
                    <ShapePropertiesPanel 
                      object={selectedObject as fabric.Circle} 
                      canvas={fabricCanvasRef.current}
                    />
                  )}
                  {selectedObject.type === 'group' && (
                    <GroupPropertiesPanel 
                      object={selectedObject as fabric.Group} 
                      canvas={fabricCanvasRef.current}
                      isLegend={(selectedObject as fabric.Group)._objects?.some((o: any) => o.type === 'text' && o.text === legendTitle) || false}
                      legendColumns={legendColumns}
                      onLegendColumnsChange={(columns) => {
                        handleLegendColumnsChange(columns);
                      }}
                      legendTitle={legendTitle}
                      onLegendTitleChange={(title) => {
                        setLegendTitle(title);
                        // Update the legend title in the canvas
                        const canvas = fabricCanvasRef.current;
                        if (!canvas) return;

                        const objects = canvas.getObjects();
                        const legendGroup = objects.find(obj => {
                          if (obj.type === 'group') {
                            const group = obj as fabric.Group;
                            return group._objects?.some((o: any) => o.type === 'text' && o.text === legendTitle);
                          }
                          return false;
                        });

                        if (legendGroup && legendGroup.type === 'group') {
                          const group = legendGroup as fabric.Group;
                          const titleText = group._objects?.find((o: any) => o.type === 'text' && o.text === legendTitle);
                          if (titleText && titleText.type === 'text') {
                            (titleText as fabric.Text).set('text', title);
                            canvas.renderAll();
                          }
                        }
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>{t('layoutMode.selectObject', 'Select an object to edit its properties')}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Main Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative">
          <canvas ref={canvasRef} className="border border-gray-300 shadow-lg" />
        </div>
      </div>

      {/* Loading Overlay */}
      {!mapImageLoaded && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#253080] mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">
              {t('layoutMode.loadingMap', 'Loading map layout...')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullScreenLayoutMode;