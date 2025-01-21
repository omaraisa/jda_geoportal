import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import "@arcgis/core/assets/esri/themes/light/main.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
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

export const metadata = {
  title: "JDA Geoportal",
  description: "JDA Geoportal is a web-based GIS application",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${oxanium.variable} ${geistMono.variable} ${droidArabicKufi.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
