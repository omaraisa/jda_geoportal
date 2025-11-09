"use client";

import React, { useEffect, useRef, useState } from "react";
import TimeSlider from "@arcgis/core/widgets/TimeSlider";
import TimeExtent from "@arcgis/core/TimeExtent";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import ImageryLayer from "@arcgis/core/layers/ImageryLayer";

export default function TimeSliderComponent() {
  const { t } = useTranslation();
  const timeSliderRef = useRef<HTMLDivElement>(null);
  const timeSliderWidgetRef = useRef<TimeSlider | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const targetView = useStateStore((state) => state.targetView);
  const sendMessage = useStateStore((state) => state.sendMessage);

  useEffect(() => {
    if (!targetView || !timeSliderRef.current || timeSliderWidgetRef.current) return;

    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      if (!timeSliderRef.current || timeSliderWidgetRef.current) return;

      // Create TimeSlider widget
      const timeSlider = new TimeSlider({
        container: timeSliderRef.current,
        mode: "time-window",
        timeVisible: true,
        loop: false,
      });

      timeSliderWidgetRef.current = timeSlider;

      // Set up time slider with satellite imagery
      setupSatelliteImageryTimeSlider(timeSlider);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (timeSliderWidgetRef.current) {
        timeSliderWidgetRef.current.destroy();
        timeSliderWidgetRef.current = null;
      }
      // Clear the container
      if (timeSliderRef.current) {
        timeSliderRef.current.innerHTML = '';
      }
    };
  }, [targetView]);

  const setupSatelliteImageryTimeSlider = async (timeSlider: TimeSlider) => {
    if (!targetView) return;

    setIsLoading(true);

    try {
      // Create a satellite imagery layer with temporal capabilities
      // Using Sentinel-2 imagery as an example
      const satelliteLayer = new ImageryLayer({
        url: "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer",
        title: "Sentinel-2 Satellite Imagery",
        visible: true,
        opacity: 0.8,
      });

      // Wait for layer to load to get time info
      await satelliteLayer.load();

      if (satelliteLayer.timeInfo && satelliteLayer.timeInfo.fullTimeExtent) {
        // Set the time slider's time extent to match the layer
        timeSlider.fullTimeExtent = satelliteLayer.timeInfo.fullTimeExtent;

        // Set initial time extent to show recent data
        const endTime = satelliteLayer.timeInfo.fullTimeExtent.end;
        const startTime = new Date(endTime.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago

        timeSlider.timeExtent = new TimeExtent({
          start: startTime,
          end: endTime
        });

        // Add the layer to the map
        targetView.map.add(satelliteLayer);

        // Watch for time slider changes and update layer
        timeSlider.watch("timeExtent", (newTimeExtent) => {
          if (satelliteLayer.timeInfo) {
            satelliteLayer.timeExtent = newTimeExtent;
          }
        });

        sendMessage({
          title: t("systemMessages.info.timeSliderReady.title", "Time Slider Ready"),
          body: t("systemMessages.info.timeSliderReady.body", "Satellite imagery time slider is now active. Use the slider to explore historical satellite data."),
          type: "info",
          duration: 5,
        });
      } else {
        // Fallback to World Imagery if Sentinel-2 doesn't have time info
        setupWorldImageryTimeSlider(timeSlider);
      }
    } catch (error) {
      console.error("Failed to setup satellite imagery time slider:", error);
      sendMessage({
        title: t("systemMessages.error.timeSliderError.title", "Time Slider Error"),
        body: t("systemMessages.error.timeSliderError.body", "Failed to load satellite imagery time slider. Please try again."),
        type: "error",
        duration: 10,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupWorldImageryTimeSlider = async (timeSlider: TimeSlider) => {
    if (!targetView) return;

    try {
      // Fallback to World Imagery with time extent
      const worldImageryLayer = new ImageryLayer({
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
        title: "World Imagery (Historical)",
        visible: true,
        opacity: 0.8,
      });

      await worldImageryLayer.load();

      // Set a default time extent for World Imagery (last 2 years)
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years ago

      timeSlider.fullTimeExtent = new TimeExtent({
        start: startTime,
        end: endTime
      });

      timeSlider.timeExtent = new TimeExtent({
        start: new Date(endTime.getTime() - (30 * 24 * 60 * 60 * 1000)), // Last 30 days
        end: endTime
      });

      targetView.map.add(worldImageryLayer);

      // For World Imagery, we'll simulate time-based filtering
      timeSlider.watch("timeExtent", (newTimeExtent) => {
        // World Imagery doesn't have built-in time filtering like Sentinel-2
        // But we can show the selected time range in the UI
        console.log("Selected time range:", newTimeExtent);
      });

      sendMessage({
        title: t("systemMessages.info.worldImageryTimeSlider.title", "World Imagery Time Slider"),
        body: t("systemMessages.info.worldImageryTimeSlider.body", "World Imagery time slider is active. Note: World Imagery shows the most recent available imagery for each location."),
        type: "info",
        duration: 8,
      });
    } catch (error) {
      console.error("Failed to setup World Imagery time slider:", error);
      sendMessage({
        title: t("systemMessages.error.timeSliderError.title", "Time Slider Error"),
        body: t("systemMessages.error.timeSliderError.body", "Failed to load time slider. Please try again."),
        type: "error",
        duration: 10,
      });
    }
  };

  const resetTimeSlider = () => {
    if (timeSliderWidgetRef.current && targetView) {
      // Reset to show most recent data
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days

      timeSliderWidgetRef.current.timeExtent = new TimeExtent({
        start: startTime,
        end: endTime
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {t("timeSlider.loading", "Loading satellite imagery...")}
          </span>
        </div>
      ) : (
        <div
          ref={timeSliderRef}
          className="flex-1 w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600"
          style={{ minHeight: "120px" }}
        />
      )}
    </div>
  );
}