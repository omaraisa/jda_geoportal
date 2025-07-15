import LayerOptions from './layer-options';
import useLayerActions from "@/lib/hooks/use-layer-list";
import { CalciteIcon } from '@esri/calcite-components-react';
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function LayerItem({ layer, activeLayerId, setactiveLayerId, setLayers }: { layer: __esri.Layer, activeLayerId: string | null, setactiveLayerId: (activeLayerId: string | null) => void, setLayers: (layers: __esri.Layer[]) => void }) {
  const { handleOptionsClick, toggleLayerVisibility, handleRemoveLayer, renameLayer } = useLayerActions();
  const { t } = useTranslation();
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(layer.title || "");

  const handleRename = () => {
    setRenaming(true);
    setNewTitle(layer.title || "");
  };

  const handleRenameSubmit = () => {
    renameLayer(layer, newTitle, setLayers);
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
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--secondary-light-transparent)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--secondary-transparent)")}
    >
      <div className="flex items-center justify-between mx-2">
        <span className="truncate mr-2 max-w-[70%]" title={layer.title}>{layer.title}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CalciteIcon icon={layer.visible ? "view-visible" : "view-hide"} scale="s" className="cursor-pointer" onClick={() => toggleLayerVisibility(layer,setLayers)} />
          <CalciteIcon icon="pencil" scale="s" className="cursor-pointer" onClick={handleRename} />
          <CalciteIcon icon="handle-vertical" scale="s" className="cursor-pointer" onClick={() => handleOptionsClick(layer.id, activeLayerId, setactiveLayerId, setLayers)} />
        </div>
      </div>
      {renaming && (
        <input
          type="text"
          className="mt-2 px-2 py-1 rounded border border-gray-400 text-black z-10"
          value={newTitle}
          autoFocus
          onChange={e => setNewTitle(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={e => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") setRenaming(false);
          }}
          style={{ minWidth: 120 }}
        />
      )}
      {activeLayerId === layer.id && (
        <LayerOptions
          layer={layer}
          setLayers={setLayers}
        />
      )}
    </div>
  );
}
