import React from "react";

interface BookmarkProps {
  id: string;
  name: string;
  center: { x: number; y: number };
  zoom: number;
  view?: {
    goTo: (params: { center: [number, number]; zoom: number }) => void;
  };
  deleteBookmark: (id: string) => void;
}

const Bookmark: React.FC<BookmarkProps> = ({ id, name, center, zoom, view, deleteBookmark }) => {
  const zoomToBookmark = () => {
    if (view) {
      view.goTo({
        center: [center.x, center.y], // Pass center as [x, y]
        zoom, // Pass zoom level
      });
    }
  };

  return (
    <div
      className="flex justify-between items-center px-4 py-3 my-2 mx-1 border border-gray-300 rounded-lg bg-white hover:border-primary transition-all duration-300 shadow-md cursor-pointer transform hover:scale-105"
      onClick={zoomToBookmark}
    >
      <span className="flex-grow font-semibold text-primary truncate">
        {name}
      </span>
      <button
        className="btn btn-danger rounded-md"
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering zoom
          deleteBookmark(id);
        }}
      >
        <i className="esri-icon-trash"></i>
      </button>
    </div>
  );
};

export default Bookmark;
