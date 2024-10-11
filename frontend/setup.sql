-- Create card_lists table
CREATE TABLE IF NOT EXISTS card_lists (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Create card_list_items table
CREATE TABLE IF NOT EXISTS card_list_items (
    list_id UUID,
    card_id TEXT,
    name VARCHAR(255) NOT NULL DEFAULT '',
    set_code VARCHAR(10),
    set_name VARCHAR(255),
    collector_number VARCHAR(20),
    image_uris JSONB,
    price NUMERIC(10, 2),
    foil_price NUMERIC(10, 2),
    PRIMARY KEY (list_id, card_id)
);

-- Add foreign key constraints
ALTER TABLE card_list_items
ADD CONSTRAINT fk_card_list
FOREIGN KEY (list_id) REFERENCES card_lists(id) ON DELETE CASCADE;

ALTER TABLE card_list_items
ADD CONSTRAINT fk_card
FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;
