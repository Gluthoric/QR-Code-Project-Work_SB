// src/App.tsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import FileUploader from './components/FileUploader';
import CardListWrapper from './components/CardListWrapper';
import { Card } from './types';

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

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // Use navigate to redirect to the card list view
      navigate(`/card-list/${result.id}`);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Router>
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
    </Router>
  );
}

export default App;
