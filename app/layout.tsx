import localFont from "next/font/local";
import "./globals.css";
import "@arcgis/core/assets/esri/themes/light/main.css";

import { ReactNode } from "react";

const oxanium = localFont({
  src: [
    {
      path: "/fonts/Tajawal-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "/fonts/Tajawal-Regular.ttf",
      weight: "600",
      style: "normal",
    }
  ],
  variable: "--font-oxanium",
});

const droidArabicKufi = localFont({
  src: [
    {
      path: "/fonts/Tajawal-Regular.ttf",
      weight: "400",
      style: "normal",
    }
  ],
  variable: "--font-droid-arabic-kufi",
});

export const metadata = {
  title: "SDF | Spatial Data Front",
  description: "SDF | Spatial Data Front is a modern web application for exploring, analyzing, and visualizing geospatial data.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${oxanium.variable} ${droidArabicKufi.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
