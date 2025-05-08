export const restrictedPermissions: Record<string, string[]> = {
    UploadLayer: ["editor", "admin"],
    ExportLayer: ["editor", "admin"], // <-- allow both editor and admin
    EditLayer: ["editor", "admin"],
};