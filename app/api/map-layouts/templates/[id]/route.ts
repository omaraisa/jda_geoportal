import { NextRequest, NextResponse } from 'next/server';

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
  id: string;
  name: string;
  description: string;
  backgroundMapType: 'satellite' | 'streets' | 'topographic' | 'darkgray';
  layoutWidth: number;
  layoutHeight: number;
  elements: MapLayoutElement[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

// In-memory storage (replace with database in production)
let templates: MapLayoutTemplate[] = [
  {
    id: 'template-1',
    name: 'Standard Map Layout',
    description: 'Basic map layout with legend, north arrow, and title',
    backgroundMapType: 'streets',
    layoutWidth: 3508,
    layoutHeight: 2480,
    elements: [
      {
        id: 'map-1',
        type: 'map-capture',
        x: 100,
        y: 100,
        width: 2000,
        height: 1500,
        rotation: 0
      },
      {
        id: 'title-1',
        type: 'title',
        x: 100,
        y: 50,
        fontSize: 72,
        fontFamily: 'Arial',
        color: '#000000',
        textAlign: 'left',
        fontWeight: 'bold',
        text: 'Map Title',
        rotation: 0
      },
      {
        id: 'legend-1',
        type: 'legend',
        x: 2200,
        y: 100,
        width: 300,
        height: 400,
        rotation: 0
      },
      {
        id: 'north-1',
        type: 'north-arrow',
        x: 2200,
        y: 600,
        width: 100,
        height: 100,
        rotation: 0
      }
    ],
    isActive: true,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const template = templates.find(t => t.id === id);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const {
      name,
      description,
      backgroundMapType,
      layoutWidth,
      layoutHeight,
      elements,
      isActive
    } = body;

    // Update template
    templates[templateIndex] = {
      ...templates[templateIndex],
      name: name || templates[templateIndex].name,
      description: description || templates[templateIndex].description,
      backgroundMapType: backgroundMapType || templates[templateIndex].backgroundMapType,
      layoutWidth: layoutWidth || templates[templateIndex].layoutWidth,
      layoutHeight: layoutHeight || templates[templateIndex].layoutHeight,
      elements: elements || templates[templateIndex].elements,
      isActive: isActive !== undefined ? isActive : templates[templateIndex].isActive,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      template: templates[templateIndex],
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Handle setting default template
    if (body.isDefault !== undefined) {
      if (body.isDefault) {
        // Remove default from all other templates
        templates.forEach((template, index) => {
          if (index !== templateIndex) {
            template.isDefault = false;
          }
        });
      }
      
      templates[templateIndex].isDefault = body.isDefault;
      templates[templateIndex].updatedAt = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      template: templates[templateIndex],
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Remove template
    templates.splice(templateIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}