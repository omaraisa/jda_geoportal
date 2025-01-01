import { useEffect, useRef } from "react";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import useStateStore from "../stateManager"; 

export default function BasemapGalleryComponent() {
  const basemapGalleryRef = useRef(null);

  // Access the `view` from Zustand state
  const view = useStateStore((state) => state.view);

  useEffect(() => {
    if (!view) return;

    // Initialize the BasemapGallery widget
    const basemapGalleryWidget = new BasemapGallery({
      view: view,
      container: basemapGalleryRef.current,
    });

    // Cleanup on unmount
    return () => {
      if (basemapGalleryWidget) {
        basemapGalleryWidget.destroy();
      }
    };
  }, [view]);

  return (
    <div
      ref={basemapGalleryRef}
      className="h-full w-full"
    ></div>
  );
}
