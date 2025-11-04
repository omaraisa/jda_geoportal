"use client";

import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import useStateStore from "@/stateStore";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";

const FullScreenLayoutMode: React.FC = () => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const targetView = useStateStore((state) => state.targetView);
  const setLayoutModeActive = useStateStore((state) => state.setLayoutModeActive);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [mapImageLoaded, setMapImageLoaded] = useState(false);

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
      const screenshot = await targetView.takeScreenshot({
        format: "png",
        quality: 100,
        width: 1920,
        height: 1080
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
    const title = new fabric.Text('Map Export', {
      left: CANVAS_WIDTH / 2,
      top: 75,
      fontSize: 72,
      fontFamily: 'Arial',
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
      top: CANVAS_HEIGHT - 150,
      width: CANVAS_WIDTH,
      height: 150,
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
    });
    canvas.add(scaleText);

    // Add north arrow
    fabric.Image.fromURL('/north-arrow.png', (img) => {
      if (!fabricCanvasRef.current) return;

      // Get map rotation
      const mapRotation = (targetView as any)?.rotation || (targetView as any)?.camera?.heading || 0;
      
      img.set({
        left: 65,
        top: 80,
        width: 120,
        height: 120,
        angle: mapRotation,
        originX: 'center',
        originY: 'center',
      });
      
      fabricCanvasRef.current.add(img);
    });

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
      // Export canvas as image
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 1,
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(dataURL, 'PNG', 0, 0, 297, 210);

      const fileName = `map-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
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

  const [legendSize, setLegendSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [legendData, setLegendData] = useState<any[]>([]);

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
          const symbol = renderer.symbol;
          if (symbol) {
            const color = getColorFromSymbol(symbol);
            if (color) {
              symbols.push({
                color: color,
                label: layer.title || 'Layer',
                type: symbol.type,
                originalSymbol: symbol
              });
            }
          }
        } else if (renderer.type === 'unique-value') {
          const uniqueValueInfos = renderer.uniqueValueInfos || [];
          for (const info of uniqueValueInfos.slice(0, 5)) { // Limit to 5 per layer
            const color = getColorFromSymbol(info.symbol);
            if (color && info.label) {
              symbols.push({
                color: color,
                label: info.label,
                type: info.symbol?.type,
                originalSymbol: info.symbol
              });
            }
          }
        } else if (renderer.type === 'class-breaks') {
          const classBreakInfos = renderer.classBreakInfos || [];
          for (const info of classBreakInfos.slice(0, 5)) { // Limit to 5 per layer
            const color = getColorFromSymbol(info.symbol);
            if (color && info.label) {
              symbols.push({
                color: color,
                label: info.label,
                type: info.symbol?.type,
                originalSymbol: info.symbol
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

  const handleAddLegend = async () => {
    if (!fabricCanvasRef.current || !targetView) return;

    const canvas = fabricCanvasRef.current;

    // Extract real legend data
    const data = await extractLegendData();
    setLegendData(data);

    if (data.length === 0) {
      // Add placeholder if no legend data
      const legendGroup = createLegendGroup([{ layerTitle: 'Legend', symbols: [{ color: '#cccccc', label: 'No legend data available', type: 'simple-fill' }] }], legendSize);
      canvas.add(legendGroup);
      canvas.setActiveObject(legendGroup);
      canvas.renderAll();
      return;
    }

    // Create legend group with real data
    const legendGroup = createLegendGroup(data, legendSize);
    canvas.add(legendGroup);
    canvas.setActiveObject(legendGroup);
    canvas.renderAll();
  };

  const createLegendGroup = (data: any[], size: 'small' | 'medium' | 'large') => {
    const canvas = fabricCanvasRef.current!;
    
    // Size configurations
    const configs = {
      small: { width: 280, height: 250, fontSize: 11, titleSize: 14, symbolSize: 16, padding: 12, itemSpacing: 18, symbolPadding: 8 },
      medium: { width: 380, height: 350, fontSize: 13, titleSize: 16, symbolSize: 20, padding: 16, itemSpacing: 22, symbolPadding: 10 },
      large: { width: 480, height: 450, fontSize: 15, titleSize: 18, symbolSize: 24, padding: 20, itemSpacing: 26, symbolPadding: 12 }
    };

    const config = configs[size];
    const legendWidth = config.width;
    const legendHeight = config.height;
    const legendLeft = CANVAS_WIDTH - legendWidth - 50;
    const legendTop = CANVAS_HEIGHT - legendHeight - 50;

    const legendElements: fabric.Object[] = [];

    // Legend background with shadow effect
    const legendBg = new fabric.Rect({
      left: legendLeft,
      top: legendTop,
      width: legendWidth,
      height: legendHeight,
      fill: 'rgba(255, 255, 255, 0.98)',
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
    legendElements.push(legendBg);

    // Legend title with better styling
    const legendTitle = new fabric.Text('Legend', {
      left: legendLeft + legendWidth / 2,
      top: legendTop + config.padding + 5,
      fontSize: config.titleSize,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#2c3e50',
      originX: 'center',
      originY: 'center',
    });
    legendElements.push(legendTitle);

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
    legendElements.push(titleUnderline);

    let currentY = legendTop + config.padding * 3 + config.titleSize + 8;
    let totalItems = 0;
    const maxItems = size === 'small' ? 8 : size === 'medium' ? 12 : 16;

    // Add legend items with better spacing and alignment
    for (const layerData of data) {
      if (totalItems >= maxItems) break;

      // Add layer separator if multiple symbols
      if (layerData.symbols.length > 1 && totalItems > 0) {
        const separator = new fabric.Line([
          legendLeft + config.padding,
          currentY - 6,
          legendLeft + legendWidth - config.padding,
          currentY - 6
        ], {
          stroke: '#ecf0f1',
          strokeWidth: 1,
        });
        legendElements.push(separator);
        currentY += 4;
      }

      // Layer title (if different from first symbol label and multiple symbols)
      if (layerData.symbols.length > 1 && layerData.layerTitle !== layerData.symbols[0]?.label) {
        const layerTitleText = new fabric.Text(layerData.layerTitle, {
          left: legendLeft + config.padding,
          top: currentY,
          fontSize: config.fontSize + 1,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#34495e',
          originY: 'center',
        });
        legendElements.push(layerTitleText);
        currentY += config.itemSpacing - 2;
      }

      // Add symbols for this layer
      for (const symbol of layerData.symbols) {
        if (totalItems >= maxItems) break;

        // Create symbol container background for better visibility
        const symbolContainer = new fabric.Rect({
          left: legendLeft + config.padding,
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
        const symbolElement = createBetterSymbolElement(symbol, {
          left: legendLeft + config.padding + 2,
          top: currentY - config.symbolSize / 2,
          size: config.symbolSize
        });
        
        if (symbolElement) {
          legendElements.push(symbolElement);
        }

        // Symbol label with better positioning
        const labelText = new fabric.Text(symbol.label, {
          left: legendLeft + config.padding + config.symbolSize + config.symbolPadding + 4,
          top: currentY,
          fontSize: config.fontSize,
          fontFamily: 'Arial',
          fill: '#2c3e50',
          originY: 'center',
        });
        legendElements.push(labelText);

        currentY += config.itemSpacing;
        totalItems++;
      }

      // Add small spacing between layers
      if (layerData.symbols.length > 1) {
        currentY += 4;
      }
    }

    // Group all legend elements
    const legendGroup = new fabric.Group(legendElements, {
      left: legendLeft,
      top: legendTop,
      width: legendWidth,
      height: legendHeight,
      hasControls: true,
      lockScalingFlip: true,
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
          const fillColor = getColorFromSymbol(symbol) || '#cccccc';
          const outlineColor = symbol.originalSymbol?.outline?.color ? 
            getColorFromSymbolProperty(symbol.originalSymbol.outline.color) : '#666666';
          const outlineWidth = Math.max(1, (symbol.originalSymbol?.outline?.width || 2) / 2);
          
          return new fabric.Rect({
            left: left,
            top: top,
            width: size,
            height: size,
            fill: fillColor,
            stroke: outlineColor,
            strokeWidth: outlineWidth,
            rx: 2,
            ry: 2,
          });

        case 'simple-line':
          // Line symbol - horizontal line with proper styling
          const lineColor = getColorFromSymbol(symbol) || '#000000';
          const lineWidth = Math.max(2, Math.min(6, (symbol.originalSymbol?.width || 2)));
          
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
          const markerOutlineColor = symbol.originalSymbol?.outline?.color ? 
            getColorFromSymbolProperty(symbol.originalSymbol.outline.color) : '#333333';
          const markerOutlineWidth = symbol.originalSymbol?.outline?.width ? 
            Math.max(1, symbol.originalSymbol.outline.width / 2) : 1;
          
          const markerStyle = symbol.originalSymbol?.style || 'circle';
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
        return `rgba(${colorProp[0]}, ${colorProp[1]}, ${colorProp[2]}, ${colorProp[3] !== undefined ? colorProp[3]/255 : 1})`;
      } else if (typeof colorProp === 'string') {
        return colorProp;
      } else if (colorProp.r !== undefined && colorProp.g !== undefined && colorProp.b !== undefined) {
        return `rgba(${colorProp.r}, ${colorProp.g}, ${colorProp.b}, ${colorProp.a !== undefined ? colorProp.a/255 : 1})`;
      }
      return '#666666';
    } catch (error) {
      return '#666666';
    }
  };

  // Helper function to extract color from ArcGIS symbol
  const getColorFromSymbol = (symbol: any): string | null => {
    try {
      if (!symbol) return null;

      // Handle different symbol types
      if (symbol.type === 'simple-fill') {
        const color = symbol.color || symbol.fillColor;
        if (color) {
          if (Array.isArray(color)) {
            return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] !== undefined ? color[3]/255 : 1})`;
          } else if (typeof color === 'string') {
            return color;
          } else if (color.r !== undefined && color.g !== undefined && color.b !== undefined) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a !== undefined ? color.a/255 : 1})`;
          }
        }
        // If no fill color, check outline
        const outline = symbol.outline;
        if (outline && outline.color) {
          if (Array.isArray(outline.color)) {
            return `rgba(${outline.color[0]}, ${outline.color[1]}, ${outline.color[2]}, ${outline.color[3] !== undefined ? outline.color[3]/255 : 1})`;
          } else if (typeof outline.color === 'string') {
            return outline.color;
          } else if (outline.color.r !== undefined) {
            return `rgba(${outline.color.r}, ${outline.color.g}, ${outline.color.b}, ${outline.color.a !== undefined ? outline.color.a/255 : 1})`;
          }
        }
      } else if (symbol.type === 'simple-marker') {
        const color = symbol.color || symbol.fillColor;
        if (color) {
          if (Array.isArray(color)) {
            return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] !== undefined ? color[3]/255 : 1})`;
          } else if (typeof color === 'string') {
            return color;
          } else if (color.r !== undefined && color.g !== undefined && color.b !== undefined) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a !== undefined ? color.a/255 : 1})`;
          }
        }
        // If no fill color, check outline
        const outline = symbol.outline;
        if (outline && outline.color) {
          if (Array.isArray(outline.color)) {
            return `rgba(${outline.color[0]}, ${outline.color[1]}, ${outline.color[2]}, ${outline.color[3] !== undefined ? outline.color[3]/255 : 1})`;
          } else if (typeof outline.color === 'string') {
            return outline.color;
          } else if (outline.color.r !== undefined) {
            return `rgba(${outline.color.r}, ${outline.color.g}, ${outline.color.b}, ${outline.color.a !== undefined ? outline.color.a/255 : 1})`;
          }
        }
      } else if (symbol.type === 'simple-line') {
        const color = symbol.color;
        if (color) {
          if (Array.isArray(color)) {
            return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] !== undefined ? color[3]/255 : 1})`;
          } else if (typeof color === 'string') {
            return color;
          } else if (color.r !== undefined && color.g !== undefined && color.b !== undefined) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a !== undefined ? color.a/255 : 1})`;
          }
        }
      } else if (symbol.type === 'picture-fill' || symbol.type === 'picture-marker') {
        // For picture symbols, return a default color
        return '#cccccc';
      } else if (symbol.type === 'text') {
        const color = symbol.color;
        if (color) {
          if (Array.isArray(color)) {
            return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] !== undefined ? color[3]/255 : 1})`;
          } else if (typeof color === 'string') {
            return color;
          } else if (color.r !== undefined) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a !== undefined ? color.a/255 : 1})`;
          }
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
      className="fixed inset-0 z-50 bg-gray-100 overflow-hidden"
      ref={containerRef}
    >
      {/* Floating Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg p-4 flex items-center gap-4">
        <button
          onClick={handleExitLayoutMode}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          {t('layoutMode.exit', 'Exit Layout Mode')}
        </button>

        <div className="w-px h-6 bg-gray-300"></div>

        <button
          onClick={handleAddText}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {t('layoutMode.addText', 'Add Text')}
        </button>

        <div className="flex items-center gap-2">
          <select
            value={legendSize}
            onChange={(e) => setLegendSize(e.target.value as 'small' | 'medium' | 'large')}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="small">Small Legend</option>
            <option value="medium">Medium Legend</option>
            <option value="large">Large Legend</option>
          </select>
          <button
            onClick={handleAddLegend}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            {t('layoutMode.addLegend', 'Add Legend')}
          </button>
        </div>

        <button
          onClick={() => loadMapBackground()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          {t('layoutMode.refreshMap', 'Refresh Map')}
        </button>

        <div className="w-px h-6 bg-gray-300"></div>

        <button
          onClick={handleExportPDF}
          disabled={isGenerating || !mapImageLoaded}
          className={`px-6 py-2 rounded font-medium transition-colors ${
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

      {/* Canvas Container */}
      <div className="w-full h-full flex items-center justify-center p-8 pt-20">
        <canvas ref={canvasRef} className="border border-gray-300 shadow-lg" />
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