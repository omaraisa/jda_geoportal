
## [ ] Client-Side GIS Analysis Tools Enhancement

The following common GIS analysis tools will be added to the application, leveraging the ArcGIS Maps SDK for JavaScript `geometryEngine` for client-side processing.

### Planned Tools

1.  **Merge**: Combines multiple layers (of the same geometry type) into a single new layer.
2.  **Convex Hull**: Creates a convex hull polygon for a set of input features.
3.  **Simplify**: Simplifies geometries to correct topological errors (e.g., self-intersections).
4.  **Densify**: Adds vertices to geometries to make them more closely approximate curves or to allow for more accurate projection.
5.  **Generalize**: Reduces the number of vertices in geometries to simplify their shape (e.g., for display at smaller scales).
6.  **Offset**: Creates new geometries that are offset from the original geometries by a specified distance.

### Implementation Strategy

Each tool will be implemented as a separate widget component, following the existing pattern:
-   **Component**: A React component (e.g., `Merge.tsx`) handling the UI, layer selection, and interaction with the `stateStore`.
-   **Service**: A TypeScript service (e.g., `merge-service.ts`) encapsulating the analysis logic using `geometryEngine`.
-   **State Management**: Output layers will be stored in the `stateStore`'s `analysisOutputLayers` to persist across widget toggles.
-   **UI Integration**: The new tools will be added to the `SpatialAnalysis` menu.
