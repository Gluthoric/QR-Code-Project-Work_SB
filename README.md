# MTG Card Uploader

This project is a Magic: The Gathering card uploader and viewer that uses a local PostgreSQL database.

## Setup

1. Ensure you have PostgreSQL installed and running on your local machine.

2. Create a new database for this project:
   ```
   createdb mtg_collection_kiosk
   ```

3. Run the setup SQL script to create the necessary table:
   ```
   psql -d mtg_collection_kiosk -f setup.sql
   ```

4. Install the project dependencies:
   ```
   npm install
   ```

5. Create a `.env` file in the root of the project with the following content:
   ```
   VITE_DATABASE_URI=postgresql://gluth:Caprisun1!@192.168.1.126:5432/mtg_collection_kiosk
   ```
   Replace the URI with your actual PostgreSQL connection string.

## Running the Project

To start the development server:

```
npm run dev
```

Then open your browser and navigate to `http://localhost:5173` (or the port specified in the console output).

## Important Note

This project currently accesses the PostgreSQL database directly from the frontend. This is not recommended for production use due to security concerns. In a real-world scenario, you should create a backend API to handle database operations.

## Future Improvements

1. Create a backend API to handle database operations.
2. Implement user authentication and authorization.
3. Add more robust error handling and data validation.
