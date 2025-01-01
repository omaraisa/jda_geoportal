import React, { Suspense } from "react";
import Loading from "./sub_components/loading";
import DefaultComponent from "./sub_components/default-component";
import useStateStore from "../stateManager";
import SubmenuHeader from "./sub_components/submenu-header";
// import BasemapGalleryComponent from "../widgets/basemap-gallery";
const BasemapGalleryComponent = React.lazy(() => import('../widgets/basemap-gallery'))

const components = {
  Loading,
  DefaultComponent,
  BasemapGalleryComponent, 
};

export default function SubMenu(props) {
  const currentComponentName = useStateStore((state) => state.activeSubMenu);
  const CurrentComponent = components[currentComponentName];

  if (!CurrentComponent) {
    console.error(`Component "${currentComponentName}" is not defined.`);
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
      {/* <Suspense fallback={<Loading />}> */}
        <div className="flex-1 overflow-hidden">
          <CurrentComponent />
        </div>
      {/* </Suspense> */}
    </div>
  );
}
