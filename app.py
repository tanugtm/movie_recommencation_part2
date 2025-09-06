import os
import requests
from flask import Flask, render_template, jsonify, request
from dotenv import load_dotenv # <-- API key load karne ke liye

# .env file se environment variables load karein
load_dotenv()

# --- CONFIGURATION ---
# .env file se API key ko securely padhein
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

# =================================================================

# Yeh block check karega ki key .env se load hui ya nahi
if not TMDB_API_KEY:
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    print("!!! FATAL ERROR: TMDB_API_KEY .env file mein nahi mili.       !!!")
    print("!!! Kripya .env file banakar usmein apni key daalein.         !!!")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    raise SystemExit() # Application ko band kar dein
else:
    print("✅ TMDB API Key .env file se safaltapoorvak load ho gayi.")

TMDB_BASE_URL = "https://api.themoviedb.org/3"
app = Flask(__name__, template_folder='templates', static_folder='static')

# --- HELPER FUNCTION (Jaisa pehle tha, waisa hi hai) ---
def process_movies_list(movies):
    """Filmon ki list se zaroori details nikalta hai."""
    processed_list = []
    for movie in movies:
        if movie.get("poster_path"):
            processed_list.append({
                "id": movie.get("id"), "title": movie.get("title"),
                "poster_url": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}"
            })
    return processed_list

# --- ROUTES (Jaisa pehle tha, waisa hi hai) ---
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/movie/<int:movie_id>")
def get_movie_details(movie_id):
    endpoint = f"/movie/{movie_id}"
    params = {"api_key": TMDB_API_KEY, "language": "en-US", "append_to_response": "videos,genres"}
    response = requests.get(TMDB_BASE_URL + endpoint, params=params)
    return jsonify(response.json())

@app.route("/api/recommendations/<int:movie_id>")
def get_recommendations(movie_id):
    endpoint = f"/movie/{movie_id}/recommendations"
    params = {"api_key": TMDB_API_KEY}
    response = requests.get(TMDB_BASE_URL + endpoint, params=params)
    if response.status_code == 200:
        return jsonify({"results": process_movies_list(response.json().get("results", []))})
    return jsonify({"error": "Failed to fetch recommendations"}), response.status_code

@app.route("/api/movies/search")
def search_movies():
    query = request.args.get("query")
    endpoint = "/search/movie"
    params = {"api_key": TMDB_API_KEY, "query": query}
    response = requests.get(TMDB_BASE_URL + endpoint, params=params)
    if response.status_code == 200:
        return jsonify({"results": process_movies_list(response.json().get("results", []))})
    return jsonify({"error": "Failed to fetch data from TMDB"}), response.status_code

@app.route("/api/movies/popular")
def get_popular_movies():
    # VVV --- YAHAN BADLAV KIYA GAYA HAI --- VVV
    print("\n--- API CALL DEBUG ---")
    print(f"API call ke liye yeh key istemal ho rahi hai -> '{TMDB_API_KEY}'")
    # ^^^ ------------------------------------ ^^^

    endpoint = "/movie/popular"
    params = {"api_key": TMDB_API_KEY}
    response = requests.get(TMDB_BASE_URL + endpoint, params=params)
    if response.status_code == 200:
        return jsonify({"results": process_movies_list(response.json().get("results", []))})
    return jsonify({"error": "Failed to fetch popular movies"}), response.status_code

# --- MAIN EXECUTION BLOCK (ngrok hata diya gaya hai) ---
if __name__ == '__main__':
    # ngrok ki ab koi zaroorat nahi hai
    print(f"🚀 Server http://127.0.0.1:5000 par shuru ho raha hai...")
    print("--- Ise browser mein kholkar test karein ---")
    
    # Flask app ko seedhe run karein
    app.run(port=5000, debug=True)