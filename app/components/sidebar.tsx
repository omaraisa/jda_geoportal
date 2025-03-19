import React, { Suspense } from "react";
import Loading from "./ui/loading";
import DefaultComponent from "./widgets/default-component";
// import HTML_ELEMENTS_TEMPLATES from "../modules/HTML_ELEMENTS_TEMPLATES";
import useStateStore from "@/stateStore";
import SidebarHeader from "./sidebar-header";
import dynamic from "next/dynamic";

const BasemapGalleryComponent = dynamic(
  () => import("@/components/widgets/basemap-gallery"),
  { ssr: false }
);
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
const NetworkAnalysis = dynamic(() => import("@/components/widgets/network-analysis"), {
  ssr: false,
});
const AddLayer = dynamic(() => import("@/components/widgets/add-layer"), {
  ssr: false,
});


const components = {
  Loading,
  DefaultComponent,
  BasemapGalleryComponent,
  EditorComponent,
  PrintComponent,
  LayerListComponent,
  LegendComponent,
  BookmarkComponent,
  AttributeQueryComponent,
  SpatialQueryComponent,
  CoordinateConversionComponent,
  MeasurementComponent,
  SketchComponent,
  NetworkAnalysis,
  AddLayer
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