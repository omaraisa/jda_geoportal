import React from "react";
import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import { FileUploadForm, useUploadLayer } from "./upload-layer/";

export default function UploadLayer() {
  const { t } = useTranslation();
  const sendMessage = useStateStore((state) => state.sendMessage);
  const view = useStateStore((state) => state.targetView);
  const updateStats = useStateStore((state) => state.updateStats);

  const {
    file,
    title,
    loading,
    setFile,
    setTitle,
    handleUploadLayer,
  } = useUploadLayer(view, sendMessage, updateStats, t);

  return (
    <FileUploadForm
      title={title}
      file={file}
      loading={loading}
      onTitleChange={setTitle}
      onFileSelect={setFile}
      onUpload={handleUploadLayer}
      t={t}
    />
  );
}
