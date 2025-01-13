import React, { useEffect, useState } from 'react';
import styles from './app-loader.module.css';

export default function AppLoader() {
const messages = [
    "Starting application...",
    "Fetching geospatial data...",
    "Rendering map components...",
    "Loading user interface...",
    "Finalizing setup..."
];

  const [currentMessage, setCurrentMessage] = useState(messages[0]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length; // Cycle through messages
      setCurrentMessage(messages[index]);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className={styles.loaderWrapper}>
      <div className={styles.loader}></div>
      <p className={styles.loaderText}>{currentMessage}</p>
    </div>
  );
};
