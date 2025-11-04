'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useStateStore from '@/stateStore';

interface MapLayoutTemplate {
  id: string;
  name: string;
  description: string;
  backgroundMapType: 'satellite' | 'streets' | 'topographic' | 'darkgray';
  elements: MapLayoutElement[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

interface MapLayoutElement {
  id: string;
  type: 'legend' | 'north-arrow' | 'title' | 'text' | 'logo' | 'scale-bar';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  properties: Record<string, any>;
}

export default function MapLayoutsPage() {
  const [templates, setTemplates] = useState<MapLayoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useStateStore();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      if (!isAuthenticated) {
        window.location.href = '/auth';
        return;
      }

      const response = await fetch('/api/map-layouts/templates');

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this layout template?')) return;

    try {
      const response = await fetch(`/api/map-layouts/templates/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== id));
      } else {
        throw new Error('Failed to delete template');
      }
    } catch {
      alert('Failed to delete template');
    }
  };

  const toggleDefault = async (id: string, currentIsDefault: boolean) => {
    try {
      const response = await fetch(`/api/map-layouts/templates/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isDefault: !currentIsDefault })
      });

      if (response.ok) {
        await fetchTemplates();
      } else {
        throw new Error('Failed to update template');
      }
    } catch {
      alert('Failed to update template');
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
      <section className="relative z-10 pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-8"
          >
            <span>←</span>
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Map Layout Templates
              </h1>
              <p className="text-white/80 text-lg">
                Create and manage professional map layout templates for exporting
              </p>
            </div>

            <Link
              href="/map-layouts/builder"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              <span>+</span>
              Create New Template
            </Link>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-8">
              {error}
            </div>
          )}

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <div
                key={template.id}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300"
              >
                <div className="relative aspect-[4/3]">
                  {template.thumbnailUrl ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <div className="w-16 h-16 text-white/50 text-4xl">🗺️</div>
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      template.backgroundMapType === 'satellite' 
                        ? 'bg-green-500 text-white' 
                        : template.backgroundMapType === 'streets'
                        ? 'bg-blue-500 text-white'
                        : template.backgroundMapType === 'topographic'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {template.backgroundMapType.charAt(0).toUpperCase() + template.backgroundMapType.slice(1)}
                    </span>
                    {template.isDefault && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-white flex items-center gap-1">
                        <span>⭐</span>
                        Default
                      </span>
                    )}
                  </div>
                  {!template.isActive && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white">
                        Inactive
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {template.name}
                  </h3>
                  <p className="text-white/60 text-sm mb-2">
                    {template.description}
                  </p>
                  <p className="text-white/60 text-xs mb-4">
                    {template.elements.length} elements • Created {new Date(template.createdAt).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <Link
                      href={`/map-layouts/builder?edit=${template.id}`}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>✏️</span>
                      Edit
                    </Link>
                    
                    <button
                      onClick={() => toggleDefault(template.id, template.isDefault)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                        template.isDefault 
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                      title={template.isDefault ? 'Remove Default' : 'Set as Default'}
                    >
                      <span>⭐</span>
                    </button>
                    
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <span>🗑️</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
                  <div className="text-6xl text-white/50 mb-4">🗺️</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No map layout templates</h3>
                  <p className="text-white/60 mb-4">Create your first professional map layout template</p>
                  <Link
                    href="/map-layouts/builder"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                  >
                    <span>+</span>
                    Create New Template
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}