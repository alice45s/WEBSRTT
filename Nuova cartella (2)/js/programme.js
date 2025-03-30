// URL de l'API Jikan pour les animes à venir
const UPCOMING_ANIME_URL = "https://api.jikan.moe/v4/seasons/upcoming";

// Éléments du DOM
const upcomingAnimeList = document.getElementById("upcomingAnimeList");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");

// Fonction pour charger les animes à venir
async function loadUpcomingAnimes() {
    try {
        // Afficher un message de chargement
        loadingMessage.style.display = "block";

        // Récupérer les données de l'API
        const response = await fetch(UPCOMING_ANIME_URL);
        const data = await response.json();

        // Afficher les animes à venir
        displayUpcomingAnimes(data.data);

        // Cacher le message de chargement
        loadingMessage.style.display = "none";
    } catch (error) {
        console.error("Erreur :", error);

        // Afficher un message d'erreur
        errorMessage.textContent = "Erreur lors du chargement des animes à venir.";
        errorMessage.style.display = "block";
    }
}

// Fonction pour afficher les animes à venir
function displayUpcomingAnimes(animes) {
    // Vider la liste actuelle
    upcomingAnimeList.innerHTML = "";

    // Parcourir les animes et les afficher
    animes.forEach((anime) => {
        const animeCard = document.createElement("div");
        animeCard.classList.add("anime-card");

        // Construire le contenu de la carte
        animeCard.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
            <h3>${anime.title}</h3>
            <p>Date de sortie : ${anime.aired.from || "Inconnue"}</p>
        `;

        // Ajouter un événement de clic pour rediriger vers la page de détails
        animeCard.addEventListener("click", () => {
            window.location.href = `/html/details.html?id=${anime.mal_id}`;
        });

        // Ajouter la carte à la liste
        upcomingAnimeList.appendChild(animeCard);
    });
}

// Charger les animes à venir au démarrage
loadUpcomingAnimes();