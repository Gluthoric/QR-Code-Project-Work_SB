// src/App.tsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { FileUploader } from './components/FileUploader';
import CardGrid from './components/CardGrid';
import QRCodeGenerator from './components/QRCodeGenerator';
import { Card } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('API_URL:', API_URL); // Add this line for debugging

function Home({ handleFileUpload }: { handleFileUpload: (file: File) => void }) {
  return (
    <div className="max-w-md mx-auto">
      <FileUploader onFileUpload={handleFileUpload} />
    </div>
  );
}

function CardListView({ listId, listName, setListName }: { listId: string; listName: string; setListName: (name: string) => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCardList = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/card-list/${listId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCards(data.cards);
        setListName(data.name);
      } catch (error) {
        console.error('Error fetching card list:', error);
        alert('Error fetching card list. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCardList();
  }, [listId, setListName]);

  const handleNameChange = async (newName: string) => {
    setListName(newName);
    try {
      const response = await fetch(`${API_URL}/api/card-list/${listId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating list name:', error);
      alert('Error updating list name. Please try again.');
    }
  };

  // Fetch local IP only once
  const [localIpAddress, setLocalIpAddress] = useState('');
  useEffect(() => {
    const fetchLocalIpAddress = async () => {
      try {
        const response = await fetch(`${API_URL}/api/get-local-ip`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched local IP address:', data.ip);
          setLocalIpAddress(data.ip);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching local IP address:', error);
        setLocalIpAddress('localhost'); // Fallback to localhost if unable to fetch IP
      }
    };
    fetchLocalIpAddress();
  }, []);

  return (
    <div className="space-y-8">
      <QRCodeGenerator
        url={`http://${localIpAddress}/card-list/${listId}`}
        name={listName}
        onNameChange={handleNameChange}
      />
      <CardGrid cards={cards} />
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

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [currentListName, setCurrentListName] = useState('');

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
      setCurrentListId(result.id);
      setCurrentListName(result.name);
      // Redirect to card list view
      window.location.href = `/card-list/${result.id}`;
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
          <Route
            path="/card-list/:id"
            element={
              <CardListWrapper
                listId={currentListId}
                listName={currentListName}
                setListName={setCurrentListName}
              />
            }
          />
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

function CardListWrapper({ listId, listName, setListName }: { listId: string | null; listName: string; setListName: (name: string) => void }) {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      // Set the listId if not already set
      if (!listId) {
        // You might want to fetch and set listId here
      }
    }
  }, [id, listId]);

  if (!id) {
    return <div>No list ID provided.</div>;
  }

  return <CardListView listId={id} listName={listName} setListName={setListName} />;
}

export default App;
