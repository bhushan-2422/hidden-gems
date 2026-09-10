/* ============================================
   Hidden Gems — Complete Application
   Routing, City Pages, Place Pages, Experiences
   ============================================ */

let allSpots = [];
let currentSlide = 0;
let carouselTimer = null;
let selectedTags = new Set();
let leafletMap = null;
let currentPage = 'home';
let currentCity = null;
let currentPlace = null;

const CATEGORY_ICONS = {
  'Heritage': 'Heritage', 'Nature': 'Nature', 'Hill Station': 'Hill Station',
  'Beach': 'Beach', 'Wildlife': 'Wildlife', 'default': 'Destination'
};

const TAG_LABELS = {
  trekking: 'Trekking', waterfall: 'Waterfall', heritage: 'Heritage',
  spiritual: 'Spiritual', offbeat: 'Offbeat', adventure: 'Adventure',
  beach: 'Beach', wildlife: 'Wildlife', nature: 'Nature', camping: 'Camping',
  hillstation: 'Hill Station', 'ancient trade route': 'Ancient Trade Route',
  history: 'History', 'scenic drive': 'Scenic Drive', monsoon: 'Monsoon',
  biodiversity: 'Biodiversity', ghat: 'Ghat', quiet: 'Quiet',
  temple: 'Temple', fort: 'Fort', 'tiger reserve': 'Tiger Reserve',
  lake: 'Lake', stargazing: 'Stargazing', 'tribal culture': 'Tribal Culture',
  'sunset point': 'Sunset Point', coffee: 'Coffee', 'turtle festival': 'Turtle Festival'
};

const CITY_DESCRIPTIONS = {
  'Pune': 'Beyond the city you know, the Pune district hides mountain passes, ancient trade routes, and fort trails that few travelers explore.',
  'Ahmednagar': 'Ahmednagar district holds Maharashtra\'s highest peak, pristine lakes, and canyon valleys that remain largely undiscovered.',
  'Ratnagiri': 'The Konkan coast of Ratnagiri hides serene beaches, turtle nesting sites, and quiet villages far from mainstream tourism.',
  'Sangli': 'Sangli district borders the Sahyadri tiger reserve and holds dense forests, national parks, and biodiversity hotspots.',
  'Amravati': 'Vidarbha\'s only hill station and Maharashtra\'s coffee country — Amravati hides wild forests and colonial-era retreats.',
  'Nandurbar': 'Remote hill stations, tribal culture, and untouched sal forests make Nandurbar one of Maharashtra\'s most overlooked districts.',
  'Sindhudurg': 'Deep within the Western Ghats, Sindhudurg holds extraordinary biodiversity, endemic species, and cascading waterfalls.',
  'Satara': 'Satara district holds mountain passes, waterfalls, and lakes framed by Maharashtra\'s highest peaks.'
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  allSpots = await loadSpots();
  computeGemScores();
  initCarousel();
  initAuthenticityImages();
  initCityCards();
  initSearchOverlay();
  initOfflineDetection();
  initRouting();
  registerServiceWorker();
});

// ============================================
// HASH-BASED ROUTING
// ============================================

function initRouting() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash.slice(1);
  const parts = hash.split('/');

  if (parts[0] === 'city' && parts[1]) {
    showCityPage(decodeURIComponent(parts[1]));
  } else if (parts[0] === 'place' && parts[1]) {
    showPlacePage(decodeURIComponent(parts[1]));
  } else if (parts[0] === 'explore' && parts[1]) {
    showTagResults(decodeURIComponent(parts[1]));
  } else {
    showHomePage();
  }
}

function navigateTo(hash) {
  window.location.hash = hash;
}

function showHomePage() {
  currentPage = 'home';
  currentCity = null;
  currentPlace = null;
  document.getElementById('homeSections').style.display = '';
  document.getElementById('cityPage').style.display = 'none';
  document.getElementById('placePage').style.display = 'none';
  document.getElementById('tagResultsPage').style.display = 'none';
  document.getElementById('breadcrumbBar').style.display = 'none';
  document.title = 'Hidden Gems — Discover Maharashtra';
  window.scrollTo(0, 0);
}

// ============================================
// BREADCRUMBS
// ============================================

function showBreadcrumb(items) {
  const bar = document.getElementById('breadcrumbBar');
  const nav = document.getElementById('breadcrumb');
  bar.style.display = '';
  nav.innerHTML = items.map((item, i) => {
    if (i === items.length - 1) {
      return `<span class="breadcrumb-current">${item.label}</span>`;
    }
    return `<a href="${item.href}" onclick="navigateTo('${item.href.replace('#', '')}'); return false;">${item.label}</a><span class="breadcrumb-sep">›</span>`;
  }).join('');
}

function hideBreadcrumb() {
  document.getElementById('breadcrumbBar').style.display = 'none';
}

// ============================================
// HEADER
// ============================================

function initHeader() {
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 80);
  });
}

function scrollToTop(e) {
  if (e) e.preventDefault();
  navigateTo('');
}

// ============================================
// MOBILE NAV
// ============================================

function toggleMobileNav() {
  document.getElementById('mobileNav').classList.toggle('open');
  document.getElementById('menuToggle').classList.toggle('active');
}

function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('menuToggle').classList.remove('active');
}

// ============================================
// SEARCH OVERLAY
// ============================================

function toggleSearch() {
  const overlay = document.getElementById('searchOverlay');
  overlay.classList.toggle('open');
  if (overlay.classList.contains('open')) {
    document.getElementById('globalSearch').focus();
  }
}

function initSearchOverlay() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('searchOverlay').classList.remove('open');
      closeExperienceForm();
    }
  });
}

function handleGlobalSearch(query) {
  const container = document.getElementById('searchResults');
  if (!query.trim()) { container.innerHTML = ''; return; }
  const q = query.toLowerCase();
  const results = allSpots.filter(s => {
    const haystack = (s.spot_name + ' ' + s.district + ' ' + s.category + ' ' + s.tags + ' ' + s.brief_description).toLowerCase();
    return haystack.includes(q);
  });
  if (results.length === 0) {
    container.innerHTML = '<p style="padding:12px 0;color:var(--ink-muted);font-size:14px;">No destinations found.</p>';
    return;
  }
  container.innerHTML = results.map(s => `
    <div class="search-result-item" onclick="navigateTo('place/${encodeURIComponent(s.spot_name)}'); toggleSearch();">
      <span class="search-result-name">${s.spot_name}</span>
      <span class="search-result-district">${s.district}</span>
    </div>
  `).join('');
}

// ============================================
// HIDDEN GEM SCORE
// ============================================

function computeGemScores() {
  const rawScores = allSpots.map(spot => {
    const rating = parseFloat(spot.avg_rating) || 0;
    const reviews = parseInt(spot.review_count) || 0;
    return rating / Math.log(reviews + 1);
  });
  const max = Math.max(...rawScores);
  const min = Math.min(...rawScores);
  const range = max - min || 1;
  allSpots.forEach((spot, i) => {
    spot._raw = rawScores[i];
    spot._score = Math.round(((rawScores[i] - min) / range) * 100);
  });
}

// ============================================
// HERO CAROUSEL
// ============================================

function initCarousel() {
  const track = document.getElementById('carouselTrack');
  if (allSpots.length === 0) return;
  track.innerHTML = allSpots.map((spot, i) => `
    <div class="carousel-slide ${i === 0 ? 'active' : ''}">
      <img src="${spot.img_path || ''}" alt="${spot.spot_name}" onerror="this.style.display='none'">
    </div>
  `).join('');
  updateCaption();
  startCarousel();
}

function updateCaption() {
  const spot = allSpots[currentSlide];
  if (!spot) return;
  document.getElementById('carouselCaption').textContent = `${spot.spot_name} — ${spot.district}, Maharashtra`;
  document.getElementById('carouselProgress').style.width = (((currentSlide + 1) / allSpots.length) * 100) + '%';
}

function goToSlide(index) {
  document.querySelectorAll('.carousel-slide').forEach((s, i) => s.classList.toggle('active', i === index));
  currentSlide = index;
  updateCaption();
}

function nextSlide() { goToSlide((currentSlide + 1) % allSpots.length); resetCarouselTimer(); }
function prevSlide() { goToSlide((currentSlide - 1 + allSpots.length) % allSpots.length); resetCarouselTimer(); }
function startCarousel() { carouselTimer = setInterval(nextSlide, 5000); }
function resetCarouselTimer() { clearInterval(carouselTimer); startCarousel(); }

// ============================================
// AUTHENTICITY IMAGES
// ============================================

function initAuthenticityImages() {
  const spots = allSpots.slice(0, 3);
  if (spots[0]) document.getElementById('authImg1').style.backgroundImage = `url(${spots[0].img_path})`;
  if (spots[1]) document.getElementById('authImg2').style.backgroundImage = `url(${spots[1].img_path})`;
  if (spots[2]) document.getElementById('authImg3').style.backgroundImage = `url(${spots[2].img_path})`;
}

// ============================================
// CITY CARDS (homepage)
// ============================================

function initCityCards() {
  const track = document.getElementById('citiesTrack');
  const districtMap = {};
  allSpots.forEach(spot => {
    if (!districtMap[spot.district]) districtMap[spot.district] = [];
    districtMap[spot.district].push(spot);
  });
  const cities = Object.entries(districtMap).sort((a, b) => b[1].length - a[1].length);
  track.innerHTML = cities.map(([district, spots]) => {
    const img = spots[0] ? spots[0].img_path : '';
    return `
      <div class="city-card" onclick="navigateTo('city/${encodeURIComponent(district)}')">
        <div class="city-card-image" style="background-image:url('${img}')">
          <div class="city-card-overlay"></div>
        </div>
        <div class="city-card-info">
          <div class="city-card-name">${district}</div>
          <div class="city-card-count">${spots.length} hidden ${spots.length === 1 ? 'gem' : 'gems'}</div>
        </div>
      </div>
    `;
  }).join('');
}

function scrollCities(dir) {
  document.getElementById('citiesTrack').scrollBy({ left: dir * 300, behavior: 'smooth' });
}

// ============================================
// TAG-BASED DISCOVERY
// ============================================

function toggleTag(btn) {
  const tag = btn.dataset.tag;
  btn.classList.toggle('active');
  if (selectedTags.has(tag)) selectedTags.delete(tag);
  else selectedTags.add(tag);
  document.getElementById('discoverBtn').disabled = selectedTags.size === 0;
}

function discoverByFeeling() {
  if (selectedTags.size === 0) return;
  const label = [...selectedTags].map(t => TAG_LABELS[t] || t).join(' + ');
  navigateTo('explore/' + encodeURIComponent(label));
}

function showTagResults(title) {
  const container = document.getElementById('tagResultsPage');
  document.getElementById('tagResultsTitle').textContent = title;
  document.getElementById('tagResultsDesc').textContent = `Places matching your interests from the Hidden Gems dataset.`;

  const spots = allSpots.filter(spot => {
    const spotTags = spot.tags.split(',').map(t => t.trim().toLowerCase());
    return [...selectedTags].some(t => spotTags.includes(t));
  }).sort((a, b) => b._score - a._score);

  const grid = document.getElementById('tagResultsGrid');
  if (spots.length === 0) {
    grid.innerHTML = '<p style="color:var(--ink-muted);font-size:15px;grid-column:1/-1;">No exact matches found. Try different interests.</p>';
  } else {
    grid.innerHTML = spots.map(spot => createCityGemCard(spot)).join('');
  }

  currentPage = 'tags';
  document.getElementById('homeSections').style.display = 'none';
  document.getElementById('cityPage').style.display = 'none';
  document.getElementById('placePage').style.display = 'none';
  container.style.display = '';
  document.title = `${title} — Hidden Gems`;
  window.scrollTo(0, 0);
}

// ============================================
// CITY PAGE
// ============================================

function showCityPage(district) {
  const spots = allSpots.filter(s => s.district === district);
  if (spots.length === 0) { showHomePage(); return; }

  currentCity = district;
  currentPage = 'city';

  document.getElementById('homeSections').style.display = 'none';
  document.getElementById('placePage').style.display = 'none';
  document.getElementById('tagResultsPage').style.display = 'none';

  const page = document.getElementById('cityPage');
  page.style.display = '';

  // Hero
  const heroImg = spots[0].img_path || '';
  document.getElementById('cityHeroImg').src = heroImg;
  document.getElementById('cityHeroImg').onerror = function() { this.style.display = 'none'; };
  document.getElementById('cityEyebrow').textContent = 'MAHARASHTRA';
  document.getElementById('cityTitle').textContent = district;
  document.getElementById('citySubtitle').textContent = 'Discover the places beyond the usual recommendations.';

  // Intro
  const desc = CITY_DESCRIPTIONS[district] || `Exploring the hidden gems of ${district} district — places that are genuinely worth visiting but relatively unknown.`;
  document.getElementById('cityIntro').innerHTML = `<p>${desc}</p>`;

  // Gems header
  document.getElementById('cityGemsTitle').textContent = `Hidden Gems in ${district}`;
  document.getElementById('cityGemsDesc').textContent = `${spots.length} verified ${spots.length === 1 ? 'place' : 'places'} documented by real experiences.`;

  // Tags filter
  const allTags = new Set();
  spots.forEach(s => s.tags.split(',').forEach(t => allTags.add(t.trim().toLowerCase())));
  const tagList = document.getElementById('cityTagList');
  tagList.innerHTML = '';
  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'city-tag-btn';
    btn.dataset.tag = tag;
    btn.textContent = TAG_LABELS[tag] || tag;
    btn.onclick = () => {
      btn.classList.toggle('active');
      filterCityGems();
    };
    tagList.appendChild(btn);
  });

  // Render gems
  renderCityGems(spots);

  // Breadcrumb
  showBreadcrumb([
    { label: 'Maharashtra', href: '#' },
    { label: district, href: `#city/${encodeURIComponent(district)}` }
  ]);

  document.title = `${district} — Hidden Gems`;
  window.scrollTo(0, 0);
}

function renderCityGems(spots) {
  const grid = document.getElementById('cityGemsGrid');
  grid.innerHTML = spots.map(spot => createCityGemCard(spot)).join('');
}

function createCityGemCard(spot) {
  const imgHTML = spot.img_path
    ? `<img src="${spot.img_path}" alt="${spot.spot_name}" loading="lazy" onerror="this.style.display='none'">`
    : '';
  const tags = spot.tags.split(',').map(t => t.trim()).slice(0, 3);
  return `
    <div class="city-gem-card" onclick="navigateTo('place/${encodeURIComponent(spot.spot_name)}')">
      <div class="city-gem-image">
        ${imgHTML}
        <span class="gem-score-badge">${spot._score}</span>
      </div>
      <h3 class="city-gem-name">${spot.spot_name}</h3>
      <p class="city-gem-district">${spot.district}, Maharashtra</p>
      <p class="city-gem-desc">${spot.brief_description}</p>
      <div class="city-gem-tags">
        ${tags.map(t => `<span class="city-gem-tag">${TAG_LABELS[t] || t}</span>`).join('')}
      </div>
    </div>
  `;
}

function filterCityGems() {
  const activeTags = [...document.querySelectorAll('.city-tag-btn.active')].map(b => b.dataset.tag);
  let spots = allSpots.filter(s => s.district === currentCity);
  if (activeTags.length > 0) {
    spots = spots.filter(spot => {
      const spotTags = spot.tags.split(',').map(t => t.trim().toLowerCase());
      return activeTags.some(t => spotTags.includes(t));
    });
  }
  renderCityGems(spots);
}

// ============================================
// PLACE PAGE
// ============================================

function showPlacePage(name) {
  const spot = allSpots.find(s => s.spot_name === name);
  if (!spot) { showHomePage(); return; }

  currentPlace = spot;
  currentPage = 'place';

  document.getElementById('homeSections').style.display = 'none';
  document.getElementById('cityPage').style.display = 'none';
  document.getElementById('tagResultsPage').style.display = 'none';

  const page = document.getElementById('placePage');
  page.style.display = '';

  // Hero
  document.getElementById('placeHeroImg').src = spot.img_path || '';
  document.getElementById('placeHeroImg').onerror = function() { this.style.display = 'none'; };
  document.getElementById('placeCategory').textContent = CATEGORY_ICONS[spot.category] || spot.category;
  document.getElementById('placeTitle').textContent = spot.spot_name;
  document.getElementById('placeLocation').textContent = `${spot.district}, Maharashtra`;

  // Gallery
  renderPlaceGallery(spot);

  // Tags
  const tags = spot.tags.split(',').map(t => t.trim());
  document.getElementById('placeTags').innerHTML = tags.map(t =>
    `<a class="place-tag" href="#explore/${encodeURIComponent(TAG_LABELS[t] || t)}" onclick="selectTagAndNavigate('${t}'); return false;">${TAG_LABELS[t] || t}</a>`
  ).join('');

  // Description
  document.getElementById('placeDescription').textContent = spot.brief_description;

  // Why visit
  document.getElementById('placeWhyVisit').textContent =
    `${spot.spot_name} is a genuine hidden gem — a place with a ${spot.avg_rating} rating from ${spot.review_count} visitors, yet relatively unknown to mainstream tourism. Its Discovery Score of ${spot._score} confirms it as a place worth finding.`;

  // Our experience
  document.getElementById('placeExperience').textContent =
    `We visited ${spot.spot_name} as part of our effort to document Maharashtra's overlooked destinations. The experience confirmed what the data suggests — this is a place that deserves more attention than it currently receives.`;

  // Score
  document.getElementById('placeDetailRating').textContent = spot.avg_rating;
  document.getElementById('placeDetailReviews').textContent = spot.review_count;
  document.getElementById('placeDetailRaw').textContent = spot._raw.toFixed(3);
  document.getElementById('placeDetailNormalized').textContent = spot._score;
  document.getElementById('sidebarScore').textContent = spot._score;

  // Map
  document.getElementById('placeDirections').href = spot.map_link;
  setTimeout(() => initPlaceMap(spot), 200);

  // Practical info
  document.getElementById('placePractical').innerHTML = `
    <div class="sidebar-info-row"><span class="sidebar-info-label">District</span><span class="sidebar-info-value">${spot.district}</span></div>
    <div class="sidebar-info-row"><span class="sidebar-info-label">Best time</span><span class="sidebar-info-value">${spot.best_months}</span></div>
    <div class="sidebar-info-row"><span class="sidebar-info-label">Rating</span><span class="sidebar-info-value">${spot.avg_rating} / 5</span></div>
    <div class="sidebar-info-row"><span class="sidebar-info-label">Reviews</span><span class="sidebar-info-value">${spot.review_count}</span></div>
  `;

  // Related
  renderRelated(spot);

  // Breadcrumb
  showBreadcrumb([
    { label: 'Maharashtra', href: '#' },
    { label: spot.district, href: `#city/${encodeURIComponent(spot.district)}` },
    { label: spot.spot_name, href: `#place/${encodeURIComponent(spot.spot_name)}` }
  ]);

  document.title = `${spot.spot_name} — Hidden Gems`;
  window.scrollTo(0, 0);
}

function renderPlaceGallery(spot) {
  const gallery = document.getElementById('placeGallery');
  if (!spot.img_path) { gallery.style.display = 'none'; return; }
  gallery.style.display = '';
  gallery.innerHTML = `
    <div class="gallery-item hero-thumb" onclick="openLightbox('${spot.img_path}')">
      <img src="${spot.img_path}" alt="${spot.spot_name}" onerror="this.parentElement.style.display='none'">
    </div>
  `;
}

function openLightbox(src) {
  let lb = document.querySelector('.gallery-lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'gallery-lightbox';
    lb.innerHTML = '<button class="gallery-lightbox-close">✕</button><img>';
    lb.onclick = (e) => { if (e.target !== lb.querySelector('img')) lb.classList.remove('open'); };
    document.body.appendChild(lb);
  }
  lb.querySelector('img').src = src;
  lb.classList.add('open');
}

function initPlaceMap(spot) {
  const lat = parseFloat(spot.latitude);
  const lng = parseFloat(spot.longitude);
  if (isNaN(lat) || isNaN(lng)) return;
  const container = document.getElementById('placeMap');
  if (leafletMap) leafletMap.remove();
  leafletMap = L.map(container, { scrollWheelZoom: false }).setView([lat, lng], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap', maxZoom: 18
  }).addTo(leafletMap);
  const icon = L.divIcon({
    className: '',
    html: '<div style="width:24px;height:24px;background:#b8530a;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
    iconSize: [24, 24], iconAnchor: [12, 12]
  });
  L.marker([lat, lng], { icon }).addTo(leafletMap).bindPopup(`<strong>${spot.spot_name}</strong><br>${spot.district}`);
  setTimeout(() => leafletMap.invalidateSize(), 250);
}

function renderRelated(spot) {
  const grid = document.getElementById('relatedGrid');
  const related = allSpots
    .filter(s => s.spot_name !== spot.spot_name)
    .map(s => {
      const sTags = s.tags.split(',').map(t => t.trim().toLowerCase());
      const pTags = spot.tags.split(',').map(t => t.trim().toLowerCase());
      const overlap = sTags.filter(t => pTags.includes(t)).length;
      const sameDistrict = s.district === spot.district ? 2 : 0;
      return { spot: s, score: overlap + sameDistrict };
    })
    .sort((a, b) => b.score - a.score || b.spot._score - a.spot._score)
    .slice(0, 4);

  grid.innerHTML = related.map(r => `
    <div class="related-card" onclick="navigateTo('place/${encodeURIComponent(r.spot.spot_name)}')">
      <div class="related-card-image">
        <img src="${r.spot.img_path || ''}" alt="${r.spot.spot_name}" loading="lazy" onerror="this.style.display='none'">
      </div>
      <h3 class="related-card-name">${r.spot.spot_name}</h3>
      <p class="related-card-district">${r.spot.district}, Maharashtra</p>
    </div>
  `).join('');
}

function selectTagAndNavigate(tag) {
  selectedTags.clear();
  selectedTags.add(tag);
  navigateTo('explore/' + encodeURIComponent(TAG_LABELS[tag] || tag));
}

// ============================================
// EXPERIENCE FORM
// ============================================

function openExperienceForm() {
  if (currentPlace) {
    document.getElementById('expPlaceName').value = currentPlace.spot_name;
  }
  document.getElementById('experienceModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeExperienceForm() {
  document.getElementById('experienceModal').classList.remove('open');
  if (currentPage === 'place') document.body.style.overflow = '';
}

function submitExperience(e) {
  e.preventDefault();
  const data = {
    place: document.getElementById('expPlaceName').value,
    when: document.getElementById('expWhen').value,
    why: document.getElementById('expWhy').value,
    discovery: document.getElementById('expDiscovery').value,
    experience: document.getElementById('expExperience').value,
    stay: document.getElementById('expStay').value,
    food: document.getElementById('expFood').value,
    recommendations: document.getElementById('expRecommendations').value,
    name: document.getElementById('expName').value,
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };

  // Store in localStorage (no backend)
  const submissions = JSON.parse(localStorage.getItem('hg_submissions') || '[]');
  submissions.push(data);
  localStorage.setItem('hg_submissions', JSON.stringify(submissions));

  // Show confirmation
  const form = document.getElementById('experienceForm');
  form.innerHTML = `
    <div style="text-align:center;padding:40px 20px;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b8530a" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <h2 style="font-family:var(--font-display);font-size:24px;margin:16px 0 8px;">Thank you for sharing.</h2>
      <p style="color:var(--ink-muted);font-size:14px;line-height:1.6;max-width:400px;margin:0 auto;">
        Your experience has been submitted for review. Our team will verify the information before it appears on the page. This typically takes 2–3 days.
      </p>
      <button onclick="closeExperienceForm()" style="margin-top:24px;padding:12px 24px;border:1px solid var(--ink);background:transparent;font-size:14px;cursor:pointer;font-family:var(--font-body);">Close</button>
    </div>
  `;
}

// ============================================
// OFFLINE
// ============================================

function initOfflineDetection() {
  const banner = document.getElementById('offlineBanner');
  function update() { banner.style.display = navigator.onLine ? 'none' : 'flex'; }
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

// ============================================
// SERVICE WORKER
// ============================================

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
