import React, { useState, FormEvent } from "react";
import { submitJob } from "@arcgis/core/rest/geoprocessor";
import request from "@arcgis/core/request";
import useStateStore from "@/stateStore";

interface PrintFormData {
  title: string;
  author: string;
  format: 'pdf' | 'png' | 'jpg';
  layout: string;
  includeLegend: boolean;
  includeScale: boolean;
  scalebarUnit: 'metric' | 'imperial';
}

const PrintComponent: React.FC = () => {
  const view = useStateStore((state) => state.targetView);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PrintFormData>({
    title: "My Map",
    author: "Author Name",
    format: "pdf",
    layout: "MAP_ONLY",
    includeLegend: true,
    includeScale: true,
    scalebarUnit: "metric",
  });

  const GP_URL = "https://gis.jda.gov.sa/agserver/rest/services/CustomPrintService/GPServer/Custom%20Print";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const pollJobStatus = async (jobId: string): Promise<void> => {
    const jobStatusUrl = `${GP_URL}/${jobId}?f=json`;
    const maxAttempts = 30; // 1 minute max (2000ms * 30)
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await request(jobStatusUrl);
      const jobStatus = response.data.jobStatus;
      
      if (jobStatus === "esriJobSucceeded") {
        return;
      } else if (jobStatus === "esriJobFailed") {
        throw new Error("Print job failed");
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error("Print job timed out after waiting for too long.");
  };
  

  const handlePrint = async (e: FormEvent) => {
    e.preventDefault();

    if (!view) {
      setError("No map view available");
      return;
        }

        setIsLoading(true);
        setError(null);

        try {
      // Default basemap layer
      const basemapLayer = view.map.basemap.baseLayers.at(0);

      // Extract layer information from the view
      const operationalLayers = view.map.layers.map((layer) => {
        return {
          title: layer.title,
        };
      }).toArray();

      const basemap = [{
        title: basemapLayer.title,
      }];

      const extent = view.extent.toJSON();

      const layoutOptions = {
        titleText: formData.title,
        authorText: formData.author,
        scalebarUnit: formData.scalebarUnit,
        legendEnabled: formData.includeLegend,
      };

      // Create the web map JSON according to the specification
      const webMapJSON = {
        mapOptions: { extent },
        operationalLayers: operationalLayers,
        baseMap: basemap,
        exportOptions: {
          dpi: 300
        },
        layoutOptions: layoutOptions,
      };
console.log(webMapJSON)

      const params = {
        Web_Map_as_JSON: JSON.stringify(webMapJSON),
        Format: formData.format.toUpperCase(),
        Layout_Template: formData.layout,
        Title: formData.title,
        Author: formData.author,
        Include_Legend: formData.includeLegend,
        Include_Scale: formData.includeScale,
        Scalebar_Units: formData.scalebarUnit,
        Extent: JSON.stringify(extent)
      };

      const jobInfo = await submitJob(GP_URL, params);
      console.log("Job submitted with ID:", jobInfo.jobId);
      if (!jobInfo.jobId) {
        throw new Error("Failed to submit job");
      }

      await pollJobStatus(jobInfo.jobId);

      const resultUrl = `${GP_URL}/${jobInfo.jobId}/results/Output_File?f=json`;
      const resultResponse = await request(resultUrl);
      const outputUrl = resultResponse.data.value.url;

      window.open(outputUrl, "_blank");
    } catch (err) {
      console.error("Print error:", err);
      setError(err instanceof Error ? err.message : "Failed to print map");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 text-black w-full max-w-md">

      <form onSubmit={handlePrint}>
        <FormField label="Title">
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </FormField>

        <FormField label="Author">
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </FormField>

        <FormField label="Format">
          <select
            name="format"
            value={formData.format}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            {["pdf", "png", "jpg"].map((fmt) => (
              <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Layout">
          <select
            name="layout"
            value={formData.layout}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            {["Layout_A4_Landscape_Final", "MAP_ONLY"].map((lay) => (
              <option key={lay} value={lay}>{lay}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Scalebar Unit">
          <select
            name="scalebarUnit"
            value={formData.scalebarUnit}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            {["metric", "imperial"].map((unit) => (
              <option key={unit} value={unit}>{unit.toUpperCase()}</option>
            ))}
          </select>
        </FormField>

        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            name="includeLegend"
            checked={formData.includeLegend}
            onChange={handleCheckboxChange}
            className="mr-2"
          />
          <label>Include Legend</label>
        </div>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            name="includeScale"
            checked={formData.includeScale}
            onChange={handleCheckboxChange}
            className="mr-2"
          />
          <label>Include Scale</label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 transition"
        >
          {isLoading ? "Printing..." : "Print Map"}
        </button>
      </form>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

    </div>
  );
};

// Helper component for form fields
const FormField: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="mb-3">
    <label className="block mb-1">{label}</label>
    {children}
  </div>
);

export default PrintComponent;

