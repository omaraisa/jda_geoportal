import NavButton from "./ui/nav-button";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./ui/lang-switcher";
import useStateStore from "@/stateStore"; // Import Zustand state
import ViewSwitcher from "./ui/view-switcher";

const Header: React.FC = () => {
  const { t } = useTranslation();
  const language = useStateStore((state) => state.language);

  return (
    <div className="absolute top-0 flex flex-row justify-between pr-5 min-h-16 text-white p-2 z-10 w-full">
      {/* Left Section */}
      {/* <div className="flex flex-row items-start flex-1 relative"> */}
        {/* First Image */}
        {/* <Image
          src={language === "ar" ? "/logo-ar.png" : "/logo.png"}
          alt={t("header.logoAlt")}
          width={325}
          height={40}
          className="self-start"
        /> */}

        {/* Second Image */}
        {/* <Image
          src="/logo-outer.png"
          alt={t("header.logoAlt")}
          width={62}
          height={40}
          className={`absolute top-0 ${language === "ar" ? "right-0" : "left-0"} self-start spin-slow`}
        />
      </div> */}

      {/* Middle Section (View Switcher) */}
      {/* <div className="flex flex-row items-center justify-center flex-1">
        <ViewSwitcher />
      </div> */}

      {/* Right Section */}
      <div
        className={`flex flex-row items-center gap-2 flex-1 self-start justify-end ${
          language === "ar" ? "mr-auto" : "ml-auto"
        }`}
      >
        {/* <NavButton
          toolTip={t("header.nav.printMap")}
          iconClass="user"
          targetComponent="PrintComponent"
        /> */}
        <LanguageSwitcher />
      </div>
    </div>
  );
};

export default Header;
