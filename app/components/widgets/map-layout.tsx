"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import jsPDF from "jspdf";

const MapLayoutComponent: React.FC = () => {
  const { t } = useTranslation();
  const targetView = useStateStore((state) => state.targetView);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setPrintBoundaryVisible = useStateStore((state) => state.setPrintBoundaryVisible);

  // Show print boundary when component mounts, hide when unmounts
  useEffect(() => {
    setPrintBoundaryVisible(true);
    return () => {
      setPrintBoundaryVisible(false);
    };
  }, [setPrintBoundaryVisible]);

  // Fixed canvas dimensions (A4 landscape in pixels at 300 DPI)
  const CANVAS_WIDTH = 3508;  // A4 landscape width at 300 DPI
  const CANVAS_HEIGHT = 2480; // A4 landscape height at 300 DPI

  const handlePrintCurrentMap = async () => {
    if (!targetView || !canvasRef.current) {
      alert("No map view available");
      return;
    }

    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;

      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Step 1: Get map screenshot
      const screenshot = await targetView.takeScreenshot({
        format: "png",
        quality: 100,
        width: 1920,
        height: 1080
      });

      // Step 2: Draw just the map - fill entire canvas
      const mapImage = new Image();
      mapImage.onload = () => {
        // Draw map to fill entire canvas
        ctx.drawImage(mapImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Add semi-transparent white background for top elements
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 150);

        // Add title on top of the map background at precise coordinates
        ctx.fillStyle = '#253080';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Map Export', CANVAS_WIDTH / 2, 100);

        // Add semi-transparent white background for bottom elements
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 150);

        // Add date at bottom right corner on top of map
        ctx.fillStyle = '#253080';
        ctx.font = '36px Arial';
        ctx.textAlign = 'right';
        const currentDate = new Date().toLocaleDateString();
        ctx.fillText(`Date: ${currentDate}`, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);

        // Add scale at bottom left corner on top of map
        ctx.fillStyle = '#253080';
        ctx.font = '32px Arial';
        ctx.textAlign = 'left';
        const scale = targetView.scale ? `1:${Math.round(targetView.scale).toLocaleString()}` : 'Unknown';
        ctx.fillText(`Scale: ${scale}`, 20, CANVAS_HEIGHT - 20);

        // Load and add images
        let imagesLoaded = 0;
        const totalImages = 2;
        
        const checkAllImagesLoaded = () => {
          imagesLoaded++;
          if (imagesLoaded === totalImages) {
            // All images loaded, now generate PDF
            const pdf = new jsPDF({
              orientation: 'landscape',
              unit: 'mm',
              format: 'a4'
            });

            const canvasDataUrl = canvas.toDataURL('image/png', 1.0);
            pdf.addImage(canvasDataUrl, 'PNG', 0, 0, 297, 210);

            const fileName = `map-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
            pdf.save(fileName);
            
            setIsGenerating(false);
          }
        };

        // Add north arrow at top left corner
        const northArrow = new Image();
        northArrow.onload = () => {
          // Get map rotation and apply it to north arrow
          const mapRotation = (targetView as any).rotation || (targetView as any).camera?.heading || 0;
          
          // Save context state
          ctx.save();
          
          // Move to center of north arrow position and rotate
          const centerX = 5 + 60; // 5 + half of 120 (width/2)
          const centerY = 20 + 60; // 20 + half of 120 (height/2)
          ctx.translate(centerX, centerY);
          ctx.rotate((mapRotation * Math.PI) / 180); // Convert degrees to radians
          
          // Draw rotated north arrow (centered at origin after translation)
          ctx.drawImage(northArrow, -60, -60, 120, 120); // x, y, width, height (centered)
          
          // Restore context state
          ctx.restore();
          
          checkAllImagesLoaded();
        };
        northArrow.onerror = () => {
          console.error('Failed to load north arrow');
          checkAllImagesLoaded();
        };
        northArrow.src = '/north-arrow.png';

        // Add JDA logo at top right corner
        const jdaLogo = new Image();
        jdaLogo.onload = () => {
          const aspectRatio = jdaLogo.naturalHeight / jdaLogo.naturalWidth;
          const newWidth = 500;
          const newHeight = newWidth * aspectRatio;
          ctx.drawImage(jdaLogo, CANVAS_WIDTH - 520, 5, newWidth, newHeight); // x, y, width, height
          checkAllImagesLoaded();
        };
        jdaLogo.onerror = () => {
          console.error('Failed to load JDA logo');
          checkAllImagesLoaded();
        };
        jdaLogo.src = '/jda_logo.png';
      };

      mapImage.src = screenshot.dataUrl;

    } catch (error) {
      console.error('Error generating map:', error);
      alert('Failed to generate PDF');
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 text-black w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">{t('mapLayouts.title', 'Map Print')}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {t('mapLayouts.description', 'Create a professional map layout with title, scale, and coordinates.')}
      </p>
      <button
        onClick={handlePrintCurrentMap}
        disabled={isGenerating}
        className={`w-full font-medium py-2 px-4 rounded-md transition-colors ${
          isGenerating 
            ? 'bg-gray-400 cursor-not-allowed text-gray-700' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isGenerating 
          ? t('mapLayouts.generating', 'Generating Layout...') 
          : t('mapLayouts.printCurrent', 'Generate Map Layout')
        }
      </button>
      
      {/* Hidden canvas for processing - like a certificate template */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
      />
    </div>
  );
};

export default MapLayoutComponent;