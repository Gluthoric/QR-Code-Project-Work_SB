from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
import os
import uuid
from werkzeug.utils import secure_filename
import csv
import requests
from sqlalchemy import event, text, CHAR
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from sqlalchemy.orm import relationship
import json
import logging

# Load environment variables from .env.flask
load_dotenv('.env.flask')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
logging.basicConfig(level=logging.DEBUG)
# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

db = SQLAlchemy(app)

# Define models
class CardList(db.Model):
    __tablename__ = 'card_lists'
    id = db.Column(CHAR(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    items = relationship('CardListItem', back_populates='card_list', cascade="all, delete-orphan")

class CardListItem(db.Model):
    __tablename__ = 'card_list_items'
    list_id = db.Column(CHAR(36), db.ForeignKey('card_lists.id'), primary_key=True)
    card_id = db.Column(db.Text, db.ForeignKey('cards.id'), primary_key=True)
    card_list = relationship('CardList', back_populates='items')

def setup_db_events(app):
    @event.listens_for(db.engine, "engine_connect")
    def ping_connection(connection, branch):
        if branch:
            return  # Skip if this is a nested transaction or sub-connection

        save_should_close_with_result = connection.should_close_with_result
        connection.should_close_with_result = False

        try:
            connection.scalar(text("SELECT 1"))
        except Exception:
            app.logger.warning("Database connection failed. Invalidating connection.")
            connection.invalidate()
        finally:
            connection.should_close_with_result = save_should_close_with_result

# Global error handler for database errors
@app.errorhandler(SQLAlchemyError)
def handle_db_error(error):
    app.logger.error(f"Database error: {str(error)}")
    return jsonify({'error': 'An error occurred while processing your request.'}), 500

@app.errorhandler(OperationalError)
def handle_operational_error(error):
    app.logger.error(f"Database connection error: {str(error)}")
    return jsonify({'error': 'Database connection error. Please try again later.'}), 503

# API routes
@app.route('/api/card-list/<string:id>', methods=['GET'])
def get_card_list(id):
    try:
        result = db.session.execute(text("""
            SELECT cl.id, cl.name, c.*
            FROM card_lists cl
            LEFT JOIN card_list_items cli ON cl.id = cli.list_id
            LEFT JOIN cards c ON cli.card_id = c.id
            WHERE cl.id = :list_id
        """), {'list_id': id}).fetchall()

        if not result:
            return jsonify({'error': 'Card list not found'}), 404

        card_list = {
            'id': result[0].id,
            'name': result[0].name,
            'cards': []
        }

        for row in result:
            if row.card_id:
                card_list['cards'].append({
                    'id': row.card_id,
                    'name': row.name,
                    'set': row.set,
                    'set_name': row.set_name,
                    'image_uris': json.loads(row.image_uris) if row.image_uris else {},
                    'price': float(row.price) if row.price else 0,
                    'foil_price': float(row.foil_price) if row.foil_price else 0,
                    'collector_number': row.collector_number
                })

        return jsonify(card_list)
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error: {str(e)}")
        return jsonify({'error': 'An error occurred'}), 500

@app.route('/api/card-list/<string:id>', methods=['PATCH'])
def update_card_list_name(id):
    try:
        card_list = db.session.query(CardList).get(id)
        if not card_list:
            return jsonify({'error': 'Card list not found'}), 404

        data = request.json
        if 'name' in data:
            card_list.name = data['name']
            db.session.commit()
            return jsonify({'message': 'Card list name updated successfully'})
        return jsonify({'error': 'Name not provided'}), 400
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error: {str(e)}")
        return jsonify({'error': 'An error occurred'}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    app.logger.info("Upload request received")
    if 'file' not in request.files:
        app.logger.error("No file part in the request")
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        app.logger.error("No selected file")
        return jsonify({'error': 'No selected file'}), 400
    if file and file.filename.endswith('.csv'):
        try:
            filename = secure_filename(file.filename)
            file_path = os.path.join('/tmp', filename)
            file.save(file_path)
            app.logger.info(f"File saved to {file_path}")

            cards = process_csv(file_path)
            app.logger.info(f"Processed {len(cards)} cards from CSV")

            card_data = fetch_card_data(cards)
            app.logger.info(f"Fetched data for {len(card_data)} cards")

            list_id = str(uuid.uuid4())
            list_name = f"Card List {list_id[:8]}"
            new_list = CardList(id=list_id, name=list_name)
            db.session.add(new_list)
            app.logger.info(f"Created new CardList: {list_id}")

            for card_info in card_data:
                try:
                    card_list_item = CardListItem(list_id=list_id, card_id=card_info['id'])
                    db.session.add(card_list_item)
                except SQLAlchemyError as e:
                    app.logger.error(f"Error adding CardListItem: {str(e)}")
                    db.session.rollback()
                    return jsonify({'error': f'Error adding card to list: {str(e)}'}), 500

            try:
                db.session.commit()
                app.logger.info(f"Committed changes to database")
            except SQLAlchemyError as e:
                app.logger.error(f"Error committing to database: {str(e)}")
                db.session.rollback()
                return jsonify({'error': f'Error saving to database: {str(e)}'}), 500

            os.remove(file_path)
            app.logger.info(f"Temporary file {file_path} removed")

            return jsonify({
                'id': list_id,
                'name': list_name,
                'cards': card_data
            })
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Unexpected error during file upload: {str(e)}")
            return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

    app.logger.error("Invalid file type")
    return jsonify({'error': 'Invalid file type'}), 400

def process_csv(file_path):
    cards = []
    with open(file_path, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            name = row.get('name', '').strip()
            set_code = row.get('set', '').strip()
            if name and set_code:  # Only add cards with non-empty name and set
                cards.append({
                    'name': name,
                    'set': set_code,
                    'collector_number': row.get('collector_number', '').strip()
                })
    return cards

def fetch_card_data(cards):
    card_data = []
    for card in cards:
        try:
            response = requests.get(f"https://api.scryfall.com/cards/named?exact={card['name']}&set={card['set']}")
            response.raise_for_status()
            data = response.json()
            card_info = {
                'id': data['id'],
                'name': data['name'],
                'set': data['set'],
                'set_name': data['set_name'],
                'image_uris': data.get('image_uris', {}),
                'price': float(data['prices'].get('usd', 0)),
                'foil_price': float(data['prices'].get('usd_foil', 0)),
                'collector_number': data['collector_number']
            }
            card_data.append(card_info)
        except requests.RequestException as e:
            app.logger.error(f"Error fetching card data from Scryfall: {str(e)}")
            # Add a placeholder for the card that couldn't be fetched
            card_data.append({
                'id': f"error_{len(card_data)}",
                'name': card['name'],
                'set': card['set'],
                'set_name': 'Unknown',
                'image_uris': {},
                'price': 0,
                'foil_price': 0,
                'collector_number': card.get('collector_number', 'Unknown')
            })
    return card_data

@app.route('/api/health', methods=['GET'])
def health_check():
    # Check database connection
    try:
        db.session.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        app.logger.error(f"Database health check failed: {str(e)}")
        db_status = "unhealthy"

    return jsonify({
        'status': 'healthy' if db_status == "healthy" else "unhealthy",
        'database': db_status
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        setup_db_events(app)
    app.run(debug=True)
