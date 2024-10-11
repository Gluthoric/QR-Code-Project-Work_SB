import Papa from 'papaparse';
import { CardData } from '../types';

export const processCSV = (file: File): Promise<CardData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const cards: CardData[] = results.data
          .filter((row: any) => row['Scryfall ID'] && row['Name'])
          .map((row: any) => ({
            id: row['Scryfall ID'],
            name: row['Name'],
            set: row['Set Code'] || '',
            price: parseFloat(row['Price']) || 0,
          }));
        if (cards.length === 0) {
          reject(new Error('No valid card data found in the CSV file.'));
        } else {
          resolve(cards);
        }
      },
      error: (error) => {
        reject(new Error(`Error parsing CSV: ${error.message}`));
      },
    });
  });
};