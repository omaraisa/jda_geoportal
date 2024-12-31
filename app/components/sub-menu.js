
import React, { Suspense } from "react";
import Loading from "./sub_components/loading";
import DefaultComponent from "./sub_components/default-component";
import useStateStore from "../stateManager";

// import AddScratchLayer from "./widgets/add-scratch-layer";
// import AddMapService from "./widgets/add-map-service";
// import AddCSVLayer from "./widgets/add-csv-layer";
// import AddKMLLayer from "./widgets/add-kml-layer";
// import AddGeoJSONLayer from "./widgets/add-geojson-layer";
// import AddUploadedLayer from "./widgets/add-uploaded-layer";
// import Bookmarks from "./widgets/bookmarks";
// import GPortalInfo from "./widgets/gportal-info";
// import Feedback from "./widgets/feedback";
// // import Print from "../components/widgets/print";
// import HTML_ELEMENTS_TEMPLATES from "./HTML_ELEMENTS_TEMPLATES";
// const Print = React.lazy(() => import('./widgets/print'))
// const Editor = React.lazy(() => import('./widgets/editor'))
// const Basemap = React.lazy(() => import('./widgets/basemap'))
// const SelectFeatures = React.lazy(() => import('./widgets/select-features'))
// const Query = React.lazy(() => import('./widgets/query'))
// const IntersectionAnalysis = React.lazy(() => import('./widgets/intersection-analysis'))
// const UnionAnalysis = React.lazy(() => import('./widgets/union-analysis'))
// const BufferAnalysis = React.lazy(() => import('./widgets/buffer-analysis'))
// const MergeAnalysis = React.lazy(() => import('./widgets/merge-analysis'))
// const NearAnalysis = React.lazy(() => import('./widgets/near-analysis'))
// const ClipAnalysis = React.lazy(() => import('./widgets/clip-analysis'))
// const MeasureArea = React.lazy(() => import('./widgets/measure-area'))
// const MeasureDistance = React.lazy(() => import('./widgets/measure-distance'))
// const CoordinateConversion = React.lazy(() => import('./widgets/coordinate-conversion'))
// const LabelManager = React.lazy(() => import('./widgets/label-manager'))
// const PopupManager = React.lazy(() => import('./widgets/popup-manager'))
// const SymbologyManager = React.lazy(() => import('./widgets/symbology-manager'))
// const SaveMap = React.lazy(() => import('./widgets/save-map'))
// const OpenMap = React.lazy(() => import('./widgets/open-map'))
// const ExportManager = React.lazy(() => import('./widgets/export-manager'))

const components = {
    Loading,
    DefaultComponent
};

const subMenuPreviousComponents = {
    Loading,
    DefaultComponent
};

export default function SubMenu(props) {
  const currentComponent = useStateStore((state) => state.activeSubMenu);
  const CurrentComponent = components[currentComponent];
  const previousComponent = useStateStore((state) => state.previousSubMenu);
  const PreviousComponent = subMenuPreviousComponents[previousComponent];
  return (
    <div className={'h-[95vh] w-auto p-4 flex items-stretch flex-col flex-wrap gap-2 overflow-y-auto'}>
      {/* {PreviousComponent && */}
        <i className="fas fa-arrow-circle-right backBtn" onClick={() => props.goBack(PreviousComponent)}></i>
    {/* } */}
      
      <Suspense fallback={<Loading />}>
      <CurrentComponent  addWidget={props.addWidget} sendBackWidget={props.sendBackWidget} map={props.map} view={props.view}/>
      </Suspense>
    </div>
  );
}
