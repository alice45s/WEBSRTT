// Récupération de l'ID de l'anime depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');

// Sélection des éléments DOM
const animeDetails = document.getElementById("animeDetails");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const episodesList = document.getElementById("episodesList");
const externalLinks = document.getElementById("externalLinks");
const trailerContainer = document.getElementById("trailerContainer");
const noTrailerMessage = document.getElementById("noTrailerMessage");

// Fonction pour afficher un message de chargement
function showLoading() {
    animeDetails.innerHTML = '';
    episodesList.innerHTML = '';
    externalLinks.innerHTML = '';
    trailerContainer.innerHTML = '';
    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

// Fonction pour afficher un message d'erreur
function showError(errorMsg, section = null) {
    animeDetails.innerHTML = '';
    episodesList.innerHTML = '';
    externalLinks.innerHTML = '';
    trailerContainer.innerHTML = '';
    loadingMessage.style.display = 'none';

    // Affichage d'une erreur spécifique à chaque section si disponible
    if (section) {
        document.getElementById(section).innerHTML = `<p>Erreur : ${errorMsg}</p>`;
    } else {
        errorMessage.textContent = errorMsg;
        errorMessage.style.display = 'block';
    }
}


// Fonction pour afficher les détails de l'anime
function showAnimeDetails(anime) {
    if (!anime) {
        showError("Les données de l'anime sont introuvables.");
        return;
    }

    const imageUrl = anime.images?.jpg?.image_url || 'assets/no-image.jpg';
    const synopsis = anime.synopsis || "Aucun synopsis disponible.";

    animeDetails.innerHTML = `
        <img src="${imageUrl}" alt="${anime.title}" class="anime-poster" onerror="this.src='assets/no-image.jpg';">
        <h2>${anime.title}</h2>
        <div class="anime-info">
            <div class="info-item"><span>Score :</span> ${anime.score ?? "N/A"}</div>
            <div class="info-item"><span>Épisodes :</span> ${anime.episodes ?? "N/A"}</div>
            <div class="info-item"><span>Statut :</span> ${anime.status ?? "N/A"}</div>
        </div>
        <div class="synopsis"><strong>Synopsis :</strong> ${synopsis}</div>
    `;

    // Affichage du trailer si disponible
    if (anime.trailer?.youtube_id) {
        trailerContainer.innerHTML = `
            <iframe 
                width="100%" 
                height="315" 
                src="https://www.youtube.com/embed/${anime.trailer.youtube_id}" 
                frameborder="0" 
                allow="autoplay; encrypted-media" 
                allowfullscreen>
            </iframe>
        `;
        noTrailerMessage.style.display = "none";
    } else {
        trailerContainer.innerHTML = "";
        noTrailerMessage.style.display = "block";
    }
}

// Fonction pour afficher la liste des épisodes
function showEpisodes(episodes) {
    if (episodes.length === 0) {
        episodesList.innerHTML = "<p>Aucun épisode trouvé.</p>";
        return;
    }

    let html = "<h3>Épisodes :</h3><ul>";
    episodes.forEach(ep => {
        html += `<li><strong>Épisode ${ep.mal_id} :</strong> ${ep.title || "Sans titre"}</li>`;
    });
    html += "</ul>";

    episodesList.innerHTML = html;
}

// Fonction pour afficher les liens de streaming
function showStreamingLinks(links) {
    if (links.length === 0) {
        externalLinks.innerHTML = "<p>Aucun lien de streaming trouvé.</p>";
        return;
    }

    let html = "<h3>Liens de Streaming :</h3><ul>";
    links.forEach(link => {
        html += `<li><a href="${link.url}" target="_blank">${link.name}</a></li>`;
    });
    html += "</ul>";

    externalLinks.innerHTML = html;
}

// Fonction pour afficher les personnages principaux
function showCharacters(characters) {
    if (!characters || characters.length === 0) {
        return;
    }

    let html = "<h3>Personnages Principaux :</h3><div class='character-list'>";
    characters.slice(0, 5).forEach(char => {
        html += `
            <div class="character">
                <img src="${char.character.images.jpg.image_url}" alt="${char.character.name}">
                <p>${char.character.name}</p>
            </div>
        `;
    });
    html += "</div>";

    animeDetails.innerHTML += html;
}

// Fonction pour réessayer une requête après un délai
async function fetchWithRetry(url, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return response.json();
            }
        } catch (error) {
            console.error(`Tentative ${i + 1} échouée :`, error);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error(`La requête a échoué après ${retries} tentatives.`);
}

// Fonction principale pour charger toutes les données
async function loadAllData() {
    if (!animeId) {
        showError("Aucun ID d'anime spécifié dans l'URL.");
        return;
    }

    showLoading();

    try {
        // Exécuter toutes les requêtes en parallèle avec réessai
        const [animeData, episodesData, streamingData, charactersData] = await Promise.all([
            fetchWithRetry(`https://api.jikan.moe/v4/anime/${animeId}`),
            fetchWithRetry(`https://api.jikan.moe/v4/anime/${animeId}/episodes`),
            fetchWithRetry(`https://api.jikan.moe/v4/anime/${animeId}/streaming`),
            fetchWithRetry(`https://api.jikan.moe/v4/anime/${animeId}/characters`)
        ]);

        // Afficher les données
        if (animeData?.data) {
            showAnimeDetails(animeData.data);
        } else {
            throw new Error("Données invalides pour l'anime.");
        }

        if (episodesData?.data) {
            showEpisodes(episodesData.data);
        }

        if (streamingData?.data) {
            showStreamingLinks(streamingData.data);
        }

        if (charactersData?.data) {
            showCharacters(charactersData.data);
        }

        // Cacher le message de chargement
        loadingMessage.style.display = 'none';
    } catch (error) {
        showError(error.message);
    }
}

// Lancer le chargement des données
loadAllData();
