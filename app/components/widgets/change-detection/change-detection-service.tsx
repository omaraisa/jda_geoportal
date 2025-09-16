import useStateStore from "@/stateStore";

export class ChangeDetectionService {
  static generateServiceName(raster1: string, raster2: string): string {
    // Extract date from raster name, assuming format like 2022-10-18-..._Sentinel-2...
    const extractDate = (raster: string): string => {
      const match = raster.match(/^(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : "unknown";
    };

    const date1 = extractDate(raster1);
    const date2 = extractDate(raster2);

    return `Change_Detect_${date1}_${date2}`;
  }

  static async submitJob(
    gpUrl: string,
    raster1: string,
    raster2: string,
    serviceName: string,
    publishToOnline: boolean,
    token: string
  ): Promise<string> {
    const submitUrl = `${gpUrl}/submitJob`;

    const params = new URLSearchParams({
      Input_Raster_1_: raster1,
      Input_Raster_2: raster2,
      arcgis_online_service_name: serviceName,
      publish_to_online: publishToOnline.toString(),
      token: token,
      f: "json",
    });

    const response = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit job: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || "Job submission failed");
    }

    return data.jobId;
  }

  static async pollJobStatus(gpUrl: string, jobId: string, token: string): Promise<any> {
    const statusUrl = `${gpUrl}/jobs/${jobId}?token=${token}&f=json`;

    while (true) {
      const response = await fetch(statusUrl);
      if (!response.ok) {
        throw new Error(`Failed to check job status: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.jobStatus === "esriJobSucceeded") {
        // Get results
        const resultsUrl = `${gpUrl}/jobs/${jobId}/results?token=${token}&f=json`;
        const resultsResponse = await fetch(resultsUrl);
        const resultsData = await resultsResponse.json();

        // Assuming the result parameter is named something like "Output_Service_URL" or similar
        // From the GP service, we need to know the output parameter name
        // For now, assume it's "Output_Service_URL"
        const outputParam = resultsData.results?.Output_Service_URL || resultsData.results?.[Object.keys(resultsData.results)[0]];
        if (outputParam && outputParam.value) {
          return { success: true, serviceUrl: outputParam.value };
        } else {
          return { success: false, error: "No output service URL found" };
        }
      } else if (data.jobStatus === "esriJobFailed") {
        return { success: false, error: data.messages?.[0]?.description || "Job failed" };
      } else if (data.jobStatus === "esriJobCancelling" || data.jobStatus === "esriJobCancelled") {
        return { success: false, error: "Job cancelled" };
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  static async addResultLayer(serviceUrl: string, title: string) {
    const stateStore = useStateStore.getState();
    await stateStore.createLayer({
      id: `change-detection-${Date.now()}`,
      sourceType: "arcgis",
      type: "MapImageLayer",
      url: serviceUrl,
      title: title,
      groups: [],
      visible: true,
      opacity: 1,
      minScale: 0,
      maxScale: 0,
      portalItemId: null,
      renderer: null,
      labelingInfo: null,
      visualVariables: [],
    });
  }
}
