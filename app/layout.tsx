import localFont from "next/font/local";
import "./globals.css";
import "@arcgis/core/assets/esri/themes/light/main.css";

import { ReactNode } from "react";

const tajawal = localFont({
  src: [
    {
      path: "/fonts/Tajawal-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "/fonts/Tajawal-Bold.ttf",
      weight: "600",
      style: "normal",
    }
  ],
  variable: "--font-tajawal",
});

const tajawalArabic = localFont({
  src: [
    {
      path: "/fonts/Tajawal-Regular.ttf",
      weight: "400",
      style: "normal",
    }
  ],
  variable: "--font-tajawal-arabic",
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
        className={`${tajawal.variable} ${tajawalArabic.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
