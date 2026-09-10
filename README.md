# Hidden Trails Maharashtra

A travel discovery platform that promotes lesser-known, underrated tourist destinations in Maharashtra, India.

## Quick Start

```bash
# Option 1: Python (most systems)
python3 -m http.server 8000

# Option 2: Node.js
npx serve .

# Option 3: PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Adding a New Destination

1. Open `data/spots.csv` in any text editor
2. Add a new row with these columns:

```
spot_name,district,category,tags,brief_description,best_months,avg_rating,review_count,latitude,longitude,map_link,img_path
```

3. Drop your image into `public/images/` folder
4. Reference the image in the `img_path` column (e.g., `public/images/my-spot.jpg`)

**No code changes needed.** The site updates automatically on refresh.

### CSV Column Reference

| Column | Description | Example |
|--------|-------------|---------|
| spot_name | Name of the destination | Naneghat |
| district | Maharashtra district | Pune |
| category | Main category | Heritage |
| tags | Comma-separated tags | trekking,ancient trade route,history,offbeat |
| brief_description | Full description text | Naneghat is a mountain pass... |
| best_months | Best months to visit | Aug-Feb |
| avg_rating | Average user rating (1-5) | 4.6 |
| review_count | Number of reviews | 210 |
| latitude | GPS latitude | 19.2667 |
| longitude | GPS longitude | 73.7833 |
| map_link | Google Maps link | https://www.google.com/maps/... |
| img_path | Path to image file | public/images/naneghat.jpg |

## Features

- **Hidden Gem Score** — Computed as `avg_rating / log(review_count + 1)`, normalized to 0-100
- **Smart Filtering** — Filter by interests, districts, and text search
- **Off-Season Highlights** — Spots that are best to visit in the current off-peak season
- **Offline Support** — Service worker caches the app for offline browsing
- **Interactive Maps** — Leaflet.js maps with OpenStreetMap tiles
- **No Build Step** — Pure HTML/CSS/JS, no compilation needed

## Tech Stack

- HTML5, CSS3, JavaScript (ES6+)
- Leaflet.js + OpenStreetMap (free, no API key)
- Service Worker for offline support
- PapaParse-style CSV parsing (custom implementation)

## Project Structure

```
sih2/
├── index.html          # Main entry point
├── css/
│   └── style.css       # All styles
├── js/
│   ├── csv.js          # CSV parser
│   └── app.js          # Application logic
├── sw.js               # Service worker
├── manifest.json       # PWA manifest
├── data/
│   └── spots.csv       # Destination data (single source of truth)
├── public/
│   └── images/         # Destination images
└── inspiration/        # Reference screenshots
```
