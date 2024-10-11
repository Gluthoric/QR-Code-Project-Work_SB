import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      console.log('File accepted:', acceptedFiles[0].name);
      onFileUpload(acceptedFiles[0]);
    } else {
      console.log('No files were accepted');
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  console.log('FileRejections:', fileRejections);

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm font-medium text-gray-900">
        {isDragActive ? 'Drop the CSV file here' : 'Drag & drop a CSV file here, or click to select one'}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        CSV should contain columns: Scryfall ID, Name, Set Code, Price
      </p>
    </div>
  );
};

export default FileUploader;
