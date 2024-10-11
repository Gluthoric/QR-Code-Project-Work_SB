import React, { useState, useEffect } from 'react';
import QRCodeGenerator from './QRCodeGenerator';
import CardGrid from './CardGrid';
import { Card } from '../types';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface CardListProps {
  listId: string;
  listName: string;
  setListName: (name: string) => void;
}

const CardList: React.FC<CardListProps> = ({ listId, listName, setListName }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localIpAddress, setLocalIpAddress] = useState('');
  const navigate = useNavigate();

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

    const fetchCardList = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/card-list/${listId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Card list not found. The list may have been deleted or the ID is incorrect.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCards(data.cards);
        setListName(data.name);
      } catch (error) {
        console.error('Error fetching card list:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocalIpAddress();
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl font-semibold text-red-600 mb-4">{error}</p>
        <p className="text-lg mb-4">Please check the list ID and try again.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Go Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!isLoading && cards.length === 0 ? (
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">No cards found in this list.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Go Back to Home
          </button>
        </div>
      ) : (
        <>
          <QRCodeGenerator
            url={`http://${localIpAddress}:5000/#/card-list/${listId}`}
            name={listName}
            onNameChange={handleNameChange}
          />
          <CardGrid cards={cards} />
        </>
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
};

export default CardList;
