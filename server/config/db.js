	// server/config/db.js
	const { Pool } = require('pg');

	const pool = new Pool({
	  user: process.env.DB_USER || 'animal_user',
	  host: process.env.DB_HOST || 'localhost',
	  database: process.env.DB_NAME || 'animal_platform',
	  password: process.env.DB_PASSWORD || 'animal_password',
	  port: process.env.DB_PORT || 5432,
	});

	if (process.env.NODE_ENV !== 'production') 
	{
	  pool.on('connect', (client) => {console.log('Connected to database');});

	  pool.on('error', (err) => {console.error('Database error:', err);});
	}

	module.exports = {
	  query: (text, params) => {
		console.log('Executing query:', text);
		return pool.query(text, params);
	  }
	};