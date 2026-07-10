import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql';
import util from 'util';

// Retrieve environment variables
const { BASE_URL, LOCALHOST_PASSWORD, LOCALHOST_DB, DB_USER, NODE_ENV } = process.env;

// Debug log — remove after confirming it works
console.log('DB Config:', { NODE_ENV, BASE_URL, DB_USER, LOCALHOST_DB, LOCALHOST_PASSWORD: LOCALHOST_PASSWORD ? '***set***' : '❌ MISSING' });

const connectionPoolConfig = {
  development: {
    connectionLimit: 10,
    host: BASE_URL,
    user: DB_USER,
    password: LOCALHOST_PASSWORD,
    database: LOCALHOST_DB,
  },
  production: {
    connectionLimit: 10,
    host: BASE_URL,
    user: DB_USER,
    password: LOCALHOST_PASSWORD,
    database: LOCALHOST_DB,
  },
};

// Determine the current environment, fallback to 'development'
const environment = NODE_ENV && connectionPoolConfig[NODE_ENV] ? NODE_ENV : 'development';

console.log('Using environment:', environment);

// Create the connection pool
const connectionPool = mysql.createPool(connectionPoolConfig[environment]);

// Promisify the query function
connectionPool.query = util.promisify(connectionPool.query);

// Export the connection pool
export default connectionPool;