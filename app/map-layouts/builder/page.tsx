'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import useStateStore from '@/stateStore';

// Extend window interface to include the export function
declare global {
  interface Window {
    exportMapLayoutCanvas?: () => string | null;
    captureMapView?: () => Promise<string | null>;
  }
}

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

const ELEMENT_TYPES = [
  { type: 'map-capture', label: 'Map View', icon: '🗺️', description: 'Current map view' },
  { type: 'legend', label: 'Legend', icon: '📋', description: 'Layer legend' },
  { type: 'north-arrow', label: 'North Arrow', icon: '🧭', description: 'North direction indicator' },
  { type: 'title', label: 'Title', icon: '📝', description: 'Map title text' },
  { type: 'text', label: 'Text Box', icon: '💬', description: 'Custom text' },
  { type: 'logo', label: 'Logo/Image', icon: '🖼️', description: 'Image or logo' },
  { type: 'scale-bar', label: 'Scale Bar', icon: '📏', description: 'Distance scale' }
];

// Standard map layout dimensions (A4 landscape at 300 DPI)
const DEFAULT_LAYOUT_WIDTH = 3508;  // A4 landscape width at 300 DPI
const DEFAULT_LAYOUT_HEIGHT = 2480; // A4 landscape height at 300 DPI

export default function MapLayoutBuilderPage() {
  const [template, setTemplate] = useState<MapLayoutTemplate>({
    name: '',
    description: '',
    backgroundMapType: 'streets',
    layoutWidth: DEFAULT_LAYOUT_WIDTH,
    layoutHeight: DEFAULT_LAYOUT_HEIGHT,
    elements: []
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.3); // Smaller default zoom for A4 layout
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mapViewCaptured, setMapViewCaptured] = useState<string | null>(null);
  
  const { isAuthenticated, targetView } = useStateStore();

  // Load template for editing if edit parameter is provided
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      setEditingTemplate(editId);
      loadTemplate(editId);
    }
  }, []);

  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/map-layouts/templates/${templateId}`);

      if (response.ok) {
        const data = await response.json();
        const loadedTemplate = data.template;
        
        // Ensure dimensions are set
        if (!loadedTemplate.layoutWidth) loadedTemplate.layoutWidth = DEFAULT_LAYOUT_WIDTH;
        if (!loadedTemplate.layoutHeight) loadedTemplate.layoutHeight = DEFAULT_LAYOUT_HEIGHT;
        
        setTemplate(loadedTemplate);
      } else {
        throw new Error('Failed to load template');
      }
    } catch {
      alert('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const captureCurrentMapView = async () => {
    if (!targetView) {
      alert('No map view available. Please open the main map first.');
      return;
    }

    try {
      // Hide UI elements temporarily
      const header = document.querySelector('header');
      const sidebar = document.querySelector('[data-sidebar]');
      const bottomPane = document.querySelector('[data-bottom-pane]');
      
      const elementsToHide = [header, sidebar, bottomPane].filter(Boolean);
      elementsToHide.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
        }
      });

      // Wait a bit for UI to hide
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use ArcGIS takeScreenshot method
      const screenshot = await targetView.takeScreenshot({ 
        format: 'png',
        quality: 100,
        ignorePadding: true
      });
      
      // Restore UI elements
      elementsToHide.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = '';
        }
      });

      if (screenshot?.dataUrl) {
        setMapViewCaptured(screenshot.dataUrl);
        
        // Add map capture element to template if it doesn't exist
        const hasMapCapture = template.elements.some(el => el.type === 'map-capture');
        if (!hasMapCapture) {
          addElement('map-capture');
        }
        
        alert('Map view captured successfully!');
      } else {
        throw new Error('Screenshot failed');
      }
    } catch (error) {
      console.error('Map capture failed:', error);
      alert('Failed to capture map view. Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      // Restore UI elements on error
      const header = document.querySelector('header');
      const sidebar = document.querySelector('[data-sidebar]');
      const bottomPane = document.querySelector('[data-bottom-pane]');
      
      [header, sidebar, bottomPane].filter(Boolean).forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = '';
        }
      });
    }
  };

  const addElement = (elementType: string) => {
    // Use different positions for different element types to avoid overlap
    const positions: Record<string, { x: number; y: number; width?: number; height?: number }> = {
      'map-capture': { x: 100, y: 100, width: 2000, height: 1500 },
      'legend': { x: 2200, y: 100, width: 300, height: 400 },
      'north-arrow': { x: 2200, y: 600, width: 100, height: 100 },
      'title': { x: 100, y: 50 },
      'text': { x: 100, y: 1800 },
      'logo': { x: 2200, y: 800, width: 200, height: 100 },
      'scale-bar': { x: 100, y: 1700, width: 300, height: 50 }
    };
    
    const position = positions[elementType] || { x: 200, y: 200 };
    
    const newElement: MapLayoutElement = {
      id: `element-${Date.now()}`,
      type: elementType as MapLayoutElement['type'],
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      fontSize: elementType === 'title' ? 72 : 24,
      fontFamily: 'Arial',
      color: '#000000',
      textAlign: 'left',
      fontWeight: 'normal',
      rotation: 0,
      text: elementType === 'title' ? 'Map Title' : elementType === 'text' ? 'Custom Text' : undefined,
      properties: {}
    };

    console.log('Creating new element:', elementType, 'at position:', position);

    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
    setSelectedElement(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<MapLayoutElement>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === elementId ? { ...element, ...updates } : element
      )
    }));
  };

  const deleteElement = (elementId: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(element => element.id !== elementId)
    }));
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  };

  const saveTemplate = async () => {
    if (!template.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (template.elements.length === 0) {
      alert('Please add at least one element');
      return;
    }

    try {
      setSaving(true);
      
      const url = editingTemplate 
        ? `/api/map-layouts/templates/${editingTemplate}`
        : '/api/map-layouts/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          backgroundMapType: template.backgroundMapType,
          layoutWidth: template.layoutWidth,
          layoutHeight: template.layoutHeight,
          elements: template.elements,
          isActive: true
        })
      });

      if (response.ok) {
        const savedTemplate = await response.json();
        console.log('Template saved successfully');
        
        // If creating a new template, update the URL to edit mode but stay on the page
        if (!editingTemplate && savedTemplate.template?.id) {
          setEditingTemplate(savedTemplate.template.id);
          window.history.pushState({}, '', `/map-layouts/builder?edit=${savedTemplate.template.id}`);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }
    } catch (err) {
      alert('Failed to save template: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const exportAsPNG = async () => {
    if (template.elements.length === 0) {
      alert('Please add elements to export');
      return;
    }

    try {
      setIsExporting(true);
      
      // For now, create a simple canvas and export it
      const canvas = document.createElement('canvas');
      canvas.width = template.layoutWidth;
      canvas.height = template.layoutHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add placeholder text
        ctx.fillStyle = '#000000';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Map Layout Export', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText(`${template.name || 'Untitled Layout'}`, canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText(`${template.elements.length} elements`, canvas.width / 2, canvas.height / 2 + 90);
      }
      
      // Create download link
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${template.name || 'map-layout'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export layout: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (template.elements.length === 0) {
      alert('Please add elements to export');
      return;
    }

    try {
      setIsExporting(true);
      
      // Create a simple canvas first
      const canvas = document.createElement('canvas');
      canvas.width = template.layoutWidth;
      canvas.height = template.layoutHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add placeholder text
        ctx.fillStyle = '#000000';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Map Layout Export', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText(`${template.name || 'Untitled Layout'}`, canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText(`${template.elements.length} elements`, canvas.width / 2, canvas.height / 2 + 90);
      }

      // Dynamically import pdf-lib to avoid SSR issues
      const { PDFDocument } = await import('pdf-lib');

      // Convert canvas to array buffer
      const dataUrl = canvas.toDataURL('image/png');
      const response = await fetch(dataUrl);
      const imageArrayBuffer = await response.arrayBuffer();

      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Calculate page size in points (72 points per inch)
      const pageWidth = (template.layoutWidth / 300) * 72;
      const pageHeight = (template.layoutHeight / 300) * 72;
      
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Embed PNG image
      const pngImage = await pdfDoc.embedPng(imageArrayBuffer);
      
      // Draw image to fill the entire page
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });

      // Serialize PDF
      const pdfBytes = await pdfDoc.save();

      // Download PDF
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name || 'map-layout'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export PDF: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const getElementDisplayText = (element: MapLayoutElement) => {
    switch (element.type) {
      case 'title':
        return element.text || 'Map Title';
      case 'text':
        return element.text || 'Custom Text';
      case 'legend':
        return '[Legend]';
      case 'north-arrow':
        return '⬆️ N';
      case 'scale-bar':
        return '[Scale: 1:1000]';
      case 'logo':
        return element.imageUrl ? '[Logo]' : '[Upload Logo]';
      case 'map-capture':
        return mapViewCaptured ? '[Map View]' : '[Capture Map]';
      default:
        return element.type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full relative z-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <section className="relative z-10 pt-16 pb-4 px-4">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/map-layouts"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-4"
          >
            <span>←</span>
            Back to Map Layout Templates
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {editingTemplate ? 'Edit Map Layout Template' : 'Map Layout Builder'}
              </h1>
              <p className="text-white/80 text-sm">
                Professional map layout editor with pixel-perfect positioning
              </p>
              <p className="text-white/60 text-xs mt-1">
                Layout dimensions: {template.layoutWidth} × {template.layoutHeight} pixels (A4 300 DPI)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={captureCurrentMapView}
                disabled={!targetView}
                className="inline-flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition-all duration-300 disabled:opacity-50"
              >
                <span>📸</span>
                {!targetView ? 'No Map View' : 'Capture Map'}
              </button>
              <button
                onClick={exportAsPNG}
                disabled={isExporting || template.elements.length === 0}
                className="inline-flex items-center gap-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-orange-700 transition-all duration-300 disabled:opacity-50"
              >
                <span>�️</span>
                {isExporting ? 'Exporting...' : 'Export PNG'}
              </button>
              <button
                onClick={exportAsPDF}
                disabled={isExporting || template.elements.length === 0}
                className="inline-flex items-center gap-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-red-700 transition-all duration-300 disabled:opacity-50"
              >
                <span>📄</span>
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <button
                onClick={saveTemplate}
                disabled={saving}
                className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50"
              >
                <span>💾</span>
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-4">
            {/* Left Panel - Template Settings & Element Types */}
            <div className="space-y-3">
              {/* Template Info */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-white mb-3">Template Settings</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={template.name}
                      onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="e.g., Standard Map Layout"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      Description
                    </label>
                    <textarea
                      value={template.description}
                      onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-400 h-16 resize-none"
                      placeholder="Template description..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      Background Map Type
                    </label>
                    <select
                      value={template.backgroundMapType}
                      onChange={(e) => setTemplate(prev => ({ ...prev, backgroundMapType: e.target.value as any }))}
                      className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      <option value="streets">Streets</option>
                      <option value="satellite">Satellite</option>
                      <option value="topographic">Topographic</option>
                      <option value="darkgray">Dark Gray</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Element Types */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-white mb-2">Add Elements</h3>
                
                <div className="space-y-1">
                  {ELEMENT_TYPES.map(elementType => (
                    <button
                      key={elementType.type}
                      onClick={() => addElement(elementType.type)}
                      className="w-full flex items-center gap-2 px-2 py-1 text-white/80 hover:bg-white/10 rounded transition-colors text-xs"
                      title={elementType.description}
                    >
                      <span>{elementType.icon}</span>
                      {elementType.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center - Canvas */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Layout Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                    className="p-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                    title="Zoom Out"
                  >
                    <span className="text-white text-sm">🔍-</span>
                  </button>
                  <span className="text-xs text-white/80 min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                    className="p-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                    title="Zoom In"
                  >
                    <span className="text-white text-sm">🔍+</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg flex items-center justify-center overflow-auto" style={{ height: '650px' }}>
                <div className="flex justify-center items-center bg-gray-100 p-4">
                  <div className="border border-gray-300 shadow-lg bg-white" style={{ width: '800px', height: '565px' }}>
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <div className="text-2xl mb-4">🗺️</div>
                      <div className="text-center">
                        <p className="font-semibold">Map Layout Canvas</p>
                        <p className="text-sm mt-2">Template: {template.name || 'Untitled'}</p>
                        <p className="text-xs mt-1">Elements: {template.elements.length}</p>
                        <p className="text-xs mt-1">Zoom: {Math.round(zoom * 100)}%</p>
                        {mapViewCaptured && (
                          <p className="text-xs mt-1 text-green-600">✓ Map captured</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Element Properties */}
            <div className="space-y-3">
              {selectedElement && (() => {
                const element = template.elements.find(e => e.id === selectedElement);
                if (!element) return (
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center">
                    <p className="text-white/60 text-sm">
                      Select an element to edit its properties
                    </p>
                  </div>
                );

                return (
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-white mb-3">Element Properties</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-white/60 mb-1">Type</label>
                        <div className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded">
                          {ELEMENT_TYPES.find(et => et.type === element.type)?.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">X</label>
                          <input
                            type="number"
                            value={Math.round(element.x)}
                            onChange={(e) => updateElement(element.id, { x: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">Y</label>
                          <input
                            type="number"
                            value={Math.round(element.y)}
                            onChange={(e) => updateElement(element.id, { y: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                          />
                        </div>
                      </div>

                      {(element.type === 'map-capture' || element.type === 'logo' || element.type === 'legend' || element.type === 'north-arrow' || element.type === 'scale-bar') && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">Width</label>
                            <input
                              type="number"
                              value={element.width || 150}
                              onChange={(e) => updateElement(element.id, { width: parseInt(e.target.value) || 150 })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">Height</label>
                            <input
                              type="number"
                              value={element.height || 150}
                              onChange={(e) => updateElement(element.id, { height: parseInt(e.target.value) || 150 })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            />
                          </div>
                        </div>
                      )}

                      {(element.type === 'title' || element.type === 'text') && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">Text</label>
                            <input
                              type="text"
                              value={element.text || ''}
                              onChange={(e) => updateElement(element.id, { text: e.target.value })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">Font Size</label>
                            <input
                              type="number"
                              value={element.fontSize}
                              onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value) || 16 })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                              min="12"
                              max="200"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">Font Family</label>
                            <select
                              value={element.fontFamily}
                              onChange={(e) => updateElement(element.id, { fontFamily: e.target.value })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            >
                              <option value="Arial">Arial</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Courier New">Courier New</option>
                              <option value="Georgia">Georgia</option>
                              <option value="Verdana">Verdana</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={element.color}
                                onChange={(e) => updateElement(element.id, { color: e.target.value })}
                                className="w-12 h-8 bg-white/10 border border-white/20 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={element.color}
                                onChange={(e) => updateElement(element.id, { color: e.target.value })}
                                className="flex-1 px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">Text Align</label>
                            <select
                              value={element.textAlign}
                              onChange={(e) => updateElement(element.id, { textAlign: e.target.value as 'left' | 'center' | 'right' })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">Font Weight</label>
                            <select
                              value={element.fontWeight}
                              onChange={(e) => updateElement(element.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                            </select>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-white/60 mb-1">Rotation (degrees)</label>
                        <input
                          type="number"
                          value={element.rotation || 0}
                          onChange={(e) => updateElement(element.id, { rotation: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                          min="-180"
                          max="180"
                        />
                      </div>

                      <button
                        onClick={() => deleteElement(element.id)}
                        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                      >
                        <span>🗑️</span>
                        Delete Element
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}