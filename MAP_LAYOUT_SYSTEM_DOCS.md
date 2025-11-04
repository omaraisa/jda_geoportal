# Map Layout Export System Documentation

## Overview
A comprehensive map layout export system for ArcGIS-based geoapplications that allows users to create professional map layouts with pixel-perfect accuracy. The system provides a Fabric.js-based canvas editor for drag-and-drop positioning of map elements and exports to high-resolution PNG/PDF formats.

## Features Implemented

### 1. Canvas-Based Layout Editor ✅
- **Technology**: Fabric.js for interactive canvas manipulation
- **File**: `/app/map-layouts/builder/FabricMapCanvas.tsx`
- **Features**:
  - Drag-and-drop positioning of elements
  - Real-time preview with zoom controls
  - Element selection and manipulation
  - Pixel-perfect coordinate tracking

### 2. Map Capture System ✅
- **Integration**: ArcGIS JavaScript API `takeScreenshot()` method
- **File**: `/app/map-layouts/builder/page.tsx` (captureCurrentMapView function)
- **Features**:
  - Automatic UI element hiding during capture
  - High-quality PNG capture from current map view
  - Error handling and user feedback
  - Integration with layout elements

### 3. Element Types ✅
- **Map Capture**: Current ArcGIS map view
- **Legend**: Placeholder for layer legend (expandable)
- **North Arrow**: Directional indicator with auto-rotation
- **Title**: Customizable text with font controls
- **Text Boxes**: Free-form text elements
- **Logo/Images**: Placeholder for branding elements
- **Scale Bar**: Distance scale representation

### 4. Element Properties Panel ✅
- **Location**: Right panel in builder interface
- **Controls**:
  - Position (X, Y coordinates)
  - Size (Width, Height for applicable elements)
  - Rotation (0-360 degrees)
  - Font properties (size, family, weight, color)
  - Text alignment (left, center, right)
  - Real-time updates

### 5. High-Resolution Export ✅
- **PNG Export**: 
  - Full resolution export matching layout dimensions
  - A4 landscape at 300 DPI (3508×2480 pixels)
  - Direct download functionality
- **PDF Export**:
  - Using pdf-lib for pixel-perfect PDF generation
  - Maintains exact layout dimensions
  - Professional cartographic output quality

### 6. Template Management System ✅
- **API Routes**: `/app/api/map-layouts/templates/`
- **Features**:
  - Save/load layout templates
  - Template listing and management
  - Default template setting
  - CRUD operations (Create, Read, Update, Delete)

### 7. Professional UI ✅
- **Design**: Modern gradient background with glass-morphism effects
- **Layout**: Three-panel interface (Settings, Canvas, Properties)
- **Controls**: Intuitive zoom, pan, and element manipulation
- **Responsive**: Adapts to different screen sizes

## File Structure

```
app/
├── map-layouts/
│   ├── page.tsx                     # Template listing page
│   └── builder/
│       ├── page.tsx                 # Main builder interface
│       └── FabricMapCanvas.tsx      # Canvas editor component
│
├── api/
│   └── map-layouts/
│       └── templates/
│           ├── route.ts             # GET, POST templates
│           └── [id]/
│               └── route.ts         # GET, PUT, PATCH, DELETE specific template
```

## Key Technologies

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Fabric.js**: Interactive canvas library
- **Zustand**: State management

### Export Libraries
- **pdf-lib**: PDF generation and manipulation
- **html2canvas**: (Available for fallback capture)
- **ArcGIS JavaScript API**: Native screenshot functionality

### ArcGIS Integration
- **Map View Access**: Through global state store
- **Screenshot Method**: `targetView.takeScreenshot()`
- **UI Element Management**: Temporary hiding during capture

## Usage Instructions

### For Users

1. **Access the System**:
   - Navigate to `/map-layouts` to view existing templates
   - Click "Create New Template" to start building

2. **Building a Layout**:
   - Set template name and description
   - Choose background map type
   - Add elements using the left panel
   - Position elements on the canvas
   - Adjust properties in the right panel

3. **Capturing Map View**:
   - Ensure main map is open and positioned correctly
   - Click "Capture Map" button
   - System will temporarily hide UI elements and capture view

4. **Exporting**:
   - Click "Export PNG" for raster image
   - Click "Export PDF" for print-ready document
   - Files download automatically

### For Developers

1. **Template Data Structure**:
```typescript
interface MapLayoutTemplate {
  id?: string;
  name: string;
  description: string;
  backgroundMapType: 'satellite' | 'streets' | 'topographic' | 'darkgray';
  layoutWidth: number;
  layoutHeight: number;
  elements: MapLayoutElement[];
}
```

2. **Element Structure**:
```typescript
interface MapLayoutElement {
  id: string;
  type: 'legend' | 'north-arrow' | 'title' | 'text' | 'logo' | 'scale-bar' | 'map-capture';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  // ... other properties
}
```

3. **Adding New Element Types**:
- Update `ELEMENT_TYPES` array in builder page
- Add rendering logic in `FabricMapCanvas.tsx`
- Update property panel controls

## Configuration

### Layout Dimensions
- **Default**: A4 landscape at 300 DPI (3508×2480 pixels)
- **Customizable**: Can be modified in template settings
- **Export Quality**: Maintains exact pixel dimensions

### Map Capture Settings
- **Format**: PNG
- **Quality**: 100% (maximum)
- **Options**: `ignorePadding: true`

### Canvas Display
- **Width**: 800px (display)
- **Height**: 565px (display)
- **Scale**: Automatically calculated based on layout dimensions
- **Zoom**: 0.3x default for A4 layouts

## Future Enhancements

### Planned Features
1. **Advanced Legend Generation**: Auto-extract layer symbols
2. **Smart North Arrow**: Auto-detect map rotation
3. **Dynamic Scale Bar**: Calculate scale from map view
4. **Template Library**: Pre-built professional templates
5. **Batch Export**: Multiple layouts at once
6. **Print Preview**: WYSIWYG preview mode

### Technical Improvements
1. **Database Integration**: Replace in-memory storage
2. **Real-time Collaboration**: Multiple users editing
3. **Undo/Redo System**: Action history management
4. **Advanced Export Options**: Custom DPI, formats
5. **Performance Optimization**: Large layout handling

## Troubleshooting

### Common Issues

1. **Map Capture Fails**:
   - Ensure main map view is loaded
   - Check browser permissions
   - Verify ArcGIS view accessibility

2. **Export Quality Issues**:
   - Check layout dimensions
   - Verify element positioning
   - Ensure proper zoom levels

3. **Canvas Performance**:
   - Reduce zoom for complex layouts
   - Limit number of elements
   - Use appropriate image sizes

### Error Handling
- Comprehensive try-catch blocks
- User-friendly error messages
- Graceful fallbacks for failed operations
- Console logging for debugging

## Installation Requirements

### Dependencies Added
```bash
npm install fabric html2canvas pdf-lib @types/fabric
```

### Peer Dependencies
- Next.js 15+
- React 19+
- TypeScript 5+
- @arcgis/core 4.27+

## API Documentation

### Templates Endpoint
- `GET /api/map-layouts/templates` - List all templates
- `POST /api/map-layouts/templates` - Create new template
- `GET /api/map-layouts/templates/[id]` - Get specific template
- `PUT /api/map-layouts/templates/[id]` - Update template
- `PATCH /api/map-layouts/templates/[id]` - Partial update (e.g., set default)
- `DELETE /api/map-layouts/templates/[id]` - Delete template

### Response Format
```json
{
  "success": true,
  "template": { /* template object */ },
  "message": "Operation completed successfully"
}
```

## Conclusion

This map layout export system provides a comprehensive solution for creating professional cartographic outputs from ArcGIS-based web applications. The system combines modern web technologies with proven libraries to deliver pixel-perfect results suitable for professional use cases.

The modular architecture allows for easy extension and customization, while the intuitive interface ensures accessibility for users of all technical levels.