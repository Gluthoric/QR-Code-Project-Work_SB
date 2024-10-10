# Card List Manager

This Flask application manages card lists and interacts with the Scryfall API to fetch card data.

## Setup

1. Ensure you have Python 3.7+ installed.
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Set up your `.env.flask` file with the following variables:
   ```
   DATABASE_URI=your_database_uri
   SECRET_KEY=your_secret_key
   REDIS_HOST=your_redis_host
   REDIS_PORT=your_redis_port
   REDIS_DB=your_redis_db
   ```

## Running the Application

1. Start your Redis server.
2. Ensure your database server is running and accessible.
3. Run the Flask application:
   ```
   python main.py
   ```

## Testing the Application

1. Test the health check endpoint:
   ```
   curl http://localhost:5000/api/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "database": "healthy",
     "redis": "healthy"
   }
   ```

2. Test the Redis connection:
   ```
   curl http://localhost:5000/api/redis-test
   ```
   Expected response: `{"redis_value":"Hello from Redis!"}`

3. Upload a CSV file:
   ```
   curl -X POST -F "file=@path/to/your/file.csv" http://localhost:5000/api/upload
   ```
   This should return a JSON response with the new card list ID, name, and card data.

4. Get a card list:
   ```
   curl http://localhost:5000/api/card-list/<list_id>
   ```
   Replace `<list_id>` with an ID returned from the upload step.

5. Update a card list name:
   ```
   curl -X PATCH -H "Content-Type: application/json" -d '{"name":"New List Name"}' http://localhost:5000/api/card-list/<list_id>
   ```
   Replace `<list_id>` with an existing list ID.

## Troubleshooting

If you encounter any issues:

1. Check that your database and Redis server are running and accessible.
2. Verify that your `.env.flask` file contains the correct configuration.
3. Check the application logs for any error messages.
4. Ensure that the 'cards' table exists in your database and has the correct schema.

If problems persist, please open an issue in the project repository.

## Recent Updates

- Improved database connection handling and transaction management.
- Enhanced error logging and reporting.
- Updated health check endpoint to provide more detailed status information.

## Notes for Developers

- The application now uses SQLAlchemy's scoped session to manage database connections.
- Each route handler is responsible for removing the session after use.
- The `setup_db_events` function includes improved connection ping and invalidation logic.
- Error handling has been enhanced throughout the application.

When making changes to the application, please ensure that you maintain proper session management and error handling practices.
