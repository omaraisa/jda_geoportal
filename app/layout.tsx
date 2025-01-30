import localFont from "next/font/local";
import "./globals.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import "@arcgis/core/assets/esri/themes/light/main.css";
import { ReactNode } from "react"; // Import ReactNode for the children prop

// Define the local fonts
const oxanium = localFont({
  src: [
    {
      path: "/fonts/oxanium-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "/fonts/oxanium-Bold.ttf",
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

// Define metadata
export const metadata = {
  title: "JDA Geoportal",
  description: "JDA Geoportal is a web-based GIS application",
};

// Define the RootLayout component with TypeScript
interface RootLayoutProps {
  children: ReactNode; // Define the type for children
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