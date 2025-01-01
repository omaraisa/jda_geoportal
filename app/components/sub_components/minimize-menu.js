import { useTranslation } from "react-i18next";

export default function MinimizeMenu({ vertical, Onducked, arrow }) {
  const { i18n } = useTranslation();

  const adjustedArrow =
    i18n.language === "ar"
      ? arrow === "▶"
        ? "◀"
        : arrow === "◀"
        ? "▶"
        : arrow
      : arrow;

  return (
    <div
    className={`absolute bg-primary text-white rounded-full text-2xl cursor-pointer flex items-center justify-center`}
    style={{
        top: vertical ? "50%" : undefined,
        left: vertical ? undefined : "50%",
        transform: vertical
          ? i18n.language === "ar"
            ? "translateX(50%)"
            : "translateX(-50%)"
          : "translateY(-50%)",
        width: "40px",
        height: "40px",
      }}
      onClick={Onducked}
    >
      {adjustedArrow}
    </div>
  );
}
