import { useEffect, useRef } from "react";
import Editor from "@arcgis/core/widgets/Editor";
import useStateStore from "@/stateStore";

export default function EditorComponent() {
  const editorRef = useRef(null);
  const editorWidget =useRef<Editor | null>(null);

  const view = useStateStore((state) => state.targetView);

  useEffect(() => {
    if (!view) return;

    // Initialize or update the Editor widget
    if (editorWidget.current) {
      editorWidget.current.view = view; // Update the view of the existing widget
    } else {
      editorWidget.current = new Editor({
        view: view,
        container: editorRef.current || undefined,
      });
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (editorWidget.current) {
        // Widget destruction is disabled to preserve state. Uncomment to enable cleanup:
        // editorWidget.current.destroy();
        // editorWidget.current = null;
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