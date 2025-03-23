import localFont from "next/font/local";
import "./globals.css";
import "@arcgis/core/assets/esri/themes/light/main.css";

import { ReactNode } from "react";

const oxanium = localFont({
  src: [
    {
      path: "/fonts/Oxanium-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "/fonts/Oxanium-Bold.ttf",
      weight: "600",
      style: "normal",
    }
  ],
  variable: "--font-oxanium",
});

const droidArabicKufi = localFont({
  src: [
    {
      path: "/fonts/alfont_com_AlFont_com_Droid-Arabic-Kufi.ttf",
      weight: "400",
      style: "normal",
    }
  ],
  variable: "--font-droid-arabic-kufi",
});

export const metadata = {
  title: "JDA Geoportal",
  description: "JDA Geoportal is a web-based GIS application",
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
