import { useEffect, useRef } from "react";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import useStateStore from "../stateManager";

export default function BasemapGalleryComponent() {
  const basemapGalleryRef = useRef(null); // Reference for the widget container
  const basemapGalleryWidgetRef = useRef(null); // Reference for the BasemapGallery widget
  const view = useStateStore((state) => state.targetView); // Get the current view (2D or 3D) from Zustand

  useEffect(() => {
    if (!view) return;

    // Initialize the BasemapGallery widget if it doesn't already exist
    if (!basemapGalleryWidgetRef.current) {
      basemapGalleryWidgetRef.current = new BasemapGallery({
        view: view, // Assign the current view
        container: basemapGalleryRef.current, // Attach to the container
      });
    } else {
      // Update the view of the existing widget when the view changes
      basemapGalleryWidgetRef.current.view = view;
    }
  }, [useStateStore((state) => state.targetView)]); // Re-run effect when the view changes

  return <div ref={basemapGalleryRef} className="h-full w-full"></div>;
}
