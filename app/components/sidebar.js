import React, { Suspense } from "react";
import Loading from "./sub_components/loading";
import DefaultComponent from "./sub_components/default-component";
import useStateStore from "../stateManager";
import SidebarHeader from "./sub_components/sidebar-header";
import dynamic from "next/dynamic";

const BasemapGalleryComponent = dynamic(
  () => import("../widgets/basemap-gallery"),
  { ssr: false }
);
const EditorWidgetComponent = dynamic(() => import("../widgets/editor"), {
  ssr: false,
});
const PrintWidgetComponent = dynamic(() => import("../widgets/print"), {
  ssr: false,
});
const LayerListWidgetComponent = dynamic(
  () => import("../widgets/layer-list"),
  { ssr: false }
);
const LegendWidgetComponent = dynamic(() => import("../widgets/legend"), {
  ssr: false,
});
const BookmarkWidgetComponent = dynamic(() => import("../widgets/bookmarks"), {
  ssr: false,
});
const AttributeQueryComponent = dynamic(
  () => import("../widgets/attribute-query"),
  { ssr: false }
);

const components = {
  Loading,
  DefaultComponent,
  BasemapGalleryComponent,
  EditorWidgetComponent,
  PrintWidgetComponent,
  LayerListWidgetComponent,
  LegendWidgetComponent,
  BookmarkWidgetComponent,
  AttributeQueryComponent,
};

export default function Sidebar() {
  const currentComponentName = useStateStore((state) => state.activeSideBar);
  const CurrentComponent = components[currentComponentName];

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
        className="flex flex-col text-white w-full h-full rounded-2xl overflow-hidden shadow-lg transition-all duration-3000"
        style={{
            transform: "perspective(700px) rotateY(10deg)", // Tilt the div
            transformOrigin: "center", // Ensure the rotation is centered
            backfaceVisibility: "hidden", // Improve rendering performance
          }}
    >
        <div
            className="w-full rounded-t-2xl"
            style={{ backgroundColor: "#5b245dd7" }}
        >
            <SidebarHeader />
        </div>

        <div
            className="w-full flex-1 overflow-y-auto"
            style={{ backgroundColor: "#934b9647" }}
        >
            <Suspense fallback={<Loading />}>
                <CurrentComponent />
            </Suspense>
        </div>

        <div
            className="w-full h-[30px] rounded-b-2xl"
            style={{ backgroundColor: "#5b245dd7" }}
        ></div>
    </div>
);
}