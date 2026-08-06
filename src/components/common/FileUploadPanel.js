import React, { useRef } from 'react';
import { Eye, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const defaultFileKey = (file, index) => file?.id || file?.name || index;
const defaultFileName = (file) =>
  file?.original_name || file?.original_filename || file?.name || 'Document';
const defaultFileMetadata = (file) => {
  const mimeType = file?.mime_type || file?.document_mime_type;
  return mimeType?.split('/').pop()?.toUpperCase() || '';
};

const FileUploadPanel = ({
  title = 'Upload Documents',
  description,
  files = [],
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  multiple = false,
  maxFiles = 1,
  maxSizeMB = 10,
  canUpload = true,
  canDelete = true,
  uploadLocked = false,
  uploading = false,
  uploadButtonLabel = 'Upload Files',
  lockMessage = 'Upload is disabled while uploaded files are present.',
  emptyMessage = 'No documents uploaded.',
  uploadFields,
  headerAction,
  showFileList = true,
  onUpload,
  onView,
  onDelete,
  getFileKey = defaultFileKey,
  getFileName = defaultFileName,
  getFileMetadata = defaultFileMetadata,
}) => {
  const inputRef = useRef(null);
  const inputDisabled = !canUpload || uploadLocked || uploading;

  const resetSelection = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileChange = async (event) => {
    const nextFiles = Array.from(event.target.files || []);
    if (nextFiles.length === 0) return;

    if (nextFiles.length > maxFiles) {
      toast.error(`You can upload a maximum of ${maxFiles} file(s).`);
      resetSelection();
      return;
    }

    const oversizedFile = nextFiles.find(
      (file) => file.size > maxSizeMB * 1024 * 1024,
    );
    if (oversizedFile) {
      toast.error(`${oversizedFile.name} is larger than ${maxSizeMB}MB.`);
      resetSelection();
      return;
    }

    await onUpload?.(nextFiles);
    resetSelection();
  };

  return (
    <div className='w-full max-w-2xl space-y-3'>
      <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
        <div>
          <h3 className='text-sm font-semibold text-slate-900'>{title}</h3>
          {description ? (
            <p className='mt-1 text-xs text-slate-500'>{description}</p>
          ) : null}
        </div>
        {headerAction}
      </div>

      {canUpload ? (
        <div
          className={`rounded-xl border p-3 ${
            uploadLocked
              ? 'border-slate-200 bg-slate-50 opacity-75'
              : 'border-slate-200 bg-white'
          }`}
        >
          {uploadFields ? <div className='mb-3'>{uploadFields}</div> : null}
          <div className='flex flex-wrap items-center gap-3'>
            <Input
              ref={inputRef}
              type='file'
              accept={accept}
              multiple={multiple}
              disabled={inputDisabled}
              onChange={handleFileChange}
              className='hidden'
              tabIndex={-1}
            />
            <Button
              type='button'
              onClick={() => inputRef.current?.click()}
              disabled={inputDisabled}
              className='h-10 bg-blue-600 px-4 text-white hover:bg-blue-700'
            >
              {uploading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Upload className='mr-2 h-4 w-4' />
              )}
              {uploadButtonLabel}
            </Button>
            {!uploadLocked ? (
              <span className='text-xs text-slate-500'>
                {multiple ? `Up to ${maxFiles} files` : 'One file'} · {maxSizeMB}MB each
              </span>
            ) : null}
          </div>
          {uploadLocked ? (
            <p className='mt-2 text-xs text-slate-600'>{lockMessage}</p>
          ) : null}
        </div>
      ) : null}

      {showFileList ? (
        <div className='overflow-hidden rounded-xl border border-slate-200 bg-white'>
          <div className='flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3'>
            <h4 className='text-sm font-semibold text-slate-800'>Uploaded Files</h4>
            <span className='rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700'>
              {files.length}
            </span>
          </div>
          {files.length === 0 ? (
            <div className='px-4 py-8 text-center text-sm text-slate-500'>
              {emptyMessage}
            </div>
          ) : (
            <div className='divide-y divide-slate-100'>
              {files.map((file, index) => {
                const fileName = getFileName(file);
                const metadata = getFileMetadata(file);
                return (
                  <div
                    key={getFileKey(file, index)}
                    className='flex items-center gap-3 px-4 py-3 hover:bg-slate-50'
                  >
                    <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600'>
                      <FileText size={20} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-semibold text-slate-800' title={fileName}>
                        {fileName}
                      </p>
                      {metadata ? (
                        <p className='mt-0.5 text-xs text-slate-500'>{metadata}</p>
                      ) : null}
                    </div>
                    {onView ? (
                      <button
                        type='button'
                        onClick={() => onView(file)}
                        className='rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50'
                        title='View file'
                        aria-label={`View ${fileName}`}
                      >
                        <Eye size={18} />
                      </button>
                    ) : null}
                    {(typeof canDelete === 'function'
                      ? canDelete(file)
                      : canDelete) && onDelete ? (
                      <button
                        type='button'
                        onClick={() => onDelete(file)}
                        className='rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50'
                        title='Delete file'
                        aria-label={`Delete ${fileName}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default FileUploadPanel;
