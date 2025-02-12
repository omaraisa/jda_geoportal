import LayerOptions from './layer-options';
import useLayerActions from "@/lib/hooks/use-layer-list";


export default function LayerItem({ layer, activeLayerId, setactiveLayerId, setLayers }: { layer: __esri.Layer, activeLayerId: string | null, setactiveLayerId: (activeLayerId: string | null) => void, setLayers: (layers: __esri.Layer[]) => void }) {
  const { handleOptionsClick, toggleLayerVisibility, handleRemoveLayer } = useLayerActions()

  return (
    <div
      className="flex flex-col p-2 mx-2"
      style={{
        backgroundColor: "var(--primary-transparent)",
        color: "white",
        borderRadius: ".5rem",
        fontSize: ".8rem",
        transition: "background-color 0.3s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--primary-dark-transparent)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--primary-transparent)")}
    >
      <div className="flex items-center justify-between mx-2">
        <span>{layer.title}</span>
        <div className="flex items-center gap-2">
          <i
            className={`cursor-pointer ${layer.visible ? "esri-icon-visible" : "esri-icon-non-visible"}`}
            onClick={() => toggleLayerVisibility(layer, setLayers)}
          ></i>
          <i
            className="esri-icon-handle-vertical cursor-pointer"
            onClick={() => handleOptionsClick(layer.id, activeLayerId, setactiveLayerId, setLayers)}
          ></i>
          <i
            className="esri-icon-close cursor-pointer"
            onClick={() => handleRemoveLayer(layer, setLayers)}
          ></i>
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
