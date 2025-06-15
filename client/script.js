document.addEventListener('DOMContentLoaded', function() {
	const animalTypeSelect = document.getElementById('animal-type');
	const getAnimalsBtn = document.getElementById('get-animals');
	const getFactsBtn = document.getElementById('get-facts');
	const animalContainer = document.getElementById('animal-container');
	const newsContainer = document.getElementById('news-container');
	const loadingElement = document.getElementById('loading');
	const authForms = document.getElementById('auth-forms');
	const loginForm = document.getElementById('login-form');
	const registerForm = document.getElementById('register-form');
    
    let authToken = localStorage.getItem('authToken') || '';
    let currentUser = null;

    async function checkAuth() {
        if (!authToken) return false;
        
        try 
		{
            const response = await fetch('/api/auth/profile', {headers: {'Authorization': `Bearer ${authToken}`}});
            
            if (!response.ok) throw new Error('Invalid token');
            
            currentUser = await response.json();
            updateAuthUI();
            return true;
        } 
		catch (error) 
		{
            console.error('Auth check failed:', error);
            clearAuth();
            return false;
        }
    }

    function clearAuth() {
        localStorage.removeItem('authToken');
        authToken = '';
        currentUser = null;
        updateAuthUI();
    }

    function updateAuthUI() {
        const logoutButton = document.getElementById('logout-button');
        const loginButton = document.getElementById('login-button');
        const registerButton = document.getElementById('register-button');
        
        if (authToken) 
		{
            logoutButton.style.display = 'block';
            loginButton.disabled = true;
            registerButton.disabled = true;
        } 
		else 
		{
            if (logoutButton) logoutButton.style.display = 'none';
            if (loginButton) loginButton.disabled = false;
            if (registerButton) registerButton.disabled = false;
        }
    }

    async function handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try
		{
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email, password })
            });

            if (!response.ok)
			{
                const error = await response.json();
                throw new Error(error.message || 'Ошибка входа');
            }

            const data = await response.json();
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            await checkAuth();
            alert('Вход выполнен успешно!');
        } 
		catch (error) 
		{
            alert(erro
			r.message || 'Ошибка входа');
            console.error('Login error:', error);
        }
    }

	async function handleRegister() {
		const username = document.getElementById('register-username').value.trim();
		const email = document.getElementById('register-email').value.trim();
		const password = document.getElementById('register-password').value.trim();
		
		if (!username || !email || !password) 
		{
			alert('Все поля обязательны для заполнения');
			return;
		}

		try
		{
			const registerButton = document.getElementById('register-button');
			registerButton.disabled = true;
			registerButton.textContent = 'Регистрация...';

			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({username, email, password})
			});

			const data = await response.json();

			if (!response.ok) 
			{
				throw new Error(data.message || data.error || 'Ошибка регистрации');
			}

			authToken = data.token;
			localStorage.setItem('authToken', authToken);
			
			document.getElementById('register-username').value = '';
			document.getElementById('register-email').value = '';
			document.getElementById('register-password').value = '';
			
			alert('Регистрация успешна! Теперь вы можете войти.');
			document.getElementById('show-login').click();
			
		} 
		catch (error) 
		{
			console.error('Registration error:', error);
			alert(error.message || 'Ошибка регистрации. Пожалуйста, попробуйте другой email или имя пользователя.');
		} 
		finally 
		{
			const registerButton = document.getElementById('register-button');
			if (registerButton) 
			{
				registerButton.disabled = false;
				registerButton.textContent = 'Зарегистрироваться';
			}
		}
	}

    function handleLogout() {
        clearAuth();
        alert('Вы вышли из системы');
    }

    async function loadAnimalImages(animalType) {
        loadingElement.style.display = 'block';
        animalContainer.innerHTML = '';
        
        try 
		{
            const response = await fetch(`/api/animals/${animalType}`);
            if (!response.ok) throw new Error('Failed to fetch animals');
            
            const animals = await response.json();
            animals.forEach((animal, index) => {createAnimalCard(animal, animalType, index); loadAnimalFact(animalType, index);});
        } 
		catch (error) 
		{
            console.error('Ошибка при загрузке животных:', error);
            animalContainer.innerHTML = '<p>Произошла ошибка при загрузке животных</p>';
        } 
		finally 
		{
            loadingElement.style.display = 'none';
        }
    }

    function createAnimalCard(animal, animalType, index) {
        const animalCard = document.createElement('div');
        animalCard.className = 'animal-card';
        
        animalCard.innerHTML = `
            <img src="${animal.url}" alt="${animalType}" class="animal-image">
            <div class="animal-info">
                <div class="animal-fact" id="fact-${index}">Загрузка факта...</div>
                <div class="animal-actions">
                    <button class="like-button" data-id="${animal.id}">
                        <span class="like-icon">❤</span> Нравится
                    </button>
                    <button class="share-button">Поделиться</button>
                </div>
            </div>
        `;
        
        animalContainer.appendChild(animalCard);
        
        const likeButton = animalCard.querySelector('.like-button');
        const shareButton = animalCard.querySelector('.share-button');
        
        likeButton.addEventListener('click', () => toggleLike(animal.id, likeButton));
        shareButton.addEventListener('click', () => shareAnimal(animal, animalType, index));
    }

    async function loadAnimalFact(animalType, index) {
        try 
		{
            const response = await fetch(`/api/animals/${animalType}/facts`);
            if (!response.ok) throw new Error('Failed to fetch fact');
            
            const factData = await response.json();
            const factElement = document.getElementById(`fact-${index}`);
            
            if (factElement && factData.fact) 
			{
                factElement.textContent = factData.fact;
            }
        } 
		catch (error) 
		{
            console.error('Ошибка при загрузке факта:', error);
            const factElement = document.getElementById(`fact-${index}`);
            if (factElement)
			{
                factElement.textContent = 'Не удалось загрузить факт';
            }
        }
    }

    async function toggleLike(animalId, button) {
        if (!authToken) 
		{
            alert('Для добавления лайка необходимо войти в систему');
            return;
        }
        
        try 
		{
            const isLiked = button.classList.contains('liked');
            
            if (isLiked) 
			{
                await fetch(`/api/likes/animal/${animalId}`, {
                    method: 'DELETE',
                    headers: {'Authorization': `Bearer ${authToken}`}
                });
                button.classList.remove('liked');
                button.innerHTML = '<span class="like-icon">❤</span> Нравится';
            } 
			else 
			{
                await fetch('/api/likes', {
                    method: 'POST',
                    headers: {'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json'},
                    body: JSON.stringify({ animal_id: animalId })
                });
                button.classList.add('liked');
                button.innerHTML = '<span class="like-icon">❤</span> Убрать лайк';
            }
        } 
		catch (error) 
		{
            console.error('Like error:', error);
            alert('Ошибка при обработке лайка');
        }
    }

	async function shareAnimal(animal, animalType, index) {
		if (!authToken) 
		{
			alert('Для публикации необходимо войти в систему');
			return;
		}

		const factElement = document.getElementById(`fact-${index}`);
		const factText = factElement?.textContent || 'Интересный факт';
		
		try
		{
			const response = await fetch('/api/posts', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${authToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					animal_id: animal.id,
					fact_text: factText
				})
			});

			if (!response.ok) 
			{
				const error = await response.json();
				throw new Error(error.error || 'Ошибка публикации');
			}

			const post = await response.json();
			addNewsItem(post);
			alert('Публикация успешно создана!');
		} 
		catch (error) 
		{
			console.error('Ошибка при публикации:', error);
			alert(error.message || 'Ошибка при публикации');
		}
	}
	
	function addNewsItem(post) {
		const newsItem = document.createElement('div');
		newsItem.className = 'news-item';
		newsItem.dataset.id = post.id;
		newsItem.innerHTML = `
			<p><strong>Публикация от ${post.username} о ${getAnimalName(post.type)}</strong></p>
			<img src="${post.url}" alt="${post.type}">
			<p>${post.fact_text}</p>
			<p><small>${new Date(post.created_at).toLocaleString()}</small></p>
			${currentUser && currentUser.id === post.user_id ? 
				'<button class="delete-post">Удалить</button>' : ''}
		`;
		
		newsContainer.prepend(newsItem);
		
		if (currentUser && currentUser.id === post.user_id)
		{
			newsItem.querySelector('.delete-post').addEventListener('click', () => deletePost(post.id));
		}
		
		if (newsContainer.children.length > 10) 
		{
			newsContainer.removeChild(newsContainer.lastChild);
		}
	}

	async function deletePost(postId) {
		if (!confirm('Вы уверены, что хотите удалить эту публикацию?')) return;
		
		try 
		{
			const response = await fetch(`/api/posts/${postId}`, {
				method: 'DELETE',
				headers: {'Authorization': `Bearer ${authToken}`}
			});

			if (!response.ok) throw new Error('Ошибка удаления');
			
			document.querySelector(`.news-item[data-id="${postId}"]`)?.remove();
			alert('Публикация удалена');
		} 
		catch (error) 
		{
			console.error('Ошибка при удалении:', error);
			alert(error.message || 'Ошибка при удалении');
		}
	}

	async function loadPosts() {
		try 
		{
			const response = await fetch('/api/posts');
			if (!response.ok) throw new Error('Ошибка загрузки');
			
			const data = await response.json();
			data.posts.forEach(post => addNewsItem(post));
		} 
		catch (error) 
		{
			console.error('Ошибка загрузки публикаций:', error);
		}
	}


    function getAnimalName(animalType) {
        const names = {
            dog: 'собаках',
            cat: 'кошках',
            bird: 'птицах'
        };
        return names[animalType] || 'животных';
    }

    function init() {
        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Выйти';
        logoutButton.id = 'logout-button';
        logoutButton.addEventListener('click', handleLogout);
        authForms.appendChild(logoutButton);

        document.getElementById('login-button').addEventListener('click', handleLogin);
        document.getElementById('register-button').addEventListener('click', handleRegister);
        document.getElementById('show-register').addEventListener('click', () => {loginForm.style.display = 'none'; registerForm.style.display = 'block';});
        document.getElementById('show-login').addEventListener('click', () => {registerForm.style.display = 'none'; loginForm.style.display = 'block';});

        getAnimalsBtn.addEventListener('click', () => {const animalType = animalTypeSelect.value; animalType ? loadAnimalImages(animalType) : alert('Выберите тип животного');});
        
        getFactsBtn.addEventListener('click', () => {
            const animalType = animalTypeSelect.value;
            if (animalType)
			{
                document.querySelectorAll('.animal-fact').forEach((el, index) => {loadAnimalFact(animalType, index);});
            } else 
			{
                alert('Выберите тип животного');
            }
        });

        loadAnimalImages('cat');
        animalTypeSelect.value = 'cat';
        checkAuth();
    }

    init();
});