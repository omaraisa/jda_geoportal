import React, { Suspense } from "react";
import Loading from "./ui/loading";
import DefaultComponent from "./widgets/default-component";
import useStateStore from "@/stateStore";
import SidebarHeader from "./sidebar-header";
import dynamic from "next/dynamic";

const EditorComponent = dynamic(() => import("@/components/widgets/editor"), {
  ssr: false,
});
const PrintComponent = dynamic(() => import("@/components/widgets/print"), {
  ssr: false,
});
const LayerListComponent = dynamic(
  () => import("@/components/widgets/layer-list"),
  { ssr: false }
);
const LegendComponent = dynamic(() => import("@/components/widgets/legend"), {
  ssr: false,
});
const BookmarkComponent = dynamic(() => import("@/components/widgets/bookmarks"), {
  ssr: false,
});
const SearchWidget = dynamic(() => import("@/components/widgets/search-widget"), {
  ssr: false,
});
const AttributeQueryComponent = dynamic(
  () => import("@/components/widgets/attribute-query"),
  { ssr: false }
);
const SpatialQueryComponent = dynamic(
  () => import("@/components/widgets/spatial-query"),
  { ssr: false }
);
const CoordinateConversionComponent = dynamic(
  () => import("@/components/widgets/coordinates-conversion"),
  { ssr: false }
);
const MeasurementComponent = dynamic(() => import("@/components/widgets/measurements"), {
  ssr: false,
});
const SketchComponent = dynamic(() => import("@/components/widgets/sketch"), {
  ssr: false,
});
const ClosestFacility = dynamic(() => import("@/components/widgets/closest-facility"), {
  ssr: false,
});
const DirectionsComponent = dynamic(() => import("@/components/widgets/directions"), {
  ssr: false,
});
const AddLayer = dynamic(() => import("@/components/widgets/add-layer"), {
  ssr: false,
});
const UploadLayer = dynamic(() => import("@/components/widgets/upload-layer"), {
  ssr: false,
});
const ExportLayer = dynamic(() => import("@/components/widgets/export-layer"), {
  ssr: false,
});
const ChangeDetectionComponent = dynamic(() => import("@/components/widgets/change-detection"), {
  ssr: false,
});
const BufferComponent = dynamic(() => import("@/components/widgets/buffer").then(mod => ({ default: mod.Buffer })), {
  ssr: false,
});
const OverlayComponent = dynamic(() => import("@/components/widgets/overlay").then(mod => ({ default: mod.Overlay })), {
  ssr: false,
});
const DissolveComponent = dynamic(() => import("@/components/widgets/dissolve").then(mod => ({ default: mod.Dissolve })), {
  ssr: false,
});
const ClipComponent = dynamic(() => import("@/components/widgets/clip").then(mod => ({ default: mod.Clip })), {
  ssr: false,
});
const GeometryModifyComponent = dynamic(() => import("@/components/widgets/geometry-modify").then(mod => ({ default: mod.GeometryModify })), {
  ssr: false,
});
const GoToXYComponent = dynamic(() => import("@/components/widgets/go-to-xy"), {
  ssr: false,
});
const MapLayoutComponent = dynamic(() => import("@/components/widgets/map-layout-fabric"), {
  ssr: false,
});
const ChartingComponent = dynamic(() => import("@/components/widgets/charting").then(mod => ({ default: mod.ChartingConfig })), {
  ssr: false,
});
const MergeComponent = dynamic(() => import("@/components/widgets/merge").then(mod => ({ default: mod.MergeComponent })), {
  ssr: false,
});
const ConvexHullComponent = dynamic(() => import("@/components/widgets/convex-hull").then(mod => ({ default: mod.ConvexHullComponent })), {
  ssr: false,
});
const SpatialJoinComponent = dynamic(() => import("@/components/widgets/spatial-join").then(mod => ({ default: mod.SpatialJoinComponent })), {
  ssr: false,
});
const AttributeJoinComponent = dynamic(() => import("@/components/widgets/attribute-join").then(mod => ({ default: mod.AttributeJoinComponent })), {
  ssr: false,
});
const SymbologyManagerComponent = dynamic(() => import("@/components/widgets/symbology-manager").then(mod => ({ default: mod.SymbologyManager })), {
  ssr: false,
});



const components = {
  Loading,
  DefaultComponent,
  EditorComponent,
  PrintComponent,
  LayerListComponent,
  LegendComponent,
  BookmarkComponent,
  SearchWidget,
  AttributeQueryComponent,
  SpatialQueryComponent,
  CoordinateConversionComponent,
  MeasurementComponent,
  SketchComponent,
  ClosestFacility,
  DirectionsComponent,
  AddLayer,
  UploadLayer,
  ExportLayer,
  ChangeDetectionComponent,
  BufferComponent,
  OverlayComponent,
  DissolveComponent,
  ClipComponent,
  GeometryModifyComponent,
  GoToXYComponent,
  MapLayoutComponent,
  ChartingComponent,
  MergeComponent,
  ConvexHullComponent,
  SpatialJoinComponent,
  AttributeJoinComponent,
  SymbologyManagerComponent,
};

export default function Sidebar() {
  const currentComponentName: string = useStateStore((state) => state.activeSideBar) || "DefaultComponent";
  const CurrentComponent = components[currentComponentName as keyof typeof components];

  if (!CurrentComponent) {
    return (
      <div className="h-full flex justify-center items-center">
        <p className="text-red-500">
          Component not found: {currentComponentName}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col w-full h-full rounded-2xl overflow-hidden shadow-lg transition-all duration-3000"
    >
      <div
        className="w-full rounded-t-2xl"
        style={{ backgroundColor: "var(--primary-transparent)" }}
      >
        <SidebarHeader />
      </div>

      <div
        className="w-full flex-1 overflow-y-auto"
        style={{ backgroundColor: "var(--primary-light-transparent)" }}
      >
        <Suspense fallback={<Loading />}>
          <CurrentComponent />
        </Suspense>
      </div>

      <div
        className="w-full h-[30px] rounded-b-2xl"
        style={{ backgroundColor: "var(--primary-transparent)" }}
      ></div>
    </div>
  );
}