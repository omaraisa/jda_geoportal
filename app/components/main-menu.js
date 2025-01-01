import React, { Suspense, useState } from "react";
import Loading from "./sub_components/loading";
import { useTranslation } from "react-i18next";
import LayerListWidgetComponent from "../widgets/layer-list";
import LegendWidgetComponent from "../widgets/legend";
// import AnalysisManager from "./widgets/analysis-manager";
// import Query from "./widgets/query";
// import Tools from "./widgets/tools";
// import MapFrames from "./widgets/maps-frames";
// import StatisticalAnalysis from "./widgets/statistical-analysis";

// const LegendWidgetComponent = React.lazy(() => import("./widgets/legend"));
// const LayerListWidgetComponent = React.lazy(() => import("./widgets/layerlist"));

export default function MainMenu(props) {
    const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="bg-gray-100  shadow">
  {/** Accordion Items */}
  <div >
        <div>
          <button
            className="flex justify-between items-center w-full py-2 px-4 text-white  hover:opacity-90  transition-all duration-300 ease-in-out border-b-2 border-primary-dark"
            style={{ backgroundColor: "var(--primary)" }}
            onClick={() => toggleAccordion(0)}
          >
            <h5 className="text-left">{t("menu.layers")}</h5>
            <i className="esri-icon-layer-list ml-2" />
          </button>
          {activeIndex === 0 && (
            <div className="p-4 bg-gray-200  mt-2  transition-all duration-300 ease-in-out">
              <Suspense fallback={<Loading />}>
                <LayerListWidgetComponent sendBackWidget={props.sendBackWidget} />
              </Suspense>
        </div>
      )}
    </div>

    {/* Legend */}
    <div>
      <button
        className="flex justify-between items-center w-full py-2 px-4 text-white  hover:opacity-90  transition-all duration-300 ease-in-out border-b-2 border-primary-dark"
        style={{ backgroundColor: "var(--primary)" }}
        onClick={() => toggleAccordion(1)}
      >
        <h5 className="text-left">{t("menu.legend")}</h5>
        <i className="esri-icon-legend ml-2" />
      </button>
      {activeIndex === 1 && (
        <div className="p-4 bg-gray-200  mt-2  transition-all duration-300 ease-in-out">
          <Suspense fallback={<Loading />}>
            <LegendWidgetComponent/>
          </Suspense>
        </div>
      )}
    </div>

    {/* Add Layer */}
    <div>
      <button
        className="flex justify-between items-center w-full py-2 px-4 text-white  hover:opacity-90  transition-all duration-300 ease-in-out border-b-2 border-primary-dark"
        style={{ backgroundColor: "var(--primary)" }}
        onClick={() => toggleAccordion(2)}
      >
        <h5 className="text-left">{t("menu.addLayer")}</h5>
        <i className="esri-icon-add-attachment ml-2" />
      </button>
      {activeIndex === 2 && (
        <div className="p-4 bg-gray-200  mt-2  transition-all duration-300 ease-in-out space-y-2">
          <button
            onClick={() => props.goToSubMenu("AddScratchLayer")}
            className="w-full py-2 px-4 bg-gray-300 text-gray-700  hover:bg-gray-400 flex justify-between"
          >
            Scratch Layer <i className="esri-icon-sketch-rectangle" />
          </button>
          <button
            onClick={() => props.goToSubMenu("AddMapService")}
            className="w-full py-2 px-4 bg-gray-300 text-gray-700  hover:bg-gray-400 flex justify-between"
          >
            Web Service <i className="esri-icon-layers" />
          </button>
          <button
            onClick={() => props.goToSubMenu("AddCSVLayer")}
            className="w-full py-2 px-4 bg-gray-300 text-gray-700  hover:bg-gray-400 flex justify-between"
          >
            CSV Layer <i className="esri-icon-map-pin" />
          </button>
          <button
            onClick={() => props.goToSubMenu("AddKMLLayer")}
            className="w-full py-2 px-4 bg-gray-300 text-gray-700  hover:bg-gray-400 flex justify-between"
          >
            KML Layer <i className="esri-icon-maps" />
          </button>
          <button
            onClick={() => props.goToSubMenu("AddGeoJSONLayer")}
            className="w-full py-2 px-4 bg-gray-300 text-gray-700  hover:bg-gray-400 flex justify-between"
          >
            GeoJson Layer <i className="esri-icon-table" />
          </button>
          <button
            onClick={() => props.goToSubMenu("AddUploadedLayer")}
            className="w-full py-2 px-4 bg-gray-300 text-gray-700  hover:bg-gray-400 flex justify-between"
          >
            Upload Layer <i className="esri-icon-upload" />
          </button>
        </div>
      )}
    </div>

    {/* Query */}
    <div>
      <button
        className="flex justify-between items-center w-full py-2 px-4 text-white  hover:opacity-90  transition-all duration-300 ease-in-out border-b-2 border-primary-dark"
        style={{ backgroundColor: "var(--primary)" }}
        onClick={() => toggleAccordion(3)}
      >
        <h5 className="text-left">{t("menu.query")}</h5>
        <i className="esri-icon-search ml-2" />
      </button>
      {activeIndex === 3 && (
        <div className="p-4 bg-gray-200  mt-2  transition-all duration-300 ease-in-out">
          {/* <Query /> */}
        </div>
      )}
    </div>
  </div>
</div>

  );
}
