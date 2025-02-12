import React, { useState } from "react";
import styles from "./advanced-main-menu.module.css";
import useStateStore from "@/stateStore";

const AdvancedMainMenu: React.FC = () => {
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [contentTitle, setContentTitle] = useState("");
  const [contentOptions, setContentOptions] = useState<string[]>([]);
  const [contentColor, setContentColor] = useState("");
  const { sendMessage } = useStateStore((state) => state);

  const rotatePalette = (
    degrees: number,
    title: string,
    contentText: string,
    color: string,
    options: string[]
  ) => {
    // Update the rotation of the palette
    const palette = document.getElementById("palette");
    if (palette) {
      palette.style.transform = `translateY(0%) translateX(-50%) rotate(${degrees}deg)`;
    }

    // If content is already visible, animate it sliding down first
    if (isContentVisible) {
      const contentDiv = document.getElementById("content");
      if (contentDiv) {
        contentDiv.style.animation = `${styles.slideDown} 0.3s ease-out`;
        contentDiv.addEventListener(
          "animationend",
          () => {
            contentDiv.style.animation = "";
            updateContent(title, options, color);
          },
          { once: true }
        );
      }
    } else {
      updateContent(title, options, color);
    }
  };

  const updateContent = (title: string, options: string[], color: string) => {
    setContentTitle(title);
    setContentOptions(options);
    setContentColor(color);
    setIsContentVisible(true);

    // Trigger slide-up animation
    const contentDiv = document.getElementById("content");
    if (contentDiv) {
      contentDiv.style.animation = `${styles.slideUp} 0.5s ease-out`;
      contentDiv.addEventListener(
        "animationend",
        () => {
          contentDiv.style.animation = "";
        },
        { once: true }
      );
    }
  };

  return (
    <div className={styles.mainMenu}>
      {/* Content Panel */}
      <div
        id="content"
        className={styles.content}
        style={{ display: isContentVisible ? "block" : "none" }}
      >
        <h4 style={{ textAlign: "center" }}>{contentTitle}</h4>
        {contentOptions.map((option, index) => (
          <button
            key={index}
            className={styles.contentButton}
            onClick={() => 
                sendMessage({
                    title: "Message Title",
                    body: `Hi, I'm a message body! You clicked on option number ${index + 1}`,
                    type: "info",
                    duration: 10,
                  })
            }
          >
            {option}
          </button>
        ))}
      </div>

    {/* Center Content */}
    <div
        className={styles.centerContent}
    >
    
            <img src="/palm.png" alt="Logo" style={{ width: "25px", height: "25px" }} onClick={() => setIsContentVisible(false)}/>


    </div>

      {/* Circular Menu Palette */}
    <div id="palette" className={styles.palette}>
      <div
        className={`${styles.green} ${styles.section}`}
        onClick={() =>
        rotatePalette(
          288,
          "Map Tools",
          "Map Tools Content",
          "rgb(76, 121, 78)",
          ["Option 1", "Option 2", "Option 3", "Option 4"]
        )
        }
      >
        <div className={styles.indicator}><i className="esri-icon-settings"></i></div>
      </div>

      {/* Management Tools */}
      <div
        className={`${styles.blue} ${styles.section}`}
        onClick={() =>
        rotatePalette(
          216,
          "Management Tools",
          "Management Tools Content",
          "rgb(55, 108, 158)",
          ["Option 1", "Option 2", "Option 3"]
        )
        }
      >
        <div className={styles.indicator}><i className="esri-icon-measure"></i></div>
      </div>

      {/* Analysis Tools */}
      <div
        className={`${styles.orange} ${styles.section}`}
        onClick={() =>
        rotatePalette(
          144,
          "Analysis Tools",
          "Analysis Tools Content",
          "rgb(255,165,0)",
          ["Option 1", "Option 2"]
        )
        }
      >
        <div className={styles.indicator}><i className="esri-icon-legend"></i></div>
      </div>

      {/* Reporting Tools */}
      <div
        className={`${styles.red} ${styles.section}`}
        onClick={() =>
        rotatePalette(
          72,
          "Reporting Tools",
          "Reporting Tools Content",
          "rgb(255,0,0)",
          ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"]
        )
        }
      >
        <div className={styles.indicator}><i className="esri-icon-documentation"></i></div>
      </div>

      {/* Settings */}
      <div
        className={`${styles.purple} ${styles.section}`}
        onClick={() =>
        rotatePalette(
          0,
          "Settings",
          "Settings Content",
          "rgb(128,0,128)",
          ["Option 1", "Option 2", "Option 3"]
        )
        }
      >
        <div className={styles.indicator}><i className="esri-icon-settings2"></i></div>
      </div>
    </div>
    </div>
  );
};

export default AdvancedMainMenu;