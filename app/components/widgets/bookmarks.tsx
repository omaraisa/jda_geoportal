import { useEffect, useRef, useState } from "react";
import useStateStore from "@/stateStore";
import Bookmark from "@/components/ui/bookmark";
import { useTranslation } from "react-i18next";
import { CalciteIcon } from "@esri/calcite-components-react";

export default function BookmarkComponent() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView); // Get the current view (2D or 3D) from Zustand
  const bookmarkName = useRef<HTMLInputElement>(null);
  const { bookmarks, addBookmark, deleteBookmark, loadBookmarks } =
    useStateStore();
  const [formVisible, setFormVisibility] = useState(false);

  useEffect(() => {
    loadBookmarks(); // Load bookmarks on mount
  }, [loadBookmarks]); // Add loadBookmarks to the dependency array

  const handleAddBookmark = () => {
    if (bookmarkName.current && view) {
      const name = bookmarkName.current.value;
      addBookmark(name, view);
      setFormVisibility(false);
    }
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
        <div className="flex-column-container mx-3 py-3 text-foreground">
          <button
              className="btn btn-secondary flex-grow flex justify-stretch w-full"
              onClick={initAddBookmarkForm}
            >
              <span className="w-full flex items-center justify-center">
                <CalciteIcon icon="plus-circle" scale="m" />
                <span className="ml-2">{t('widgets.bookmarks.addBookmark')}</span>
              </span>
            </button>

          {bookmarks.length > 0 ? (
            bookmarks.map((bookmark) => (
              <Bookmark
                key={bookmark.id}
                {...bookmark}
                view={view ?? undefined}
                deleteBookmark={() => deleteBookmark(Number(bookmark.id))}
              />
            ))
          ) : (
            <span>{t('widgets.bookmarks.noBookmarks')}</span>
          )}
        </div>
      )}
      {formVisible && (
        <div className="add-bookmark p-2 flex flex-col gap-4 w-full">
          <h2
            className="block text-foreground font-semibold"
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
              className="btn btn-primary flex-grow flex justify-stretch w-full"
              onClick={handleAddBookmark}
            >
              <span className="w-full flex items-center justify-center">
                <CalciteIcon icon="save" scale="m" />
                <span className="ml-2">{t('widgets.bookmarks.saveBookmark')}</span>
              </span>
            </button>
            <button
              className="btn btn-gray flex-grow flex justify-stretch w-full"
              onClick={handleCancel}
            >
              <span className="w-full flex items-center justify-center">
                <CalciteIcon icon="x-circle-f" scale="m" />
                <span className="ml-2">{t('widgets.bookmarks.cancel')}</span>
              </span>
            </button>

          </div>
        </div>
      )}
    </div>
  );
}