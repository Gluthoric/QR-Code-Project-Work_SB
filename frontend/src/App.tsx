// src/App.tsx

import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import FileUploader from './components/FileUploader';
import CardListWrapper from './components/CardListWrapper';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('API_URL:', API_URL); // For debugging

// Home Component: Displays the File Uploader
function Home({ handleFileUpload }: { handleFileUpload: (file: File) => void }) {
  return (
    <div className="max-w-md mx-auto">
      <FileUploader onFileUpload={handleFileUpload} />
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Attempting to upload file to:', `${API_URL}/api/upload`);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Upload successful, result:', result);
      navigate(`/card-list/${result.id}`);
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  console.log('Current path:', location.pathname);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">MTG Card Uploader</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home handleFileUpload={handleFileUpload} />} />
        <Route path="/card-list/:id" element={<CardListWrapper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-lg font-semibold">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
