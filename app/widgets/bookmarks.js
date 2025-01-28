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
        <div className="flex-column-container mx-3 py-3 text-white">
          <button
            className="btn btn-secondary w-full"
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
        <div className="add-bookmark p-6 flex flex-col gap-4 w-full">
          <h2
            htmlFor="textInput"
            className="block text-white font-semibold"
          >
            {t('widgets.bookmarks.bookmarkName')}
          </h2>
          <label htmlFor="bookmarkName" className="textInput">
          <input
            ref={bookmarkName}
            type="text"
            className="input-text"
            id="bookmarkName"
            placeholder="&nbsp;"
          />
          <span className="label">{t('widgets.bookmarks.enterName')}</span>
        </label>
          <div className="flex gap-4">
            <button
              className="btn btn-primary flex-grow"
              onClick={handleAddBookmark}
            >
              <i className="esri-icon-save mr-2"></i> {t('widgets.bookmarks.saveBookmark')}
            </button>
            <button
              className="btn btn-gray flex-grow"
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