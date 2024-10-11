import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import CardGrid from './components/CardGrid';
import QRCodeGenerator from './components/QRCodeGenerator';
import { getCardsFromLocalAPI } from './utils/api';
import { Card } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [listId, setListId] = useState<string | null>(null);
  const [listName, setListName] = useState('');
  const [localIpAddress, setLocalIpAddress] = useState('');

  useEffect(() => {
    const rootElement = document.getElementById('root');
    const cardListId = rootElement?.getAttribute('data-card-list-id');
    if (cardListId) {
      fetchCardList(cardListId);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (id) {
        fetchCardList(id);
      }
    }
    fetchLocalIpAddress();
  }, []);

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

  const fetchCardList = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/card-list/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCards(data.cards);
      setListId(id);
      setListName(data.name);
    } catch (error) {
      console.error('Error fetching card list:', error);
      alert('Error fetching card list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setCards(result.cards);
      setListId(result.id);
      setListName(result.name);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = async (newName: string) => {
    setListName(newName);
    if (listId) {
      try {
        const response = await fetch(`${API_URL}/card-list/${listId}`, {
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
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">MTG Card Uploader</h1>
      {cards.length === 0 ? (
        <div className="max-w-md mx-auto">
          <FileUploader onFileUpload={handleFileUpload} />
        </div>
      ) : (
        <div className="space-y-8">
          {listId && (
            <QRCodeGenerator
              url={`http://${localIpAddress}:5000/card-list/${listId}`}
              name={listName}
              onNameChange={handleNameChange}
            />
          )}
          <CardGrid cards={cards} />
        </div>
      )}
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
