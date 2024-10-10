-- Create card_lists table
CREATE TABLE card_lists (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Create card_list_items table
CREATE TABLE card_list_items (
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

-- Note: The 'cards' table is not included here as it already exists and is correct.
