import NavButton from "./sub_components/nav-button";
import Image from "next/image";

export default function Header(props) {
  return (
    <div className="flex flex-row justify-between items-center pr-5 min-h-16 text-white bg-gradient-to-r from-primary to-secondary text-white p-4 shadow-md z-10">
      {/* Logo and Title */}
      <div className="flex flex-row items-center">
        <Image src="/logo.png" alt="JDA Logo" width="40" height="40" />
        <h1 className="ml-2 mr-2 text-2xl">JDA Geoportal</h1>
      </div>
      {/* Navigation Tools */}
      <div className="flex flex-row items-center ml-auto space-x-2">
        <NavButton
          toolTip="Select Features"
          iconClass="esri-icon-cursor-marquee"
          activeNav={props.activeSubMenu === "SelectFeatures"}
          goTo={() => props.goTo(props.activeSubMenu === "SelectFeatures" ? "DefaultPane" : "SelectFeatures")}
        />
        <NavButton
          toolTip="Basemaps"
          iconClass="esri-icon-basemap"
          activeNav={props.activeSubMenu === "Basemap"}
          goTo={() => props.goTo(props.activeSubMenu === "Basemap" ? "DefaultPane" : "Basemap")}
        />
        <NavButton
          toolTip="Drawing and Editing"
          iconClass="esri-icon-edit"
          activeNav={props.activeSubMenu === "Editor"}
          goTo={() => props.goTo(props.activeSubMenu === "Editor" ? "DefaultPane" : "Editor")}
        />
        <NavButton
          toolTip="Bookmarks"
          iconClass="esri-icon-bookmark"
          activeNav={props.activeSubMenu === "Bookmarks"}
          goTo={() => props.goTo(props.activeSubMenu === "Bookmarks" ? "DefaultPane" : "Bookmarks")}
        />
        <NavButton
          toolTip="Print Map"
          iconClass="esri-icon-printer"
          activeNav={props.activeSubMenu === "Print"}
          goTo={() => props.goTo(props.activeSubMenu === "Print" ? "DefaultPane" : "Print")}
        />
        <NavButton
          toolTip="Save Map"
          iconClass="esri-icon-save"
          activeNav={props.activeSubMenu === "SaveMap"}
          goTo={() => props.goTo(props.activeSubMenu === "SaveMap" ? "DefaultPane" : "SaveMap")}
        />
        <NavButton
          toolTip="Open Map"
          iconClass="far fa-folder-open"
          activeNav={props.activeSubMenu === "OpenMap"}
          goTo={() => props.goTo(props.activeSubMenu === "OpenMap" ? "DefaultPane" : "OpenMap")}
        />
        <NavButton
          toolTip="About the Platform"
          iconClass="esri-icon-description"
          activeNav={props.activeSubMenu === "GPortalInfo"}
          goTo={() => props.goTo(props.activeSubMenu === "GPortalInfo" ? "DefaultPane" : "GPortalInfo")}
        />
        <NavButton
          toolTip="Feedback and Suggestions"
          iconClass="fas fa-bug"
          activeNav={props.activeSubMenu === "Feedback"}
          goTo={() => props.goTo(props.activeSubMenu === "Feedback" ? "DefaultPane" : "Feedback")}
        />
      </div>
      
    </div>
  );
}
