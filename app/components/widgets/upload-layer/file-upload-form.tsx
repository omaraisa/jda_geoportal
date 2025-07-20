import React from "react";
import { useDropzone } from "react-dropzone";
import { ACCEPTED_FILE_TYPES, SUPPORTED_FILE_EXTENSIONS } from "./constants";

interface FileUploadFormProps {
  title: string;
  file: File | null;
  loading: boolean;
  onTitleChange: (title: string) => void;
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  t: (key: string) => string;
}

export const FileUploadForm: React.FC<FileUploadFormProps> = ({
  title,
  file,
  loading,
  onTitleChange,
  onFileSelect,
  onUpload,
  t
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    multiple: false,
    accept: ACCEPTED_FILE_TYPES,
  });

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex flex-col space-y-2 w-full">
        <label htmlFor="layerTitle" className="font-semibold text-foreground">
          {t("widgets.uploadLayer.enterTitle")}
          <span className="text-xs text-muted ml-2 mr-2">
            ({t("widgets.uploadLayer.optional")})
          </span>
        </label>
        
        <label htmlFor="layerTitle" className="textInput">
          <input
            id="layerTitle"
            type="text"
            className="input-text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder=" "
          />
          <span className="label">{t("widgets.uploadLayer.titlePlaceholder")}</span>
        </label>
        
        <label className="font-semibold text-foreground">
          {t("widgets.uploadLayer.selectFile")}
        </label>
        
        <span className="text-xs text-muted mb-2">
          {SUPPORTED_FILE_EXTENSIONS}
        </span>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-all transform duration-200 ease-in-out ${
            isDragActive
              ? "border-tertiary-light bg-tertiary-light/10 scale-105 shadow-md"
              : "border-muted"
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <span className="block text-sm text-foreground">{file.name}</span>
          ) : isDragActive ? (
            <span className="block text-sm text-tertiary-dark">
              {t("widgets.uploadLayer.dropHere")}
            </span>
          ) : (
            <span className="block text-sm text-muted">
              {t("widgets.uploadLayer.filePlaceholder")}
            </span>
          )}
        </div>
        
        <button 
          className={`btn ${loading ? 'btn-gray' : 'btn-primary'} w-full`} 
          onClick={onUpload} 
          disabled={loading}
        >
          {loading ? t("widgets.uploadLayer.uploading") : t("widgets.uploadLayer.upload")}
        </button>
      </div>
    </div>
  );
};
