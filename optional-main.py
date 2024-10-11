from flask import Flask, jsonify, request, render_template_string
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
import qrcode
from io import BytesIO
import base64

# Load environment variables from .env.flask
load_dotenv('.env.flask')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
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
    card_id = db.Column(db.Text, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    set_code = db.Column(db.String(10), nullable=False)
    set_name = db.Column(db.String(255), nullable=False)
    collector_number = db.Column(db.String(20), nullable=False)
    image_uris = db.Column(db.JSON)
    price = db.Column(db.Numeric(10, 2))
    foil_price = db.Column(db.Numeric(10, 2))
    quantity = db.Column(db.Integer, default=1)
    card_list = relationship('CardList', back_populates='items')

def setup_db_events(app):
    @event.listens_for(db.engine, "engine_connect")
    def ping_connection(connection, branch):
        if branch:
            return

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
        card_list = CardList.query.get(id)
        if not card_list:
            return jsonify({'error': 'Card list not found'}), 404

        cards = []
        for item in card_list.items:
            cards.append({
                'id': item.card_id,
                'name': item.name,
                'set': item.set_code,
                'set_name': item.set_name,
                'image_uris': json.loads(item.image_uris) if item.image_uris else {},
                'price': float(item.price) if item.price else 0,
                'foil_price': float(item.foil_price) if item.foil_price else 0,
                'collector_number': item.collector_number,
                'quantity': item.quantity
            })

        return jsonify({
            'id': card_list.id,
            'name': card_list.name,
            'cards': cards
        })
    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return jsonify({'error': 'An error occurred'}), 500

@app.route('/card-list/<string:id>', methods=['GET'])
def view_card_list(id):
    try:
        card_list = CardList.query.get(id)
        if not card_list:
            return "Card list not found", 404

        cards = []
        for item in card_list.items:
            cards.append({
                'name': item.name,
                'set': item.set_code,
                'quantity': item.quantity,
                'price': float(item.price) if item.price else 0,
            })

        html_template = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{ list_name }}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>{{ list_name }}</h1>
            <table>
                <tr>
                    <th>Name</th>
                    <th>Set</th>
                    <th>Quantity</th>
                    <th>Price</th>
                </tr>
                {% for card in cards %}
                <tr>
                    <td>{{ card.name }}</td>
                    <td>{{ card.set }}</td>
                    <td>{{ card.quantity }}</td>
                    <td>${{ "%.2f"|format(card.price) }}</td>
                </tr>
                {% endfor %}
            </table>
        </body>
        </html>
        """

        return render_template_string(html_template, list_name=card_list.name, cards=cards)
    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return "An error occurred", 500

@app.route('/api/card-list/<string:id>/qr', methods=['GET'])
def get_card_list_qr(id):
    try:
        card_list = CardList.query.get(id)
        if not card_list:
            return jsonify({'error': 'Card list not found'}), 404

        # Generate the URL for the card list
        list_url = request.host_url + f"card-list/{id}"

        # Create QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(list_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        # Save QR code to a BytesIO object
        buffered = BytesIO()
        img.save(buffered)
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return jsonify({
            'qr_code': img_str,
            'url': list_url
        })
    except Exception as e:
        app.logger.error(f"Error generating QR code: {str(e)}")
        return jsonify({'error': 'An error occurred while generating the QR code'}), 500

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
    app.logger.debug(f"Request files: {request.files}")
    app.logger.debug(f"Request form: {request.form}")

    if 'file' not in request.files:
        app.logger.error("No file part in the request")
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    app.logger.info(f"File received: {file.filename}")

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
                    existing_item = CardListItem.query.filter_by(list_id=list_id, card_id=card_info['id']).first()
                    if existing_item:
                        existing_item.quantity += 1
                    else:
                        card_list_item = CardListItem(
                            list_id=list_id,
                            card_id=card_info['id'],
                            name=card_info['name'],
                            set_code=card_info['set'],
                            set_name=card_info['set_name'],
                            collector_number=card_info['collector_number'],
                            image_uris=json.dumps(card_info['image_uris']),
                            price=card_info['price'],
                            foil_price=card_info['foil_price'],
                            quantity=1
                        )
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
            app.logger.exception("Full traceback:")
            return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

    app.logger.error("Invalid file type")
    return jsonify({'error': 'Invalid file type'}), 400

def process_csv(file_path):
    cards = []
    app.logger.info(f"Starting to process CSV file: {file_path}")
    try:
        with open(file_path, 'r') as csvfile:
            reader = csv.DictReader(csvfile)
            app.logger.info(f"CSV headers: {reader.fieldnames}")
            headers = {h.lower(): h for h in reader.fieldnames}
            for row_num, row in enumerate(reader, start=1):
                app.logger.debug(f"Processing row {row_num}: {row}")
                name = row.get(headers.get('name', 'Name'), '').strip()
                set_code = row.get(headers.get('set', 'Set'), '').strip()
                if name and set_code:
                    cards.append({
                        'name': name,
                        'set': set_code,
                        'collector_number': row.get(headers.get('collector number', 'Collector Number'), '').strip()
                    })
                    app.logger.debug(f"Processed row {row_num}: {name} ({set_code})")
                else:
                    app.logger.warning(f"Skipping row {row_num} due to missing name or set: {row}")
    except Exception as e:
        app.logger.error(f"Error processing CSV file: {str(e)}")
        app.logger.exception("Full traceback:")
        raise

    app.logger.info(f"Finished processing CSV. Total cards processed: {len(cards)}")
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
                'price': float(data['prices'].get('usd') or 0),
                'foil_price': float(data['prices'].get('usd_foil') or 0),
                'collector_number': data['collector_number'],
                'quantity': 1  # Default quantity
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
                'collector_number': card.get('collector_number', 'Unknown'),
                'quantity': 1  # Default quantity
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
        # Ensure the 'name' and 'quantity' columns exist in the card_list_items table
        with db.engine.connect() as connection:
            connection.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT FROM information_schema.columns
                        WHERE table_name = 'card_list_items' AND column_name = 'name'
                    ) THEN
                        ALTER TABLE card_list_items
                        ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '';
                    END IF;

                    IF NOT EXISTS (
                        SELECT FROM information_schema.columns
                        WHERE table_name = 'card_list_items' AND column_name = 'quantity'
                    ) THEN
                        ALTER TABLE card_list_items
                        ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
                    END IF;
                END $$;
            """))
        setup_db_events(app)
    app.run(host='0.0.0.0', port=5000, debug=True)
