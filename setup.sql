-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    set_code VARCHAR(10) NOT NULL,
    set_name VARCHAR(255) NOT NULL,
    collector_number VARCHAR(20) NOT NULL,
    image_uris JSONB,
    price NUMERIC(10, 2),
    foil_price NUMERIC(10, 2)
);

-- Create card_lists table
CREATE TABLE IF NOT EXISTS card_lists (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Create card_list_items table
CREATE TABLE IF NOT EXISTS card_list_items (
    list_id CHAR(36),
    card_id TEXT,
    PRIMARY KEY (list_id, card_id)
);

-- Add foreign key constraints
ALTER TABLE card_list_items
ADD CONSTRAINT fk_card_list
FOREIGN KEY (list_id) REFERENCES card_lists(id);

ALTER TABLE card_list_items
ADD CONSTRAINT fk_card
FOREIGN KEY (card_id) REFERENCES cards(id);
