import { useEffect, useRef, useState } from "react";
import useStateStore from "@/stateManager";
import Bookmark from "@/components/sub_components/bookmark";
import { useTranslation } from "react-i18next";

export default function BookmarkComponent() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView); // Get the current view (2D or 3D) from Zustand
  const bookmarkName = useRef();
  const { bookmarks, addBookmark, deleteBookmark, loadBookmarks } =
    useStateStore();
  const [formVisible, setFormVisibility] = useState(false);

  useEffect(() => {
    loadBookmarks(); // Load bookmarks on mount
  }, [loadBookmarks]); // Add loadBookmarks to the dependency array

  const handleAddBookmark = () => {
    const name = bookmarkName.current.value;
    addBookmark(name, view); // Pass the view object
    setFormVisibility(false);
  };

  const initAddBookmarkForm = () => {
    setFormVisibility(true);
  };

  const handleCancel = () => {
    setFormVisibility(false);
  };

  return (
    <div className="flex-column-container">
      {!formVisible && (
        <div className="flex-column-container mx-3 text-white">
          <button
            className="w-full bg-primary-light text-white font-semibold py-3 mx-auto my-5 hover:bg-primary-dark transition-all duration-300 flex items-center justify-center shadow-md"
            onClick={initAddBookmarkForm}
          >
            <i className="esri-icon-plus-circled mr-2"></i> {t('widgets.bookmarks.addBookmark')}
          </button>

          {bookmarks.length > 0 ? (
            bookmarks.map((bookmark) => (
              <Bookmark
                key={bookmark.id}
                {...bookmark}
                view={view}
                deleteBookmark={() => deleteBookmark(bookmark.id)}
              />
            ))
          ) : (
            <span>{t('widgets.bookmarks.noBookmarks')}</span>
          )}
        </div>
      )}
      {formVisible && (
        <div className="add-bookmark p-6 max-w-md mx-auto">
          <label
            htmlFor="textInput"
            className="block text-gray-700 font-semibold mb-2"
          >
            {t('widgets.bookmarks.bookmarkName')}
          </label>
          <input
            type="text"
            id="textInput"
            ref={bookmarkName}
            placeholder={t('widgets.bookmarks.enterName')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 mb-4"
          />
          <div className="flex gap-4">
            <button
              className="w-full bg-primary-light text-white font-semibold py-3 rounded-lg hover:bg-primary-dark transition-all duration-300 flex items-center justify-center shadow-md"
              onClick={handleAddBookmark}
            >
              <i className="esri-icon-save mr-2"></i> {t('widgets.bookmarks.saveBookmark')}
            </button>
            <button
              className="w-full bg-gray-400 text-white font-semibold py-3 rounded-lg hover:bg-gray-500 transition-all duration-300 flex items-center justify-center shadow-md"
              onClick={handleCancel}
            >
              <i className="esri-icon-cancel mr-2"></i> {t('widgets.bookmarks.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}