import LanguageSwitcher from "./ui/lang-switcher";
import LogoutButton from "./ui/logout-button";
import useStateStore from "@/stateStore"; 

const Header: React.FC = () => {
  const language = useStateStore((state) => state.language);

  return (
    <div className="absolute top-0 flex flex-row justify-between pr-5 min-h-16 text-white p-2 z-10 w-full">
    
      <div
        className={`flex flex-row items-center gap-2 flex-1 self-start justify-end ${
          language === "ar" ? "mr-auto" : "ml-auto"
        }`}
      >
        <LanguageSwitcher />
        {/* <LogoutButton /> */}
      </div>
    </div>
  );
};

export default Header;
