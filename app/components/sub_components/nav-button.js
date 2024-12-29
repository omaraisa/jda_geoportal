export default function NavButton(props) {
  const toolTip = props.toolTip;

  // Dynamic Tailwind class based on props
  const NavButtonClass = props.activeNav
    ? "bg-blue-500 text-white shadow-md cursor-pointer hover:bg-blue-600"
    : "bg-white text-primary shadow-md cursor-pointer hover:bg-gray-100";

  return (
    <div className="relative group">
      {/* Button */}
      <div className={`${NavButtonClass} w-10 h-10 flex items-center justify-center rounded-lg`}>
        <i className={`${props.iconClass} text-xl`}></i>
      </div>

      {/* Tooltip Below the Button */}
      {toolTip && (
        <div className="absolute top-full mt-1 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-md group-hover:block">
          {toolTip}
        </div>
      )}
    </div>
  );
}
