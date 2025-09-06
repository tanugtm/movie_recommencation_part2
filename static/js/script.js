document.addEventListener("DOMContentLoaded", () => {
    // --- Get DOM Elements ---
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const gridView = document.getElementById("grid-view");
    const gridTitle = document.getElementById("grid-title");
    const movieGrid = document.getElementById("movie-grid");
    const detailsView = document.getElementById("details-view");
    const movieDetailsContent = document.getElementById("movie-details-content");
    const recommendationsGrid = document.getElementById("recommendations-container");
    const homeButton = document.getElementById("home-button");
    const watchlistButton = document.getElementById("watchlist-button");
    const loader = document.getElementById("loader");
    const API_POSTER_URL = 'https://image.tmdb.org/t/p/w500';

    // --- Helper Functions ---
    async function fetchAPI(endpoint) {
        loader.classList.remove("hidden");
        gridView.classList.add("hidden");
        detailsView.classList.add("hidden");
        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`API Error: ${error}`);
            gridView.classList.remove("hidden");
            gridTitle.textContent = "Error";
            movieGrid.innerHTML = "<p>Could not fetch data. Please check your API key and network connection.</p>";
            return null;
        } finally {
            loader.classList.add("hidden");
        }
    }

    function createMovieCard(movie) {
        const movieCard = document.createElement("div");
        movieCard.className = "movie-card";
        movieCard.dataset.movieId = movie.id;
        movieCard.innerHTML = `
            <img src="${movie.poster_url}" alt="${movie.title}" loading="lazy">
            <div class="movie-info"><h3>${movie.title}</h3></div>`;
        return movieCard;
    }

    // --- Local Storage for Wishlist ---
    const getStorage = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const setStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Display Logic ---
    function showGridView(title, movies) {
        detailsView.classList.add("hidden");
        gridView.classList.remove("hidden");
        gridTitle.textContent = title;
        movieGrid.innerHTML = "";
        if (movies && movies.length > 0) {
            movies.forEach(movie => movieGrid.appendChild(createMovieCard(movie)));
        } else {
            movieGrid.innerHTML = "<p>Your wishlist is empty.</p>";
        }
    }

    function showDetailsView(details, recommendations) {
        gridView.classList.add("hidden");
        detailsView.classList.remove("hidden");
        
        const genres = details.genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('');
        const trailer = details.videos.results.find(v => v.type === 'Trailer');
        const trailerButton = trailer ? `<a href="https://youtube.com/watch?v=${trailer.key}" target="_blank"><button class="btn-primary">▶️ Watch Trailer</button></a>` : '';
        const isWishlisted = getStorage('wishlist').some(m => m.id === details.id);
        
        movieDetailsContent.innerHTML = `
            <button id="back-button">← Back to Home</button>
            <div class="movie-details-content">
                <div class="poster"><img src="${API_POSTER_URL}${details.poster_path}" alt="${details.title}"></div>
                <div class="info">
                    <h1>${details.title}</h1>
                    <h3>${details.tagline || ''}</h3>
                    <div class="meta">
                        <span>⭐ ${details.vote_average.toFixed(1)}</span> |
                        <span>${details.release_date.split('-')[0]}</span> |
                        <span>${details.runtime} min</span>
                    </div>
                    <div class="genres">${genres}</div>
                    <h4>Overview</h4>
                    <p>${details.overview}</p>
                    <div class="action-buttons" data-movie-id="${details.id}" data-title="${details.title}" data-poster-url="${API_POSTER_URL}${details.poster_path}">
                        ${trailerButton}
                        <button class="btn-wishlist ${isWishlisted ? 'active' : ''}">${isWishlisted ? '✓ In Wishlist' : '＋ Add to Wishlist'}</button>
                    </div>
                </div>
            </div>`;
            
        recommendationsGrid.innerHTML = `<h2>More Like This</h2>`;
        const recGrid = document.createElement('div');
        recGrid.className = 'movie-grid';
        if (recommendations && recommendations.length > 0) {
            recommendations.forEach(movie => recGrid.appendChild(createMovieCard(movie)));
        } else {
            recGrid.innerHTML = "<p>No recommendations found.</p>";
        }
        recommendationsGrid.appendChild(recGrid);
        document.getElementById("back-button").addEventListener("click", loadHomepage);
    }

    // --- Core Functions ---
    async function loadHomepage() {
        homeButton.classList.add('active');
        watchlistButton.classList.remove('active');
        const data = await fetchAPI("/api/movies/popular");
        if (data) showGridView("Popular Movies", data.results);
    }

    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        homeButton.classList.remove('active');
        watchlistButton.classList.remove('active');
        const data = await fetchAPI(`/api/movies/search?query=${encodeURIComponent(query)}`);
        if (data) showGridView(`Results for "${query}"`, data.results);
    }
    
    function showWishlist() {
        watchlistButton.classList.add('active');
        homeButton.classList.remove('active');
        const wishlist = getStorage('wishlist');
        showGridView("My Wishlist", wishlist);
    }

    async function handleCardClick(movieId) {
        const [details, recommendations] = await Promise.all([
            fetchAPI(`/api/movie/${movieId}`),
            fetchAPI(`/api/recommendations/${movieId}`)
        ]);
        if (details) showDetailsView(details, recommendations.results);
    }
    
    // --- Event Listeners ---
    searchButton.addEventListener("click", handleSearch);
    searchInput.addEventListener("keyup", e => e.key === "Enter" && handleSearch());
    homeButton.addEventListener("click", loadHomepage);
    watchlistButton.addEventListener("click", showWishlist);
    
    document.body.addEventListener("click", e => {
        const card = e.target.closest(".movie-card");
        if (card) {
            handleCardClick(card.dataset.movieId);
            return;
        }

        if (e.target.classList.contains('btn-wishlist')) {
            const buttonGroup = e.target.closest(".action-buttons");
            const movieId = parseInt(buttonGroup.dataset.movieId);
            const title = buttonGroup.dataset.title;
            const poster_url = buttonGroup.dataset.posterUrl;
            let wishlist = getStorage('wishlist');
            const movieIndex = wishlist.findIndex(m => m.id === movieId);

            if (movieIndex > -1) {
                wishlist.splice(movieIndex, 1);
                e.target.classList.remove('active');
                e.target.textContent = '＋ Add to Wishlist';
            } else {
                wishlist.push({ id: movieId, title, poster_url });
                e.target.classList.add('active');
                e.target.textContent = '✓ In Wishlist';
            }
            setStorage('wishlist', wishlist);
        }
    });

    // --- Initial Load ---
    loadHomepage();
});