import React, { useEffect, useState } from 'react';
import Image from "next/image";
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
        <div className="relative h-20 w-20">
        {/* First Image */}
        <Image
          src= "/logo.png"
          alt= "loading"
          width={100}
          height={100}
          className="absolute top-0 left-0"
        />

        {/* Second Image */}
        <Image
          src="/logo-outer.png"
          alt= "loading"
          width={100}
          height={100}
          className="absolute top-0 left-0 spin-slow"
        />
      </div>
      <p className={styles.loaderText}>{currentMessage}</p>
    </div>
  );
};

export default AppLoader;
