export const restrictedPermissions: Record<string, string[]> = {
    UploadLayer: ["editor", "admin"],
    ExportLayer: ["editor", "admin"], 
    AddLayer: ["editor", "admin"],
    EditorComponent: ["editor", "admin"]
};