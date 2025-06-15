	// server/routes/auth.js
	const express = require('express');
	const router = express.Router();
	const db = require('../config/db');
	const bcrypt = require('bcryptjs');
	const jwt = require('jsonwebtoken');

	const JWT_SECRET = process.env.JWT_SECRET;
	const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '1h';

	const authenticateToken = (req, res, next) => {
	  const authHeader = req.headers['authorization'];
	  const token = authHeader && authHeader.split(' ')[1];
	  
	  if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

	  jwt.verify(token, JWT_SECRET, (err, user) => {if (err) return res.status(403).json({ error: 'Неверный токен' }); req.user = user; next();});
	};

	router.get('/profile', authenticateToken, async (req, res) => {
	  try 
	  {
		const result = await db.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [req.user.userId]);
		
		if (result.rows.length === 0) 
		{
		  return res.status(404).json({ error: 'Пользователь не найден' });
		}
		
		res.json(result.rows[0]);
	  } 
	  catch (error) 
	  {
		console.error('Profile error:', error);
		res.status(500).json({error: 'Ошибка при получении профиля', ...(process.env.NODE_ENV !== 'production' && { details: error.message })});
	  }
	});

	router.post('/register', async (req, res) => {
	  try 
	  {
		const { username, email, password } = req.body;

		if (!username || !email || !password) 
		{
		  return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
		}

		const passwordHash = await bcrypt.hash(password, 10);
		
		const result = await db.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',[username, email, passwordHash]);

		const token = jwt.sign({ userId: result.rows[0].id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

		res.status(201).json({user: result.rows[0], token});
	  } 
	  catch (error) 
	  {
		console.error('Registration error:', {message: error.message, code: error.code, stack: error.stack});
		
		if (error.code === '23505') 
		{
		  return res.status(400).json({ error: 'Пользователь с таким email или логином уже существует' });
		}
		
		res.status(500).json({error: 'Ошибка при регистрации', details: process.env.NODE_ENV === 'development' ? error.message : undefined});
	  }
	});

	router.post('/login', async (req, res) => {
	  try 
	  {
		const { email, password } = req.body;

		if (!email || !password) 
		{
		  return res.status(400).json({ error: 'Email и пароль обязательны' });
		}

		const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
		
		if (userResult.rows.length === 0) 
		{
		  return res.status(401).json({ error: 'Неверные учетные данные' });
		}
		
		const user = userResult.rows[0];
		
		const isMatch = await bcrypt.compare(password, user.password_hash);
		if (!isMatch)
		{
		  return res.status(401).json({ error: 'Неверные учетные данные' });
		}
		
		const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
		
		res.json({
		  user: {
			id: user.id,
			username: user.username,
			email: user.email,
			created_at: user.created_at
		  },
		  token
		});
		
	  } 
	  catch (error) 
	  {
		console.error('Login error:', error);
		res.status(500).json({error: 'Ошибка при входе в систему', details: process.env.NODE_ENV === 'development' ? error.message : undefined});
	  }
	});

	module.exports = router;