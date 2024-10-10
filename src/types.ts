export interface CardData {
  id: string;
  name: string;
  set: string;
  price: number;
}

export interface Card extends CardData {
  set_name?: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
  };
  foil_price?: number;
  collector_number?: string;
}