import React, { useState, useEffect } from 'react';
import QRCodeGenerator from './QRCodeGenerator';
import CardGrid from './CardGrid';
import { Card } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface CardListProps {
  listId: string;
  listName: string;
  setListName: (name: string) => void;
}

const CardList: React.FC<CardListProps> = ({ listId, listName, setListName }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
};

export default CardList;
