// src/App.tsx

import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Attempting to upload file to:', `${API_URL}/api/upload`);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        mode: 'cors', // Explicitly set CORS mode
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
      alert(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">MTG Card Uploader</h1>
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
