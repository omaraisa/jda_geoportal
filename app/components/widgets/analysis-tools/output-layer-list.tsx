import React, { useState } from "react";
import { CalciteIcon } from '@esri/calcite-components-react';
import { useTranslation } from "react-i18next";

interface OutputLayerItemProps {
  layer: __esri.Layer;
  onToggleVisibility: (layer: __esri.Layer) => void;
  onRename: (layer: __esri.Layer, newName: string) => void;
  onDelete: (layer: __esri.Layer) => void;
  onZoomTo: (layer: __esri.Layer) => void;
}

const OutputLayerItem: React.FC<OutputLayerItemProps> = ({ layer, onToggleVisibility, onRename, onDelete, onZoomTo }) => {
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
        <div className="mt-2 p-2 bg-black/20 rounded">
            <button 
                className="flex items-center gap-2 w-full p-1 hover:bg-white/10 rounded text-left text-xs"
                onClick={() => {
                    onZoomTo(layer);
                    setShowOptions(false);
                }}
            >
                <CalciteIcon icon="zoom-to-object" scale="s" />
                {t("layerList.zoomToLayer") || "Zoom to Layer"}
            </button>
        </div>
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
                    />
                ))}
            </div>
        </div>
    );
}
