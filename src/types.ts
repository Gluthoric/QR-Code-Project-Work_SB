export interface CardData {
  id: string;
  name: string;
  set: string;
  price: number;
}

export interface Card {
  id: string;
  name: string;
  set: string;
  set_name: string;
  image_uris: {
    small: string;
    normal: string;
    large: string;
  };
  price: number;
  foil_price: number;
  collector_number: string;
}

export interface LocalAPICard {
  id: number;
  name: string;
  // Add other properties as needed for the local API response
}
