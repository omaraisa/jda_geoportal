import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { useDropzone } from "react-dropzone";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import KMLLayer from "@arcgis/core/layers/KMLLayer";
import CSVLayer from "@arcgis/core/layers/CSVLayer";

const GP_URL = "https://gis.jda.gov.sa/agserver/rest/services/DataConversionTool/GPServer/Data%20Conversion%20Tool/submitJob";
const UPLOAD_URL = "https://gis.jda.gov.sa/agserver/rest/services/DataConversionTool/GPServer/uploads/upload";

async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const res = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData,
    });
    const text = await res.text();
    let itemID: string | null = null;
    const match = text.match(/<td>\s*Item ID:\s*<\/td>\s*<td><a [^>]*>([a-zA-Z0-9\-]+)<\/a><\/td>/i);
    if (match) {
        itemID = match[1];
    }
    if (!itemID) throw new Error("File upload failed: could not extract itemID");
    return itemID;
}

async function submitJob(file: File) {
    const itemID = await uploadFile(file);
    const params = {
        File: JSON.stringify({ itemID }),
        f: "json",
    };

    const response = await fetch(GP_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
    });
    const data = await response.json();
    return data;
}

async function pollJobStatus(jobId: string, interval = 2000, maxTries = 30) {
    // console.log(`Polling job status for job ID: ${jobId}...`);
    const statusUrl = `https://gis.jda.gov.sa/agserver/rest/services/DataConversionTool/GPServer/Data%20Conversion%20Tool/jobs/${jobId}?f=json`;
    for (let i = 0; i < maxTries; i++) {
        const res = await fetch(statusUrl);
        const data = await res.json();
        // console.log(`Job status (try ${i + 1}):`, data.jobStatus);
        if (data.jobStatus === "esriJobSucceeded") {
            // console.log("Job succeeded.");
            return data;
        }
        if (data.jobStatus === "esriJobFailed") {
            console.error("Job failed:", data.messages?.[0]?.description || "Job failed");
            throw new Error(data.messages?.[0]?.description || "Job failed");
        }
        await new Promise((r) => setTimeout(r, interval));
    }
    throw new Error("Timeout waiting for job completion");
}

async function fetchJobResult(jobId: string) {
    const resultUrl = `https://gis.jda.gov.sa/agserver/rest/services/DataConversionTool/GPServer/Data%20Conversion%20Tool/jobs/${jobId}/results/Output?f=json`;
    const res = await fetch(resultUrl);
    const data = await res.json();

    if (!data.value?.fileNames || !Array.isArray(data.value.fileNames)) {
        throw new Error("Output does not contain fileNames");
    }

    // Construct URLs for each output file
    const urls = data.value.fileNames.map(
        (fileName: string) =>
            `https://gis.jda.gov.sa/agserver/rest/directories/arcgisjobs/dataconversiontool_gpserver/${jobId}/scratch/${fileName}`
    );

    return {
        fileType: data.value.fileType,
        subLayers: data.value.subLayers || [],
        fileNames: data.value.fileNames,
        urls,
        jobId
    };
}

export default function UploadLayer() {
    const { t } = useTranslation();
    const sendMessage = useStateStore((state) => state.sendMessage);
    const view = useStateStore((state) => state.targetView);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const updateStats = useStateStore((state) => state.updateStats);
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            "application/json": [".json", ".geojson"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "text/csv": [".csv"],
            "text/plain": [".txt"],
            "application/zip": [".zip"],
            "application/gpx+xml": [".gpx"],
            "application/vnd.google-earth.kml+xml": [".kml"],
            "application/vnd.google-earth.kmz": [".kmz"],
            "application/acad": [".dwg", ".dxf"],
        },
    });
    const addLayerToMap = (layer: __esri.Layer, layerTitle: string, shouldZoom = true, onAfterZoom?: () => void) => {
        if (view && view.map && typeof view.map.add === "function") {
            (layer as any).group = "My Layers";
            view.map.add(layer);
            if (shouldZoom) {
                layer.when(() => {
                    view.goTo(layer.fullExtent).then(() => {
                        if (onAfterZoom) onAfterZoom();
                    });
                });
            } else {
                if (onAfterZoom) onAfterZoom();
            }

            setFile(null);
            setTitle("");
        }
    };

    const handleUploadLayer = async () => {
        if (!file) {
            sendMessage({
                type: "error",
                title: t("systemMessages.error.uploadLayerError.title"),
                body: t("systemMessages.error.completeUploadLayerRequirements.body"),
                duration: 8,
            });
            return;
        }

        setLoading(true);
        try {
            // 1. Submit job
            const submitRes = await submitJob(file);
            if (!submitRes.jobId) throw new Error(submitRes.messages?.[0]?.description || "Failed to submit job");

            // 2. Poll for job status
            await pollJobStatus(submitRes.jobId);

            // 3. Get output results
            const outputRes = await fetchJobResult(submitRes.jobId);
            const { urls, fileType, fileNames, subLayers } = outputRes;

            // 4. Add layer(s) to map
            if (view && view.map && typeof view.map.add === "function") {
                let layersToZoom: __esri.Layer[] = [];
                let layerTitles: string[] = [];
                for (let i = 0; i < urls.length; i++) {
                    const outputUrl = urls[i];
                    const layerTitle = subLayers[i] || title || fileNames[i]?.replace(/\.[^/.]+$/, "") || file.name.replace(/\.[^/.]+$/, "");

                    let layer: __esri.Layer | null = null;
                    if (fileType === "geojson" || outputUrl.endsWith(".geojson") || outputUrl.endsWith(".json")) {
                        layer = new GeoJSONLayer({
                            url: outputUrl,
                            title: layerTitle,
                        });
                    }
                    else if (fileType === "kml" || outputUrl.endsWith(".kml") || outputUrl.endsWith(".kmz")) {
                        layer = new KMLLayer({
                            url: outputUrl,
                            title: layerTitle,
                        });
                    }
                    else if (fileType === "csv" || outputUrl.endsWith(".csv")) {
                        layer = new CSVLayer({
                            url: outputUrl,
                            title: layerTitle,
                        });
                    }
                    if (layer) {
                        // Only zoom to the first layer, or zoom to all at once after adding
                        addLayerToMap(layer, layerTitle, false);
                        layersToZoom.push(layer);
                        layerTitles.push(layerTitle);
                    }
                }
                // After all layers are added, zoom to the combined extent
                if (layersToZoom.length > 0) {
                    Promise.all(layersToZoom.map(l => l.when()))
                        .then(() => {
                            // Calculate union of all extents
                            const extents = layersToZoom
                                .map(l => l.fullExtent)
                                .filter(Boolean);
                            if (extents.length === 1) {
                                view.goTo(extents[0]).then(() => {
                                    sendMessage({
                                        type: "info",
                                        title: t("widgets.uploadLayer.success"),
                                        body: layerTitles[0] + t("widgets.uploadLayer.layerUploaded"),
                                        duration: 12,
                                    });
                                });
                            } else if (extents.length > 1) {
                                // Union extents
                                let unionExtent = extents[0].clone();
                                for (let i = 1; i < extents.length; i++) {
                                    unionExtent = unionExtent.union(extents[i]);
                                }
                                view.goTo(unionExtent).then(() => {
                                    sendMessage({
                                        type: "info",
                                        title: t("widgets.uploadLayer.success"),
                                        body: layerTitles.join(", ") + t("widgets.uploadLayer.layerUploaded"),
                                        duration: 12,
                                    });
                                });
                            } else {
                                // No extent, still show message
                                sendMessage({
                                    type: "info",
                                    title: t("widgets.uploadLayer.success"),
                                    body: layerTitles.join(", ") + t("widgets.uploadLayer.layerUploaded"),
                                    duration: 12,
                                });
                            }
                        });
                }
            }


        } catch (error) {
            console.error("Upload error:", error);
            sendMessage({
                type: "error",
                title: t("systemMessages.error.uploadLayerError.title"),
                body: (error as Error).message,
                duration: 8,
            });
        } finally {
            setLoading(false);
            updateStats("Upload Layer");
        }
    };

    return (
        <div className="flex flex-col space-y-4 p-4">
            <div className="flex flex-col space-y-2 w-full">
                <label htmlFor="layerTitle" className="font-semibold text-foreground">
                    {t("widgets.uploadLayer.enterTitle")}
                    <span className="text-xs text-muted ml-2 mr-2">
                        ({t("widgets.uploadLayer.optional")})
                    </span>
                </label>
                <label htmlFor="layerTitle" className="textInput">
                    <input
                        id="layerTitle"
                        type="text"
                        className="input-text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder=" "
                    />
                    <span className="label">{t("widgets.uploadLayer.titlePlaceholder")}</span>
                </label>
                <label className="font-semibold text-foreground">
                    {t("widgets.uploadLayer.selectFile")}
                </label>
                <span className="text-xs text-muted mb-2">
                    csv, txt, xlsx, json, kml, kmz, dwg, dxf, zipped shapefile
                </span>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-all transform duration-200 ease-in-out ${isDragActive
                            ? "border-tertiary-light bg-tertiary-light/10 scale-105 shadow-md"
                            : "border-muted"
                        }`}
                >
                    <input {...getInputProps()} />
                    {file ? (
                        <span className="block text-sm text-foreground">{file.name}</span>
                    ) : isDragActive ? (
                        <span className="block text-sm text-tertiary-dark">
                            {t("widgets.uploadLayer.dropHere")}
                        </span>
                    ) : (
                        <span className="block text-sm text-muted">
                            {t("widgets.uploadLayer.filePlaceholder")}
                        </span>
                    )}
                </div>
                <button className={`btn ${loading ? 'btn-gray' : 'btn-primary'} w-full`} onClick={handleUploadLayer} disabled={loading}>
                    {loading ? t("widgets.uploadLayer.uploading") : t("widgets.uploadLayer.upload")}
                </button>
            </div>
        </div>
    );
}
