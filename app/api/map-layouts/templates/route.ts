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

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      templates: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      description,
      backgroundMapType,
      layoutWidth,
      layoutHeight,
      elements,
      isActive = true
    } = body;

    // Validation
    if (!name || !description || !backgroundMapType || !layoutWidth || !layoutHeight) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(elements)) {
      return NextResponse.json(
        { error: 'Elements must be an array' },
        { status: 400 }
      );
    }

    // Create new template
    const newTemplate: MapLayoutTemplate = {
      id: `template-${Date.now()}`,
      name,
      description,
      backgroundMapType,
      layoutWidth,
      layoutHeight,
      elements,
      isActive,
      isDefault: false, // New templates are not default by default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    templates.push(newTemplate);

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}