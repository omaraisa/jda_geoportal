import NavButton from "./sub_components/nav-button";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./sub_components/lang-switcher";

export default function Header(props) {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-row justify-between items-center pr-5 min-h-16 text-white bg-gradient-to-r from-primary to-secondary text-white p-4 shadow-md z-10">
      {/* Logo and Title */}
      <div className="flex flex-row items-center">
        <Image src="/logo.png" alt={t("header.logoAlt")} width="40" height="40" />
        <h1 className="ml-2 mr-2 text-2xl">{t("header.title")}</h1>
      </div>
      {/* Navigation Tools */}
      <div className={`flex flex-row items-center space-x-2 ${i18n.language === 'ar' ? 'mr-auto' : 'ml-auto'}`}>
        <NavButton
          toolTip={t("header.nav.selectFeatures")}
          iconClass="esri-icon-cursor-marquee"
          activeNav={props.activeSubMenu === "SelectFeatures"}
          goTo={() => props.goTo(props.activeSubMenu === "SelectFeatures" ? "DefaultPane" : "SelectFeatures")}
        />
        <NavButton
          toolTip={t("header.nav.basemaps")}
          iconClass="esri-icon-basemap"
          activeNav={props.activeSubMenu === "Basemap"}
          goTo={() => props.goTo(props.activeSubMenu === "Basemap" ? "DefaultPane" : "Basemap")}
        />
        <NavButton
          toolTip={t("header.nav.drawingEditing")}
          iconClass="esri-icon-edit"
          activeNav={props.activeSubMenu === "Editor"}
          goTo={() => props.goTo(props.activeSubMenu === "Editor" ? "DefaultPane" : "Editor")}
        />
        <NavButton
          toolTip={t("header.nav.bookmarks")}
          iconClass="esri-icon-bookmark"
          activeNav={props.activeSubMenu === "Bookmarks"}
          goTo={() => props.goTo(props.activeSubMenu === "Bookmarks" ? "DefaultPane" : "Bookmarks")}
        />
        <NavButton
          toolTip={t("header.nav.printMap")}
          iconClass="esri-icon-printer"
          activeNav={props.activeSubMenu === "Print"}
          goTo={() => props.goTo(props.activeSubMenu === "Print" ? "DefaultPane" : "Print")}
        />
        <NavButton
          toolTip={t("header.nav.saveMap")}
          iconClass="esri-icon-save"
          activeNav={props.activeSubMenu === "SaveMap"}
          goTo={() => props.goTo(props.activeSubMenu === "SaveMap" ? "DefaultPane" : "SaveMap")}
        />
        <NavButton
          toolTip={t("header.nav.openMap")}
          iconClass="far fa-folder-open"
          activeNav={props.activeSubMenu === "OpenMap"}
          goTo={() => props.goTo(props.activeSubMenu === "OpenMap" ? "DefaultPane" : "OpenMap")}
        />
        <LanguageSwitcher />
      </div>
    </div>
  );
}
