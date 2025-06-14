document.addEventListener('DOMContentLoaded', function() {
    const animalTypeSelect = document.getElementById('animal-type');
    const getAnimalsBtn = document.getElementById('get-animals');
    const getFactsBtn = document.getElementById('get-facts');
    const animalContainer = document.getElementById('animal-container');
    const newsContainer = document.getElementById('news-container');
    const loadingElement = document.getElementById('loading');
    
    let likedAnimals = JSON.parse(localStorage.getItem('likedAnimals')) || [];
    
    async function loadAnimalImages(animalType) {
        loadingElement.style.display = 'block';
        animalContainer.innerHTML = '';
        
        try 
		{
            let apiUrl;
            if (animalType === 'dog') 
			{
                apiUrl = 'https://api.thedogapi.com/v1/images/search?limit=6';
            } 
			else if (animalType === 'cat') 
			{
                apiUrl = 'https://api.thecatapi.com/v1/images/search?limit=6';
            } 
			else if (animalType === 'bird') 
			{
                apiUrl = 'https://shibe.online/api/birds?count=6&urls=true&httpsUrls=true';
            }
            
            const response = await fetch(apiUrl);
            let data = await response.json();
            
            if (animalType === 'bird') 
			{
                data = data.map(url => ({ url }));
            }
            
            data.forEach((animal, index) => {
                const animalCard = document.createElement('div');
                animalCard.className = 'animal-card';
                
                animalCard.innerHTML = `
                    <img src="${animal.url || animal.webpurl || animal.link}" alt="${animalType}" class="animal-image">
                    <div class="animal-info">
                        <div class="animal-fact" id="fact-${index}">Загрузка факта...</div>
                        <div class="animal-actions">
                            <button class="like-button" data-id="${animal.id || animal.url}">
                                <span class="like-icon">❤</span> Нравится
                            </button>
                            <button class="share-button">Поделиться</button>
                        </div>
                    </div>
                `;
                
                animalContainer.appendChild(animalCard);
                
                loadAnimalFact(animalType, index);
                
                const likeButton = animalCard.querySelector('.like-button');
                const shareButton = animalCard.querySelector('.share-button');
                
                likeButton.addEventListener('click', function() {toggleLike(animal, animalType, likeButton);});
                
                shareButton.addEventListener('click', function() {shareAnimal(animal, animalType, likeButton);});
                
                if (likedAnimals.some(a => a.id === (animal.id || animal.url))) 
				{
                    likeButton.classList.add('liked');
                    likeButton.innerHTML = '<span class="like-icon">❤</span> Убрать лайк';
                }
            });
        } 
		catch (error) 
		{
            console.error('Ошибка при загрузке изображений:', error);
            animalContainer.innerHTML = '<p>Произошла ошибка при загрузке изображений. Пожалуйста, попробуйте позже.</p>';
        } 
		finally 
		{
            loadingElement.style.display = 'none';
        }
    }
    
    async function loadAnimalFact(animalType, index) {
        try 
		{
            let apiUrl;
            if (animalType === 'dog') 
			{
                apiUrl = 'https://dog-api.kinduff.com/api/facts';
            }
			else if (animalType === 'cat')
			{
                apiUrl = 'https://catfact.ninja/fact';
            } 
			else {
				
                apiUrl = 'https://uselessfacts.jsph.pl/random.json?language=ru';
            }
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            let factText;
            if (animalType === 'dog')
			{
                factText = data.facts[0];
            }
			else if (animalType === 'cat')
			{
                factText = data.fact;
            } 
			else 
			{
                factText = data.text;
            }
            
            const factElement = document.getElementById(`fact-${index}`);
            if (factElement)
			{
                factElement.textContent = factText;
            }
        } 
		catch (error) 
		{
            console.error('Ошибка при загрузке факта:', error);
            const factElement = document.getElementById(`fact-${index}`);
            if (factElement)
			{
                factElement.textContent = 'Не удалось загрузить факт.';
            }
        }
    }
    
    function toggleLike(animal, animalType, button) {
        const animalId = animal.id || animal.url;
        const animalIndex = likedAnimals.findIndex(a => a.id === animalId);
        
        if (animalIndex === -1) 
		{
            likedAnimals.push({ id: animalId, url: animal.url || animal.webpurl || animal.link, type: animalType, timestamp: new Date().toISOString()});
            button.classList.add('liked');
            button.innerHTML = '<span class="like-icon">❤</span> Убрать лайк';
        }
		else 
		{
            likedAnimals.splice(animalIndex, 1);
            button.classList.remove('liked');
            button.innerHTML = '<span class="like-icon">❤</span> Нравится';
        }
        
        localStorage.setItem('likedAnimals', JSON.stringify(likedAnimals));
        updateNewsFeed();
    }
    
    function shareAnimal(animal, animalType, factIndex) {
        const factElement = document.getElementById(`fact-${factIndex}`);
        const factText = factElement ? factElement.textContent : 'Интересный факт';
        
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        newsItem.innerHTML = `
            <p><strong>Новая публикация о ${getAnimalName(animalType)}</strong></p>
            <img src="${animal.url || animal.webpurl || animal.link}" alt="${animalType}">
            <p>${factText}</p>
            <p><small>${new Date().toLocaleString()}</small></p>
        `;
        
        newsContainer.insertBefore(newsItem, newsContainer.firstChild);
        
        if (newsContainer.children.length > 10) 
		{
            newsContainer.removeChild(newsContainer.lastChild);
        }
    }
    
    function updateNewsFeed() {}
    
    function getAnimalName(animalType) {
        switch (animalType) 
		{
            case 'dog': return 'собаках';
            case 'cat': return 'кошках';
            case 'bird': return 'птицах';
            default: return 'животных';
        }
    }
    
    getAnimalsBtn.addEventListener('click', function() {
        const animalType = animalTypeSelect.value;
        if (animalType) 
		{
            loadAnimalImages(animalType);
        } 
		else 
		{
            alert('Пожалуйста, выберите тип животного');
        }
    });
    
    getFactsBtn.addEventListener('click', function() {
        const animalType = animalTypeSelect.value;
        if (animalType)
		{
            const factElements = document.querySelectorAll('.animal-fact');
            factElements.forEach((el, index) => {loadAnimalFact(animalType, index);});
        } 
		else 
		{
            alert('Пожалуйста, выберите тип животного');
        }
    });
    
    loadAnimalImages('bird');
    animalTypeSelect.value = 'bird';
});