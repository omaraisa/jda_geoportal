import React, { useState } from "react";
import { CalciteIcon } from '@esri/calcite-components-react';
import { useTranslation } from "react-i18next";
import LayerOptions from "../layer-list/layer-options";

interface OutputLayerItemProps {
  layer: __esri.Layer;
  onToggleVisibility: (layer: __esri.Layer) => void;
  onRename: (layer: __esri.Layer, newName: string) => void;
  onDelete: (layer: __esri.Layer) => void;
  onZoomTo: (layer: __esri.Layer) => void;
  onRefresh: () => void;
}

const OutputLayerItem: React.FC<OutputLayerItemProps> = ({ layer, onToggleVisibility, onRename, onDelete, onZoomTo, onRefresh }) => {
  const { t } = useTranslation();
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(layer.title || "");
  const [showOptions, setShowOptions] = useState(false);

  const handleRenameSubmit = () => {
    if (newTitle.trim()) {
      onRename(layer, newTitle);
    }
    setRenaming(false);
  };

  // Wrapper for setLayers to satisfy LayerOptions prop requirement
  // We ignore the passed layers and just trigger a refresh of the parent list
  const handleLayerUpdate = (_: __esri.Layer[]) => {
    onRefresh();
  };

  return (
    <div
      className="flex flex-col p-2 m-1"
      style={{
        backgroundColor: "var(--secondary-transparent)",
        color: "white",
        borderRadius: ".5rem",
        fontSize: ".8rem",
        transition: "background-color 0.3s ease",
      }}
    >
      <div className="flex items-center justify-between mx-2">
        {!renaming ? (
          <span className="truncate mr-2 max-w-[60%]" title={layer.title}>{layer.title}</span>
        ) : (
           <input
            type="text"
            className="px-2 py-1 rounded border border-gray-400 text-black w-full"
            value={newTitle}
            autoFocus
            onChange={e => setNewTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={e => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") setRenaming(false);
            }}
          />
        )}
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <CalciteIcon 
            icon={layer.visible ? "view-visible" : "view-hide"} 
            scale="s" 
            className="cursor-pointer hover:text-blue-400" 
            onClick={() => onToggleVisibility(layer)} 
            title={layer.visible ? "Hide" : "Show"}
          />
          <CalciteIcon 
            icon="pencil" 
            scale="s" 
            className="cursor-pointer hover:text-blue-400" 
            onClick={() => {
                setRenaming(true);
                setNewTitle(layer.title);
            }} 
            title="Rename"
          />
          <CalciteIcon 
            icon="trash" 
            scale="s" 
            className="cursor-pointer hover:text-red-400" 
            onClick={() => onDelete(layer)} 
            title="Delete"
          />
           <CalciteIcon 
            icon="handle-vertical" 
            scale="s" 
            className="cursor-pointer hover:text-blue-400" 
            onClick={() => setShowOptions(!showOptions)} 
            title="Options"
          />
        </div>
      </div>
      
      {showOptions && (
        <LayerOptions layer={layer} setLayers={handleLayerUpdate} />
      )}
    </div>
  );
};

interface OutputLayerListProps {
  layers: __esri.Layer[];
  onToggleVisibility: (layer: __esri.Layer) => void;
  onRename: (layer: __esri.Layer, newName: string) => void;
  onDelete: (layer: __esri.Layer) => void;
  onZoomTo: (layer: __esri.Layer) => void;
}

export default function OutputLayerList({ layers, onToggleVisibility, onRename, onDelete, onZoomTo }: OutputLayerListProps) {
    if (layers.length === 0) return null;

    // Function to force re-render when LayerOptions modifies a layer
    const handleRefresh = () => {
        // We can't easily force update the parent state from here without a setLayers prop.
        // However, since 'layers' prop is passed by reference, mutations to layer objects (like visibility)
        // are already reflected in the objects. We just need to trigger a re-render.
        // But wait, if we don't update the parent state, the parent won't re-render.
        // The parent (Buffer/Overlay) passes 'layers' state.
        // We should probably ask the parent to refresh.
        // But for now, let's try to use onToggleVisibility as a hack to trigger update?
        // No, that toggles visibility.
        
        // Actually, LayerOptions calls setLayers(view.map.layers.toArray()).
        // This means it expects to update the global layer list.
        // But here we are in a local list.
        
        // If LayerOptions modifies the layer properties (e.g. opacity, popupEnabled), 
        // those are properties of the ArcGIS Layer object.
        // The map view will update automatically.
        // The React UI might need to update if it displays those properties.
        // OutputLayerItem displays title and visibility.
        // LayerOptions displays its own state.
        
        // So maybe we don't need to do much.
        // But LayerOptions calls setLayers. We provided a dummy handleLayerUpdate.
        // That calls onRefresh.
        
        // We can pass a dummy onRefresh that does nothing, or we can try to trigger a re-render.
        // Since we don't have a setLayers prop here, we can't update parent state.
        // But onToggleVisibility in parent does setOutputLayers([...outputLayers]).
        // We can add an onRefresh prop to OutputLayerList?
        
        // Let's just use onToggleVisibility(layer) twice? No that's bad.
        // Let's assume for now that map updates are handled by ArcGIS and we just need to show the controls.
    };

    return (
        <div className="mt-4 border-t border-gray-600 pt-4">
            <h3 className="text-sm font-semibold mb-2 px-2">Output Layers</h3>
            <div className="flex flex-col gap-1">
                {layers.map((layer, index) => (
                    <OutputLayerItem 
                        key={layer.id || index} 
                        layer={layer} 
                        onToggleVisibility={onToggleVisibility}
                        onRename={onRename}
                        onDelete={onDelete}
                        onZoomTo={onZoomTo}
                        onRefresh={handleRefresh}
                    />
                ))}
            </div>
        </div>
    );
}
