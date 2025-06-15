	const express = require('express');
	const router = express.Router();
	const db = require('../config/db');
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

	router.use(authenticateToken);

	router.get('/user/:userId', async (req, res) => {
		try 
		{
			if (req.user.userId !== parseInt(req.params.userId)) 
			{
				return res.status(403).json({ error: 'Нет доступа к чужим лайкам' });
			}

			const result = await db.query(
				`SELECT likes.*, animals.type, animals.url 
				 FROM likes 
				 JOIN animals ON likes.animal_id = animals.id
				 WHERE likes.user_id = $1
				 ORDER BY likes.created_at DESC`,
				[req.user.userId]
			);

			res.json(result.rows);
		} 
		catch (error) 
		{
			console.error('Error fetching user likes:', error);
			res.status(500).json({ error: 'Ошибка при получении лайков' });
		}
	});

	router.post('/', async (req, res) => {
		try 
		{
			const { animal_id } = req.body;
			const user_id = req.user.userId;

			const animalExists = await db.query('SELECT id FROM animals WHERE id = $1',[animal_id]);
			
			if (animalExists.rows.length === 0) 
			{
				return res.status(404).json({ error: 'Животное не найдено' });
			}

			const existingLike = await db.query('SELECT id FROM likes WHERE user_id = $1 AND animal_id = $2', [user_id, animal_id]);
			
			if (existingLike.rows.length > 0) 
			{
				return res.status(400).json({ error: 'Вы уже лайкали это животное' });
			}

			const newLike = await db.query(`INSERT INTO likes (user_id, animal_id) VALUES ($1, $2) RETURNING *`, [user_id, animal_id]);

			res.status(201).json(newLike.rows[0]);
		} 
		catch (error) 
		{
			console.error('Error adding like:', error);
			res.status(500).json({ error: 'Ошибка при добавлении лайка' });
		}
	});

	router.delete('/animal/:animalId', async (req, res) => {
		try 
		{
			const { animalId } = req.params;
			const user_id = req.user.userId;

			const result = await db.query('DELETE FROM likes WHERE animal_id = $1 AND user_id = $2 RETURNING *', [animalId, user_id]);

			if (result.rows.length === 0) 
			{
				return res.status(404).json({error: 'Лайк не найден или у вас нет прав на его удаление'});
			}

			res.json({ success: true, deletedLike: result.rows[0] });
		} 
		catch (error) 
		{
			console.error('Error removing like:', error);
			res.status(500).json({ error: 'Ошибка при удалении лайка' });
		}
	});

	router.get('/animal/:animalId/count', async (req, res) => {
		try 
		{
			const { animalId } = req.params;

			const result = await db.query('SELECT COUNT(*) FROM likes WHERE animal_id = $1', [animalId]);

			res.json({ count: parseInt(result.rows[0].count) });
		} 
		catch (error) 
		{
			console.error('Error counting likes:', error);
			res.status(500).json({ error: 'Ошибка при подсчете лайков' });
		}
	});

	router.get('/check', async (req, res) => {
		try 
		{
			const { animal_id } = req.query;
			const user_id = req.user.userId;

			const result = await db.query('SELECT id FROM likes WHERE user_id = $1 AND animal_id = $2', [user_id, animal_id]);

			res.json({ liked: result.rows.length > 0 });
		} 
		catch (error)
		{
			console.error('Error checking like:', error);
			res.status(500).json({ error: 'Ошибка при проверке лайка' });
		}
	});

	module.exports = router;