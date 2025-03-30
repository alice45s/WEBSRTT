// Configuration de base
const CONFIG = {
    api: {
        baseUrl: "https://api.jikan.moe/v4",
        timeout: 5000,
        seasonTopUrl: "https://api.jikan.moe/v4/seasons/now" // Endpoint pour la saison actuelle
    },
    cache: {
        duration: 60 * 60 * 1000 // 1 heure en millisecondes
    }
};

// Éléments DOM
const elements = {
    animeList: document.getElementById("animeList"),
    sliderContainer: document.getElementById("sliderContainer"),
    searchInput: document.getElementById("search"),
    prevPageBtn: document.getElementById("prevPage"),
    nextPageBtn: document.getElementById("nextPage"),
    currentPage: document.getElementById("currentPage"),
    prevSliderBtn: document.getElementById("prevSlider"),
    nextSliderBtn: document.getElementById("nextSlider"),
    loadingIndicator: document.getElementById("loadingMessage"),
    errorMessage: document.getElementById("errorMessage"),
    seasonTopContainer: document.getElementById("seasonTopAnime") // Nouvel élément
};

// State management
const state = {
    currentPage: 1,
    isSearching: false,
    currentQuery: "",
    sliderAnimes: [],
    currentSlide: 0,
    slideInterval: null
};

// Service de Cache
class CacheService {
    constructor() {
        this.duration = CONFIG.cache.duration;
    }

    set(key, data) {
        const item = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    get(key) {
        const item = JSON.parse(localStorage.getItem(key));
        if (!item) return null;

        const isExpired = (Date.now() - item.timestamp) > this.duration;
        if (isExpired) {
            localStorage.removeItem(key);
            return null;
        }

        return item.data;
    }

    clear(key) {
        localStorage.removeItem(key);
    }
}

const cache = new CacheService();

// Fonctions d'affichage
function displayAnimes(animes) {
    elements.animeList.innerHTML = animes.map(anime => `
        <div class="anime-card" data-id="${anime.mal_id}">
            <img src="${anime.images?.jpg?.image_url || 'placeholder.jpg'}" 
                 alt="${anime.title}" 
                 onerror="this.src='placeholder.jpg'">
            <h3>${anime.title}</h3>
            ${anime.score ? `<div class="anime-score">★ ${anime.score}</div>` : ''}
        </div>
    `).join("");

    // Gestion des clics
    document.querySelectorAll('.anime-card').forEach(card => {
        card.addEventListener('click', () => {
            window.location.href = `/html/details.html?id=${card.dataset.id}`;
        });
    });
}

async function loadSliderAnimes() {
    const cacheKey = 'featured_animes';
    try {
        const data = await fetchWithCache(
            `${CONFIG.api.baseUrl}/top/anime?limit=6`,
            cacheKey
        );
        displaySlider(data.data);
    } catch (error) {
        console.error("Erreur slider:", error);
    }
}

function displaySlider(animes) {
    const sliderContainer = document.querySelector('.slider');
    sliderContainer.innerHTML = animes.map(anime => `
        <img src="${anime.images?.jpg?.large_image_url || 'placeholder.jpg'}" 
             alt="${anime.title}" 
             class="slide"
             onerror="this.src='placeholder.jpg'">
    `).join('');
    
    // Réinitialisez le slider après mise à jour du contenu
    initSlider();
}

// Nouvelle fonction pour afficher les tops de la saison
function displaySeasonTopAnime(animes) {
    elements.seasonTopContainer.innerHTML = animes.map((anime, index) => `
        <div class="season-card" data-id="${anime.mal_id}">
            <div class="box">
                <div class="content">
                    <h2>${String(index + 1).padStart(2, '0')}</h2>
                    <div class="score">★ ${anime.score || 'N/A'}</div>
                    <img src="${anime.images?.jpg?.image_url || 'placeholder.jpg'}" 
                         alt="${anime.title}"
                         onerror="this.src='placeholder.jpg'">
                    <h3>${anime.title}</h3>
                    <p>${anime.synopsis?.substring(0, 150) || 'Description non disponible'}...</p>
                    <button class="details-btn">Voir détails</button>
                </div>
            </div>
        </div>
    `).join("");

    // Gestion des clics
    document.querySelectorAll('.season-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('details-btn')) {
                window.location.href = `/html/details.html?id=${card.dataset.id}`;
            }
        });
        
        const btn = card.querySelector('.details-btn');
        btn.addEventListener('click', () => {
            window.location.href = `/html/details.html?id=${card.dataset.id}`;
        });
    });
}

// Fonctions API avec cache
async function fetchWithCache(url, cacheKey) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        console.log("Utilisation du cache pour", cacheKey);
        return cachedData;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        cache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error("Erreur API:", error);
        throw error;
    }
}

// Chargement des données
async function loadAnimes(page = 1) {
    const cacheKey = `top_animes_page_${page}`;
    elements.loadingIndicator.style.display = 'block';

    try {
        const data = await fetchWithCache(
            `${CONFIG.api.baseUrl}/top/anime?page=${page}`,
            cacheKey
        );
        displayAnimes(data.data);
        state.currentPage = page;
        updatePagination(data.pagination);
    } catch (error) {
        console.error("Erreur:", error);
        elements.animeList.innerHTML = '<p class="error">Erreur de chargement</p>';
        elements.errorMessage.textContent = "Erreur lors du chargement des animes";
        elements.errorMessage.style.display = 'block';
    } finally {
        elements.loadingIndicator.style.display = 'none';
    }
}

async function loadSliderAnimes() {
    const cacheKey = 'featured_animes';
    try {
        const data = await fetchWithCache(
            `${CONFIG.api.baseUrl}/top/anime?limit=12`,
            cacheKey
        );
        displaySlider(data.data);
        startAutoSlide();
    } catch (error) {
        console.error("Erreur slider:", error);
    }
}

// Nouvelle fonction pour charger les tops de la saison
async function loadSeasonTopAnime() {
    const cacheKey = 'season_top_animes';
    elements.loadingIndicator.style.display = 'block';
    
    try {
        const data = await fetchWithCache(
            CONFIG.api.seasonTopUrl,
            cacheKey
        );
        displaySeasonTopAnime(data.data.slice(0, 6)); // Prendre les 6 premiers
    } catch (error) {
        console.error("Erreur top saison:", error);
        elements.errorMessage.textContent = "Erreur lors du chargement des tops saison";
        elements.errorMessage.style.display = 'block';
    } finally {
        elements.loadingIndicator.style.display = 'none';
    }
}

// Gestion de la pagination
function updatePagination(pagination) {
    elements.prevPageBtn.disabled = state.currentPage === 1;
    elements.nextPageBtn.disabled = !pagination?.has_next_page;
    elements.currentPage.textContent = state.currentPage;
}

function handlePagination(direction) {
    const newPage = direction === 'next' ? state.currentPage + 1 : state.currentPage - 1;
    if (newPage < 1) return;
    state.currentPage = newPage;
    loadAnimes(newPage);
}

// Navigation du slider
function updateSliderPosition() {
    const slideWidth = 100 / 4; // 4 slides visibles
    elements.sliderContainer.style.transform = `translateX(-${state.currentSlide * slideWidth}%)`;
}

function startAutoSlide() {
    if (state.slideInterval) {
        clearInterval(state.slideInterval);
    }
    
    state.slideInterval = setInterval(() => {
        const nextSlide = state.currentSlide + 1;
        if (nextSlide <= state.sliderAnimes.length - 4) {
            state.currentSlide = nextSlide;
        } else {
            state.currentSlide = 0;
        }
        updateSliderPosition();
    }, 3000); // Changement toutes les 3 secondes
}

// Recherche
async function searchAnimes(query) {
    const cacheKey = `search_${query}`;
    elements.loadingIndicator.style.display = 'block';
    elements.animeList.innerHTML = '';

    try {
        const data = await fetchWithCache(
            `${CONFIG.api.baseUrl}/anime?q=${query}&page=1`,
            cacheKey
        );
        displayAnimes(data.data);
        elements.prevPageBtn.disabled = true;
        elements.nextPageBtn.disabled = !data.pagination?.has_next_page;
        elements.currentPage.textContent = 1;
    } catch (error) {
        console.error("Search error:", error);
        elements.animeList.innerHTML = '<p class="error">Erreur de recherche</p>';
    } finally {
        elements.loadingIndicator.style.display = 'none';
    }
}

// Animation au scroll
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.anime-card, .season-card, section').forEach(el => {
        observer.observe(el);
    });
}

// Événements
function initEventListeners() {
    // Pagination
    elements.prevPageBtn?.addEventListener('click', () => handlePagination('prev'));
    elements.nextPageBtn?.addEventListener('click', () => handlePagination('next'));

    // Slider
    elements.prevSliderBtn?.addEventListener('click', () => {
        if (state.currentSlide > 0) {
            state.currentSlide--;
            updateSliderPosition();
        }
    });

    elements.nextSliderBtn?.addEventListener('click', () => {
        if (state.currentSlide < state.sliderAnimes.length - 4) {
            state.currentSlide++;
            updateSliderPosition();
        }
    });

    // Recherche
    elements.searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 2) {
            state.isSearching = true;
            state.currentQuery = query;
            searchAnimes(query);
        } else if (state.isSearching) {
            state.isSearching = false;
            loadAnimes(1);
        }
    });

    // Pause au survol du slider
    elements.sliderContainer?.addEventListener('mouseenter', () => {
        if (state.slideInterval) {
            clearInterval(state.slideInterval);
        }
    });

    elements.sliderContainer?.addEventListener('mouseleave', () => {
        if (state.sliderAnimes.length > 0) {
            startAutoSlide();
        }
    });
}

// Initialisation
function init() {
    initEventListeners();
    loadSliderAnimes();
    loadAnimes(1);
    loadSeasonTopAnime(); // Charger les tops de la saison
    initScrollAnimations();
}

document.addEventListener('DOMContentLoaded', init);