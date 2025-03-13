import LayerOptions from './layer-options';
import useLayerActions from "@/lib/hooks/use-layer-list";
import { CalciteIcon } from '@esri/calcite-components-react';

export default function LayerItem({ layer, activeLayerId, setactiveLayerId, setLayers }: { layer: __esri.Layer, activeLayerId: string | null, setactiveLayerId: (activeLayerId: string | null) => void, setLayers: (layers: __esri.Layer[]) => void }) {
  const { handleOptionsClick, toggleLayerVisibility, handleRemoveLayer } = useLayerActions()

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
        <span>{layer.title}</span>
        <div className="flex items-center gap-2">
          <CalciteIcon icon={layer.visible ? "view-visible" : "view-hide"} scale="s" className="cursor-pointer" onClick={() => toggleLayerVisibility(layer,setLayers)} />
          <CalciteIcon icon="handle-vertical" scale="s" className="cursor-pointer" onClick={() => handleOptionsClick(layer.id, activeLayerId, setactiveLayerId, setLayers)} />
          <CalciteIcon icon="trash" scale="s" className="cursor-pointer" onClick={() => handleRemoveLayer(layer, setLayers)} />
        </div>
      </div>
      {activeLayerId === layer.id && (
        <LayerOptions
          layer={layer}
          setLayers={setLayers}
        />
      )}
    </div>
  );
}
