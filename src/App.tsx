import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import FileUploader from './components/FileUploader';
import CardGrid from './components/CardGrid';
import QRCodeGenerator from './components/QRCodeGenerator';
import { processCSV } from './utils/csvProcessor';
import { fetchCardData } from './utils/api';
import { Card } from './types';
import { query } from './utils/database';

function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [listId, setListId] = useState<string | null>(null);
  const [listName, setListName] = useState('');

  useEffect(() => {
    console.warn('Warning: Direct database access from the frontend is not recommended for production use. Consider creating a backend API.');
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      fetchCardList(id);
    }
  }, []);

  const fetchCardList = async (id: string) => {
    setIsLoading(true);
    try {
      const result = await query('SELECT name, cards FROM card_lists WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        const data = result.rows[0];
        setCards(data.cards);
        setListId(id);
        setListName(data.name);
      }
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
      const parsedData = await processCSV(file);
      const cardsWithData = await fetchCardData(parsedData);
      const filteredCards = cardsWithData.filter((card): card is Card => card !== null);
      setCards(filteredCards);

      // Generate a new UUID for the list
      const newListId = uuidv4();
      setListId(newListId);

      // Set a default name for the list
      const defaultName = `Card List ${new Date().toLocaleString()}`;
      setListName(defaultName);

      // Save the card list to PostgreSQL
      await query(
        'INSERT INTO card_lists (id, name, cards) VALUES ($1, $2, $3)',
        [newListId, defaultName, JSON.stringify(filteredCards)]
      );
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
        await query('UPDATE card_lists SET name = $1 WHERE id = $2', [newName, listId]);
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
              url={`${window.location.origin}?id=${listId}`}
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
