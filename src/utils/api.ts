import { CardData, Card } from '../types';

const SCRYFALL_API = 'https://api.scryfall.com/cards';

export const fetchCardData = async (cards: CardData[]): Promise<Card[]> => {
  const fetchPromises = cards.map(async (card) => {
    if (!card.id) {
      console.warn(`Skipping card with missing ID: ${card.name}`);
      return null;
    }
    try {
      const response = await fetch(`${SCRYFALL_API}/${card.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        set: data.set,
        set_name: data.set_name,
        image_uris: data.image_uris,
        price: parseFloat(data.prices.usd || '0'), // Use Scryfall's price
        foil_price: parseFloat(data.prices.usd_foil || '0'),
        collector_number: data.collector_number,
      };
    } catch (error) {
      console.error(`Error fetching data for card ${card.name || 'Unknown'}:`, error);
      return null;
    }
  });

  return (await Promise.all(fetchPromises)).filter((card): card is Card => card !== null);
};