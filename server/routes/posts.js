	const express = require('express');
	const router = express.Router();
	const db = require('../config/db');
	const authenticateToken = require('../middlewares/auth');
	const { check, validationResult } = require('express-validator');

	const createPostValidations = [
		check('animal_id').isInt().withMessage('Некорректный ID животного'),
		check('fact_text').isLength({ min: 10, max: 500 }).withMessage('Факт должен содержать от 10 до 500 символов')
	];

	router.post('/', authenticateToken, createPostValidations, async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) 
		{
			return res.status(400).json({ errors: errors.array() });
		}

		try 
		{
			const { animal_id, fact_text } = req.body;
			const user_id = req.user.userId;

			const animalExists = await db.query('SELECT id FROM animals WHERE id = $1', [animal_id]);
			
			if (animalExists.rows.length === 0) 
			{
				return res.status(404).json({ error: 'Животное не найдено' });
			}

			const newPost = await db.query(`INSERT INTO posts (user_id, animal_id, fact_text) VALUES ($1, $2, $3) RETURNING *`,[user_id, animal_id, fact_text]);

			const result = await db.query(
				`SELECT posts.*, users.username, animals.url, animals.type 
				 FROM posts
				 JOIN users ON posts.user_id = users.id
				 JOIN animals ON posts.animal_id = animals.id
				 WHERE posts.id = $1`,
				[newPost.rows[0].id]
			);

			res.status(201).json(result.rows[0]);
		} 
		catch (error) 
		{
			console.error('Error creating post:', error);
			res.status(500).json({error: 'Ошибка при создании публикации', details: process.env.NODE_ENV !== 'production' ? error.message : undefined});
		}
	});

	router.get('/', [check('page').optional().isInt({ min: 1 }).toInt(), check('limit').optional().isInt({ min: 1, max: 50 }).toInt()], async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) 
		{
			return res.status(400).json({ errors: errors.array() });
		}

		try 
		{
			const page = req.query.page || 1;
			const limit = req.query.limit || 10;
			const offset = (page - 1) * limit;

			const result = await db.query(
				`SELECT posts.*, users.username, animals.url, animals.type 
				 FROM posts
				 JOIN users ON posts.user_id = users.id
				 JOIN animals ON posts.animal_id = animals.id
				 ORDER BY posts.created_at DESC
				 LIMIT $1 OFFSET $2`,
				[limit, offset]
			);

			const countResult = await db.query('SELECT COUNT(*) FROM posts');
			const total = parseInt(countResult.rows[0].count);

			res.json({
				posts: result.rows,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit)
				}
			});
		} 
		catch (error) 
		{
			console.error('Error fetching posts:', error);
			res.status(500).json({error: 'Ошибка при получении публикаций', details: process.env.NODE_ENV !== 'production' ? error.message : undefined});
		}
	});

	router.delete('/:id', authenticateToken, async (req, res) => {
		try 
		{
			const { id } = req.params;
			const user_id = req.user.userId;

			const post = await db.query('SELECT * FROM posts WHERE id = $1 AND user_id = $2', [id, user_id]);

			if (post.rows.length === 0) 
			{
				return res.status(404).json({ error: 'Публикация не найдена или у вас нет прав' });
			}

			await db.query('DELETE FROM posts WHERE id = $1', [id]);
			res.json({ success: true });
		} 
		catch (error) 
		{
			console.error('Error deleting post:', error);
			res.status(500).json({error: 'Ошибка при удалении публикации', details: process.env.NODE_ENV !== 'production' ? error.message : undefined});
		}
	});

	module.exports = router;