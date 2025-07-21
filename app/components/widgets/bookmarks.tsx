import { useEffect, useRef, useState } from "react";
import useStateStore from "@/stateStore";
import Bookmark from "@/components/ui/bookmark";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { useTranslation } from "react-i18next";
import { CalciteIcon } from "@esri/calcite-components-react";

export default function BookmarkComponent() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView); // Get the current view (2D or 3D) from Zustand
  const bookmarkName = useRef<HTMLInputElement>(null);
  const [bookmarkNameValue, setBookmarkNameValue] = useState('');
  const { bookmarks, addBookmark, deleteBookmark, loadBookmarks, updateStats } =
    useStateStore();
  const [formVisible, setFormVisibility] = useState(false);

  useEffect(() => {
    loadBookmarks(); // Load bookmarks on mount
  }, [loadBookmarks]); // Add loadBookmarks to the dependency array

  const handleAddBookmark = () => {
    if (bookmarkNameValue && view) {
      addBookmark(bookmarkNameValue, view);
      setFormVisibility(false);
      setBookmarkNameValue('');
      updateStats("Bookmarks");
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
          <Button
            variant="secondary"
            onClick={initAddBookmarkForm}
            className="flex justify-stretch w-full"
          >
            <span className="w-full flex items-center justify-center">
              <CalciteIcon icon="plus-circle" scale="m" />
              <span className="ml-2">{t('widgets.bookmarks.addBookmark')}</span>
            </span>
          </Button>

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
          <TextInput
            id="bookmarkName"
            label={t('widgets.bookmarks.enterName')}
            value={bookmarkNameValue}
            onChange={setBookmarkNameValue}
          />
          {/* Hidden input for backward compatibility */}
          <input ref={bookmarkName} style={{ display: 'none' }} />
          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={handleAddBookmark}
              className="flex justify-stretch w-full"
            >
              <span className="w-full flex items-center justify-center">
                <CalciteIcon icon="save" scale="m" />
                <span className="ml-2">{t('widgets.bookmarks.saveBookmark')}</span>
              </span>
            </Button>
            <Button
              variant="gray"
              onClick={handleCancel}
              className="flex justify-stretch w-full"
            >
              <span className="w-full flex items-center justify-center">
                <CalciteIcon icon="x-circle-f" scale="m" />
                <span className="ml-2">{t('widgets.bookmarks.cancel')}</span>
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}