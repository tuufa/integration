	const express = require('express');
	const router = express.Router();
	const db = require('../config/db');
	const axios = require('axios');
	const { check, validationResult } = require('express-validator');
	const jwt = require('jsonwebtoken');

	const authenticateToken = (req, res, next) => {
		const authHeader = req.headers['authorization'];
		const token = authHeader && authHeader.split(' ')[1];

		if (!token) 
		{
			return res.status(401).json({ error: 'Требуется авторизация' });
		}

		jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
			if (err) 
			{
				return res.status(403).json({ error: 'Неверный или просроченный токен' });
			}
			req.user = user;
			next();
		});
	};

	const EXTERNAL_APIS = {
		dog: 'https://api.thedogapi.com/v1/images/search',
		cat: 'https://api.thecatapi.com/v1/images/search',
		bird: 'https://shibe.online/api/birds'
	};

	router.get('/:type', [check('type').isIn(['dog', 'cat', 'bird']).withMessage('Недопустимый тип животного')], async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) 
		{
			return res.status(400).json({ errors: errors.array() });
		}

		const { type } = req.params;
		
		try 
		{
			const dbAnimals = await db.query('SELECT * FROM animals WHERE type = $1 ORDER BY created_at DESC LIMIT 6', [type]);

			if (dbAnimals.rows.length < 6) 
			{
				const apiUrl = EXTERNAL_APIS[type];
				const { data: externalAnimals } = await axios.get(apiUrl, {params: { limit: 6 - dbAnimals.rows.length }});

				for (const animal of externalAnimals) 
				{
					const url = animal.url || animal.link || animal[0]; 
					await db.query('INSERT INTO animals (type, url, api_id) VALUES ($1, $2, $3)', [type, url, animal.id || url]);
				}
			}

			const finalResult = await db.query('SELECT * FROM animals WHERE type = $1 ORDER BY created_at DESC LIMIT 6', [type]);

			res.json(finalResult.rows);
			
		} 
		catch (error) 
		{
			console.error('Error fetching animals:', error);
			res.status(500).json({error: 'Ошибка при получении животных', details: process.env.NODE_ENV === 'development' ? error.message : undefined});
		}
	});

	router.get('/:type/facts', async (req, res) => {
		try 
		{
			const { type } = req.params;
			let fact;

			switch (type) 
			{
				case 'dog':
					const dogFact = await axios.get('https://dog-api.kinduff.com/api/facts');
					fact = dogFact.data.facts[0];
					break;
				case 'cat':
					const catFact = await axios.get('https://catfact.ninja/fact');
					fact = catFact.data.fact;
					break;
				case 'bird':
					const birdFact = await axios.get('https://uselessfacts.jsph.pl/random.json?language=ru');
					fact = birdFact.data.text;
					break;
				default:
					return res.status(400).json({ error: 'Недопустимый тип животного' });
			}

			res.json({ fact });
			
		} 
		catch (error) 
		{
			console.error('Error fetching fact:', error);
			res.status(500).json({error: 'Ошибка при получении факта', details: process.env.NODE_ENV === 'development' ? error.message : undefined});
		}
	});

	module.exports = router;