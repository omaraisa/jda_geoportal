export default function MinimizeMenu({ vertical, Onducked, arrow }) {
  return (
    <div
      className={`absolute bg-primary text-white rounded-full text-sm cursor-pointer flex items-center justify-center`}
      style={{
        top: vertical ? "50%" : undefined,
        left: vertical ? undefined : "50%",
        transform: vertical ? "translateX(-50%)" : "translateY(-50%)",
        width: "40px", // Set equal width and height for a perfect circle
        height: "40px", // Match height to width
      }}
      onClick={Onducked}
    >
      {arrow}
    </div>
  );
}
