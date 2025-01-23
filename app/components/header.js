import NavButton from "./sub_components/nav-button";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./sub_components/lang-switcher";
import useStateStore from "../stateManager"; // Import Zustand state
import ViewSwitcher from "./sub_components/view-switcher";

export default function Header() {
  const { t } = useTranslation();
  const language = useStateStore((state) => state.language);

  return (
    <div className="absolute top-0 flex flex-row justify-between items-center pr-5 min-h-16 text-white p-2 z-10 w-full">
      {/* Left Section */}
      <div className="flex flex-row items-center flex-grow">
        <Image
          src="/logo.png"
          alt={t("header.logoAlt")}
          width="40"
          height="40"
          className="animate-rotate-3d"
        />
        <h1 className="ml-2 mr-2 text-2xl [text-shadow:2px_2px_4px_rgba(0,0,0)]">{t("header.title")}</h1>
      </div>

      {/* Middle Section (View Switcher) */}
      <div className="flex flex-row items-center justify-center flex-grow">
        <ViewSwitcher />
      </div>

      {/* Right Section */}
      <div
        className={`flex flex-row items-center space-x-2 flex-grow justify-end ${
          language === "ar" ? "mr-auto" : "ml-auto"
        }`}
      >
        <NavButton
          toolTip={t("header.nav.printMap")}
          iconClass="esri-icon-user"
          targetComponent="PrintComponent"
        />
        <LanguageSwitcher />
      </div>
    </div>
  );
}