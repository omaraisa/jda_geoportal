import { useEffect, useRef } from "react";
import Editor from "@arcgis/core/widgets/Editor";
import useStateStore from "../stateManager";

export default function EditorWidgetComponent() {
  const editorRef = useRef(null);

  // Access the `view` from Zustand state
  const view = useStateStore((state) => state.view);

  useEffect(() => {
    if (!view) return;

    // Initialize the Editor widget
    const editorWidget = new Editor({
      view: view,
      container: editorRef.current,
    });

    // Cleanup on unmount
    return () => {
      if (editorWidget) {
        editorWidget.destroy();
      }
    };
  }, [view]);

  return (
    <div
      ref={editorRef}
      className="h-full w-full"
    ></div>
  );
}
