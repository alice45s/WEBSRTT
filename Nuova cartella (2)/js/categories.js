// URL de l'API Jikan pour les catégories (genres)
const GENRES_URL = "https://api.jikan.moe/v4/genres/anime";

// URL de l'API Jikan pour les animes par catégorie et pour la recherche
const ANIME_BY_GENRE_URL = "https://api.jikan.moe/v4/anime";
const SEARCH_URL = "https://api.jikan.moe/v4/anime";

// Liste des catégories à exclure (IDs et noms)
const EXCLUDED_CATEGORIES = [
    12, // Hentai
    49, // Ecchi
    9,  // Harem
    50,
    26,
    52,
    75,
    28,
    64,74,65,51  // Adult Cast
];

// Éléments du DOM
const categoryList = document.getElementById("categoryList");
const animeList = document.getElementById("animeList");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const currentPageSpan = document.getElementById("currentPage");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const searchInput = document.getElementById("search");
const searchButton = document.getElementById("searchButton");

let currentPage = 1;
let selectedGenreId = null;
let currentSearchQuery = null;

async function loadCategories() {
    try {
        const response = await fetch(GENRES_URL);
        const data = await response.json();
        console.log("Genres reçus :", data);

        if (!data.data || data.data.length === 0) {
            showError("Aucune catégorie disponible.");
            return;
        }

        const filteredCategories = data.data.filter(category => 
            category.mal_id && !EXCLUDED_CATEGORIES.includes(category.mal_id)
        );
        console.log("Catégories après filtrage :", filteredCategories);

        displayCategories(filteredCategories);
    } catch (error) {
        console.error("Erreur :", error);
        showError("Erreur lors du chargement des catégories.");
    }
}

function displayCategories(categories) {
    categories.sort((a, b) => a.name.localeCompare(b.name));
    categoryList.innerHTML = categories.map(category => `
        <button class="category-button" data-id="${category.mal_id}">
            ${category.name}
        </button>
    `).join("");

    document.querySelectorAll(".category-button").forEach(button => {
        button.addEventListener("click", () => {
            selectedGenreId = button.getAttribute("data-id");
            currentSearchQuery = null;
            currentPage = 1;
            loadAnimesByGenre(selectedGenreId, currentPage);
        });
    });
}

async function loadAnimesByGenre(genreId, page = 1) {
    try {
        showLoading();
        animeList.innerHTML = "";
        const response = await fetch(`${ANIME_BY_GENRE_URL}?genres=${genreId}&page=${page}`);
        const data = await response.json();
        displayAnimes(data.data);
        updatePaginationButtons(data.pagination);
    } catch (error) {
        console.error("Erreur :", error);
        showError("Erreur lors du chargement des animes.");
    } finally {
        hideLoading();
    }
}

function displayAnimes(animes) {
    if (!animes || animes.length === 0) {
        animeList.innerHTML = "<p>Aucun anime trouvé.</p>";
        return;
    }
    animeList.innerHTML = animes.map(anime => `
        <div class="anime-card" data-id="${anime.mal_id}">
            <img src="${anime.images?.jpg?.image_url || '/image/placeholder.jpg'}" alt="${anime.title}">
            <h3>${anime.title}</h3>
        </div>
    `).join("");

    document.querySelectorAll(".anime-card").forEach(card => {
        card.addEventListener("click", () => {
            const animeId = card.getAttribute("data-id");
            if (animeId) {
                window.location.href = `/html/details.html?id=${animeId}`;
            }
        });
    });
}

function updatePaginationButtons(pagination) {
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = !pagination?.has_next_page;
    currentPageSpan.textContent = currentPage;
}

function showLoading() {
    loadingMessage.style.display = "block";
    errorMessage.style.display = "none";
}

function hideLoading() {
    loadingMessage.style.display = "none";
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
}

prevPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        selectedGenreId ? loadAnimesByGenre(selectedGenreId, currentPage) : null;
    }
});

nextPageButton.addEventListener("click", () => {
    currentPage++;
    selectedGenreId ? loadAnimesByGenre(selectedGenreId, currentPage) : null;
});

searchButton.addEventListener("click", handleSearch);
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        handleSearch();
    }
});

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        currentSearchQuery = query;
        selectedGenreId = null;
        currentPage = 1;
        searchAnimes(query, currentPage);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
});
