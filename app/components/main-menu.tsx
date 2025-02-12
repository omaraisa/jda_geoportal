import React, { useState, useEffect, useRef } from "react";
import useStateStore from "@/stateStore";
import { useTranslation } from "react-i18next";
import styles from "./main-menu.module.css";

export default function MainMenu() {
  const { t } = useTranslation();
  const mainMenuExpanded = useStateStore((state) => state.layout.mainMenuExpanded);
  const sidebarOpen = useStateStore((state) => state.layout.sidebarOpen);
  const setMainMenuExpansion = useStateStore((state) => state.setMainMenuExpansion);
  const activeSideBar = useStateStore((state) => state.activeSideBar);
  const setActiveSideBar = useStateStore((state) => state.setActiveSideBar);
  const toggleSidebar = useStateStore((state) => state.toggleSidebar);

  const [currentIndex, setCurrentIndex] = useState(0);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Use a ref for the timeout ID

  // Define a single array of objects for menu items
  const menuItems = [
    {
      icon: "esri-icon-basemap", // Basemap Gallery
      tooltip: t("mainMenu.basemapGallery"),
      targetComponent: "BasemapGalleryComponent",
    },
    {
      icon: "esri-icon-edit", // Editor Widget
      tooltip: t("mainMenu.editorWidget"),
      targetComponent: "EditorComponent",
    },
    {
      icon: "esri-icon-printer", // Print Widget
      tooltip: t("mainMenu.printWidget"),
      targetComponent: "PrintComponent",
    },
    {
      icon: "esri-icon-measure", // Measurement Widget
      tooltip: t("mainMenu.measurementWidget"),
      targetComponent: "MeasurementComponent",
    },
    {
      icon: "esri-icon-layers", // Layer List Widget
      tooltip: t("mainMenu.layerListWidget"),
      targetComponent: "LayerListComponent",
    },
    {
      icon: "esri-icon-search", // Attribute Query
      tooltip: t("mainMenu.attributeQuery"),
      targetComponent: "AttributeQueryComponent",
    },
    {
      icon: "esri-icon-lasso", // Sketch Widget
      tooltip: t("mainMenu.sketchWidget"),
      targetComponent: "SketchComponent",
    },
    {
      icon: "esri-icon-cursor-marquee", // Spatial Query
      tooltip: t("mainMenu.spatialQuery"),
      targetComponent: "SpatialQueryComponent",
    },
    {
      icon: "esri-icon-map-pin", // Coordinate Conversion
      tooltip: t("mainMenu.coordinateConversion"),
      targetComponent: "CoordinateConversionComponent",
    },
    {
      icon: "esri-icon-legend", // Legend Widget
      tooltip: t("mainMenu.legendWidget"),
      targetComponent: "LegendComponent",
    },
    {
      icon: "esri-icon-bookmark", // Bookmark Widget
      tooltip: t("mainMenu.bookmarkWidget"),
      targetComponent: "BookmarkComponent",
    },
  ];

  const totalItems = menuItems.length; // Number of menu items
  const visibleItems = 7; // Number of visible items in the carousel

  // Update menu item positions
  const updateMenu = () => {
    const middleIndex = Math.floor(visibleItems / 2);
    const items = document.querySelectorAll(`.${styles.menuItem}`);

    items.forEach((item, i) => {
      const element = item as HTMLElement; // Cast item to HTMLElement
      const offset = (i - currentIndex + totalItems) % totalItems;
      let position = offset - middleIndex;
      if (position > middleIndex) position -= totalItems;

      const absPos = Math.abs(position);
      const angle = position * 20;
      const zIndex = -absPos;

      let opacity = 1;
      let visibility = "visible";

      if (absPos === 3) {
        opacity = 0.5;
      } else if (absPos > 3) {
        opacity = 0;
        visibility = "hidden";
      }

      element.style.transform = `rotateY(${angle}deg) translateZ(300px)`;
      element.style.zIndex = zIndex.toString();
      element.style.opacity = opacity.toString();
      element.classList.toggle(styles.hidden, visibility === "hidden");
    });
  };

  // Rotate menu
  const rotateMenu = (direction: number) => {
    setCurrentIndex((prevIndex) => (prevIndex + direction + totalItems) % totalItems);
    extendTimer();
  };

  // Move item to the middle and set the active SideBar
  const handleClick = (index: number) => {
    if (menuItems[index].targetComponent === activeSideBar && sidebarOpen) {
      return; // Do nothing if the selected menu item is the current one
    }

    if (sidebarOpen) {
      toggleSidebar(false); // Close the sidebar first
      setTimeout(() => {
        toggleSidebar(true); // Open the sidebar after 1 second
        setActiveSideBar(menuItems[index].targetComponent); // Set the target SideBar
      }, 800); // Run after 1 second
    } else {
      toggleSidebar(true); // Open the sidebar immediately if the menu is not expanded
      setActiveSideBar(menuItems[index].targetComponent); // Set the target SideBar
    }

    const middleIndex = Math.floor(visibleItems / 2);
    const offset = (index - currentIndex + totalItems) % totalItems;
    setCurrentIndex((prevIndex) => (prevIndex + offset - middleIndex + totalItems) % totalItems);
    // Extend the timer by 10 seconds on click
    extendTimer();
  };

  // Extend the timer by 10 seconds
  const extendTimer = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current); // Clear the existing timeout
    }
    const newTimeout = setTimeout(() => {
      setMainMenuExpansion(false); // Close the menu after 10 seconds
    }, 10000); // 10 seconds
    hoverTimeoutRef.current = newTimeout; // Update the ref with the new timeout ID
  };

  // Handle hover over menu items
  const handleHover = () => {
    extendTimer(); // Extend the timer by 10 seconds on hover
  };

  // Auto-hide menu after 10 seconds of inactivity
  useEffect(() => {
    if (mainMenuExpanded) {
      extendTimer(); // Start the timer when the menu is expanded
    } else {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current); // Clear the timeout when the menu is closed
      }
    }
  }, [mainMenuExpanded]);

  // Update menu when currentIndex changes
  useEffect(() => {
    updateMenu();
  }, [currentIndex]);

  return (
    <div
      className={styles.mainMenu}
      style={{ bottom: mainMenuExpanded ? "60px" : "40px" }}
      onMouseEnter={handleHover} // Extend timer on hover over the menu
    >
      {/* Toggle Button */}
      <button
        className={`${styles.toggleButton} ${mainMenuExpanded ? styles.hidden : ""}`}
        onClick={() => setMainMenuExpansion(true)}
      >
        <i className="fas fa-tools"></i>
      </button>

      {/* Menu Container */}
      <div className={`${styles.menuContainer} ${mainMenuExpanded ? styles.expanded : ""}`}>
        {/* Navigation Buttons */}
        <button className={`${styles.navButton} ${styles.left}`} onClick={() => rotateMenu(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <button className={`${styles.navButton} ${styles.right}`} onClick={() => rotateMenu(1)}>
          <i className="fas fa-arrow-right"></i>
        </button>

        {/* Menu Items */}
        <div className={styles.menu}>
          {menuItems.map((item, i) => (
            <div
              key={i}
              className={styles.menuItem}
              data-tooltip={item.tooltip}
              onClick={() => handleClick(i)}
              onMouseEnter={handleHover} // Extend timer on hover over items
            >
              <i className={`fas ${item.icon}`}></i>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}