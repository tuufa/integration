	require('dotenv').config();

	const express = require('express');
	const cors = require('cors');
	const path = require('path');
	const db = require('./config/db');
	const authRoutes = require('./routes/auth');
	const animalRoutes = require('./routes/animals');
	const likeRoutes = require('./routes/likes');
	const postRoutes = require('./routes/posts');

	const app = express();

	const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
	for (const envVar of requiredEnvVars) 
	{
	  if (!process.env[envVar]) 
	  {
		console.error(`Отсутствует обязательная переменная окружения: ${envVar}`);
		process.exit(1);
	  }
	}

	const PORT = process.env.PORT || 5000;
	const CLIENT_PATH = path.join(__dirname, '../client');

	app.use(cors({origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST', 'PUT', 'DELETE']}));
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	(async () => {
	  try 
	  {
		console.log('Проверка подключения к БД...');
		await db.query('SELECT NOW()');
		console.log('Database connected successfully');
	  } 
	  catch (err) 
	  {
		console.error('Database connection error:', err.message);
		process.exit(1);
	  }
	})();

	app.use('/api/auth', authRoutes);
	app.use('/api/animals', animalRoutes);
	app.use('/api/likes', likeRoutes);
	app.use('/api/posts', postRoutes);

	app.use(express.static(CLIENT_PATH));

	app.get('*', (req, res) => {res.sendFile(path.join(CLIENT_PATH, 'index.html'));});

	app.use((err, req, res, next) => {
	  console.error('Server error:', err.message);
	  
	  if (err.name === 'ValidationError') 
	  {
		return res.status(400).json({error: 'Validation Error', details: err.errors});
	  }
	  
	  if (err.name === 'JsonWebTokenError') 
	  {
		return res.status(401).json({ error: 'Invalid token' });
	  }
	  
	  res.status(500).json({error: 'Internal Server Error', message: err.message });
	});

	app.listen(PORT, () => {
	  console.log(`Server running on port ${PORT}`);
	  console.log(`Serving static files from ${CLIENT_PATH}`);
	});