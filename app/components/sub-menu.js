import React, { Suspense } from "react";
import Loading from "./sub_components/loading";
import DefaultComponent from "./sub_components/default-component";
import useStateStore from "../stateManager";
import SubmenuHeader from "./sub_components/submenu-header";
import dynamic from "next/dynamic";
const BasemapGalleryComponent = dynamic(() => import("../widgets/basemap-gallery"), { ssr: false });
const EditorWidgetComponent = dynamic(() => import("../widgets/editor"), { ssr: false });
const PrintWidgetComponent = dynamic(() => import("../widgets/print"), { ssr: false });
const LayerListWidgetComponent = dynamic(() => import("../widgets/layer-list"), { ssr: false });
const LegendWidgetComponent = dynamic(() => import("../widgets/legend"), { ssr: false });
const BookmarkWidgetComponent = dynamic(() => import("../widgets/bookmarks"), { ssr: false });
const AttributeQueryComponent = dynamic(() => import("../widgets/attribute-query"), { ssr: false });


const components = {
  Loading,
  DefaultComponent,
  BasemapGalleryComponent, 
  EditorWidgetComponent,
  PrintWidgetComponent,
    LayerListWidgetComponent,
    LegendWidgetComponent,
    BookmarkWidgetComponent,
    AttributeQueryComponent
};

export default function SubMenu(props) {
  const currentComponentName = useStateStore((state) => state.activeSubMenu);
  const CurrentComponent = components[currentComponentName];

  if (!CurrentComponent) {
    return (
      <div className="h-full flex justify-center items-center">
        <p className="text-red-500">Component not found: {currentComponentName}</p>
      </div>
    );
  }

  return (
    <div
      className="h-[95vh] w-auto flex items-stretch flex-col flex-wrap gap-2 overflow-y-auto relative"
    >
      <SubmenuHeader />
      <Suspense fallback={<Loading />}>
        <div className="flex-1 overflow-hidden">
          <CurrentComponent />
        </div>
      </Suspense>
    </div>
  );
}
