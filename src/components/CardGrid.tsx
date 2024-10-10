import React from 'react';
import { Card } from '../types';

interface CardGridProps {
  cards: Card[];
}

const CardGrid: React.FC<CardGridProps> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div key={card.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
          {card.image_uris?.normal && (
            <img src={card.image_uris.normal} alt={card.name} className="w-full h-auto object-cover" />
          )}
          <div className="p-4 text-center flex-grow flex flex-col justify-center">
            <h3 className="font-bold text-lg mb-2">{card.name}</h3>
            <p className="text-gray-600 mb-1">Set: {card.set_name} ({card.set})</p>
            <p className="text-gray-600 mb-1">Collector Number: {card.collector_number}</p>
            <p className="text-green-600 font-semibold mb-1">Price: ${card.price.toFixed(2)}</p>
            {card.foil_price && card.foil_price > 0 && (
              <p className="text-blue-600 font-semibold mb-1">Foil Price: ${card.foil_price.toFixed(2)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardGrid;