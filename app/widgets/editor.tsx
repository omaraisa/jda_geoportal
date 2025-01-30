import { useEffect, useRef } from "react";
import Editor from "@arcgis/core/widgets/Editor";
import useStateStore from "@/stateManager";

export default function EditorComponent() {
  const editorRef = useRef(null);
  const editorWidget = useRef(null); // Persist the Editor widget

  const view = useStateStore((state) => state.targetView);

  useEffect(() => {
    if (!view) return;

    // Initialize or update the Editor widget
    if (editorWidget.current) {
      editorWidget.current.view = view; // Update the view of the existing widget
    } else {
      editorWidget.current = new Editor({
        view: view,
        container: editorRef.current,
      });
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (editorWidget.current) {
        // Do not destroy, simply unbind the view if needed
        editorWidget.current.view = null;
      }
    };
  }, [view]); // Re-run when the view changes

  return (
    <div
      ref={editorRef}
      className="h-full w-full"
    ></div>
  );
}