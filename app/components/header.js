import NavButton from "./sub_components/nav-button";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./sub_components/lang-switcher";
import useStateStore from "../stateManager"; // Import Zustand state
import ViewSwitcher from "./sub_components/view-switcher";
import ViewSplitter from "./sub_components/view-splitter";

export default function Header() {
  const { t } = useTranslation();

  // Access `language` from Zustand state
  const language = useStateStore((state) => state.language);

  return (
    <div className="flex flex-row justify-between items-center pr-5 min-h-16 text-white bg-gradient-to-r from-primary to-secondary text-white p-4 shadow-md z-10">
      {/* Logo and Title */}
      <div className="flex flex-row items-center">
        <Image
          src="/logo.png"
          alt={t("header.logoAlt")}
          width="40"
          height="40"
        />
        <h1 className="ml-2 mr-2 text-2xl">{t("header.title")}</h1>
      </div>

      {/* Navigation Tools */}
      <div
        className={`flex flex-row items-center space-x-2 ${
          language === "ar" ? "mr-auto" : "ml-auto"
        }`}
      >
        <ViewSwitcher />
        <ViewSplitter />
        {/* <NavButton
          toolTip={t("header.nav.selectFeatures")}
          iconClass="esri-icon-cursor-marquee"
          targetComponent="SelectFeatures"
        /> */}
        <NavButton
          toolTip={t("header.nav.basemaps")}
          iconClass="esri-icon-basemap"
          targetComponent="BasemapGalleryComponent"
        />
        <NavButton
          toolTip={t("header.nav.drawingEditing")}
          iconClass="esri-icon-edit"
          targetComponent="EditorWidgetComponent"
        />
        <NavButton
          toolTip={t("header.nav.bookmarks")}
          iconClass="esri-icon-bookmark"
          targetComponent="BookmarkWidgetComponent"
        />
        <NavButton
          toolTip={t("header.nav.printMap")}
          iconClass="esri-icon-printer"
          targetComponent="PrintWidgetComponent"
        />
        <NavButton
          toolTip={t("header.nav.attributeQuery")}
          iconClass="esri-icon-search"
          targetComponent="AttributeQueryComponent"
        />
        <LanguageSwitcher />
      </div>
    </div>
  );
}
