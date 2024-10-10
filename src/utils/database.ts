import { Pool } from 'pg';

// Note: This is not a recommended approach for production applications.
// Ideally, database operations should be handled by a separate backend service.
const pool = new Pool({
  connectionString: import.meta.env.VITE_DATABASE_URI,
});

export const query = (text: string, params: any[]) => pool.query(text, params);

export const getClient = () => pool.connect();

console.warn('Warning: Direct database access from the frontend is not recommended for production use.');
