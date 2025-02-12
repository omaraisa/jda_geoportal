import React, { useEffect, useState } from 'react';
import styles from './app-loader.module.css';

const AppLoader: React.FC = () => {
  const messages: string[] = [
    "Starting application...",
    "Fetching geospatial data...",
    "Rendering map components...",
    "Loading user interface...",
    "Finalizing setup..."
  ];

  const [currentMessage, setCurrentMessage] = useState<string>(messages[0]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length; // Cycle through messages
      setCurrentMessage(messages[index]);
    }, 1500);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className={styles.loaderWrapper}>
      <div className={styles.loader}></div>
      <p className={styles.loaderText}>{currentMessage}</p>
    </div>
  );
};

export default AppLoader;
