export default function MinimizeMenu({ vertical, Onducked, arrow }) {
  return (
    <div
      className={`absolute ${
        vertical
          ? "bg-blue-600 text-white py-8 px-1 rounded-md text-sm cursor-pointer"
          : "bg-blue-600 text-white px-8 py-1 rounded-md text-sm cursor-pointer"
      } flex items-center justify-center`}
      style={{
        top: vertical ? "50%" : undefined,
        left: vertical ? undefined : "50%",
        transform: vertical ? "translateX(-50%)" : "translateY(-50%)",
      }}
      onClick={Onducked}
    >
      {arrow}
    </div>
  );
}
