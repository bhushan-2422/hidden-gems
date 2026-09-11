/* ============================================
   Hidden Gems — Complete Application
   Updated for new CSV format (50+ columns)
   ============================================ */

let allSpots = [];
let carouselSpots = [];
let currentSlide = 0;
let carouselTimer = null;
let selectedTags = new Set();
let leafletMap = null;
let currentPage = 'home';
let currentCity = null;
let currentPlace = null;

const CATEGORY_ICONS = {
  'Culture': 'Culture', 'Heritage': 'Heritage', 'Nature': 'Nature',
  'Adventure': 'Adventure', 'Food': 'Food', 'Spiritual': 'Spiritual',
  'Unique Experience': 'Unique', 'default': 'Destination'
};

const PLACE_TYPE_ICONS = {
  'EXPERIENCE': 'Experience', 'HERITAGE_SITE': 'Heritage', 'NATURE_SITE': 'Nature',
  'TRAIL': 'Trail', 'VIEWPOINT': 'Viewpoint', 'VILLAGE': 'Village',
  'EVENT': 'Event', 'PLACE': 'Place', 'default': 'Destination'
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  const loaded = await loadSpots();
  allSpots = loaded.filter(spot => !isSpotRemoved(spot));
  computeGemScores();
  initCarousel();
  initAuthenticityImages();
  initCityCards();
  initSearchOverlay();
  initRouting();
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
// SEARCH
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
    const haystack = (
      s.spot_name + ' ' + s.district + ' ' + s.region + ' ' + s.category +
      s.recommendation_tags + ' ' + s.short_description + ' ' + s.experience_type
    ).toLowerCase();
    return haystack.includes(q);
  });
  if (results.length === 0) {
    container.innerHTML = '<p style="padding:12px 0;color:var(--ink-muted);font-size:14px;">No destinations found.</p>';
    return;
  }
  container.innerHTML = results.map(s => `
    <div class="search-result-item" onclick="navigateTo('place/${encodeURIComponent(s.spot_name)}'); toggleSearch();">
      <span class="search-result-name">${s.spot_name}</span>
      <span class="search-result-district">${s.region || s.district}</span>
    </div>
  `).join('');
}

// ============================================
// HIDDEN GEM SCORE
// ============================================

function computeGemScores() {
  allSpots.forEach(spot => {
    const csvScore = parseInt(spot.hidden_gem_score);
    if (!isNaN(csvScore)) {
      spot._score = csvScore;
    } else {
      const rating = parseFloat(spot.experience_score) || 0;
      const reviews = parseInt(spot.verification_confidence) || 1;
      spot._score = Math.round((rating / Math.log(reviews + 1)) * 10);
    }
  });
  const scores = allSpots.map(s => s._score);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const range = max - min || 1;
  allSpots.forEach(spot => {
    spot._normalized = Math.round(((spot._score - min) / range) * 100);
  });
}

function getTags(spot) {
  return (spot.recommendation_tags || '').split('|').map(t => t.trim()).filter(Boolean);
}

function getDisplayCategory(spot) {
  return spot.category || spot.experience_type || 'Destination';
}

// ============================================
// HERO CAROUSEL
// ============================================

function initCarousel() {
  const track = document.getElementById('carouselTrack');
  carouselSpots = allSpots.filter(spot => getSpotImage(spot));
  if (carouselSpots.length === 0) {
    track.innerHTML = '<div class="carousel-slide active"><div class="carousel-placeholder"></div></div>';
    return;
  }
  track.innerHTML = carouselSpots.map((spot, i) => `
    <div class="carousel-slide ${i === 0 ? 'active' : ''}">
      <img src="${getSpotImage(spot)}" alt="${spot.spot_name}" loading="lazy">
    </div>
  `).join('');
  updateCaption();
  startCarousel();
}

const REMOVED_DESTINATIONS = [
  'mahabaleshwar', 'vasota fort', 'tikona', 'trimbakeshwar mahadev temple',
  'kondane caves', 'koyna wildlife sanctuary'
];

const REMOVED_REGIONS = ['mahabaleshwar'];

function isSpotRemoved(spot) {
  const name = (spot.spot_name || '').toLowerCase();
  const region = (spot.region || '').toLowerCase();
  if (REMOVED_REGIONS.includes(region)) return true;
  return REMOVED_DESTINATIONS.some(d => name.includes(d));
}

function getSpotImages(spot) {
  const imgs = [];
  if (spot.img1 && spot.img1.trim()) imgs.push(spot.img1.trim());
  if (spot.img2 && spot.img2.trim()) imgs.push(spot.img2.trim());
  return imgs;
}

function getSpotImage(spot) {
  const imgs = getSpotImages(spot);
  if (imgs.length > 0) return imgs[0];
  return '';
}

function updateCaption() {
  const spot = carouselSpots[currentSlide];
  if (!spot) return;
  document.getElementById('carouselCaption').textContent =
    `${spot.spot_name} — ${spot.region || spot.district}, Maharashtra`;
  document.getElementById('carouselProgress').style.width =
    (((currentSlide + 1) / carouselSpots.length) * 100) + '%';
}

function goToSlide(index) {
  document.querySelectorAll('.carousel-slide').forEach((s, i) => s.classList.toggle('active', i === index));
  currentSlide = index;
  updateCaption();
}

function nextSlide() { goToSlide((currentSlide + 1) % carouselSpots.length); resetCarouselTimer(); }
function prevSlide() { goToSlide((currentSlide - 1 + carouselSpots.length) % carouselSpots.length); resetCarouselTimer(); }
function startCarousel() { carouselTimer = setInterval(nextSlide, 5000); }
function resetCarouselTimer() { clearInterval(carouselTimer); startCarousel(); }

// ============================================
// AUTHENTICITY IMAGES
// ============================================

function initAuthenticityImages() {
  const spots = allSpots.filter(s => getSpotImage(s)).slice(0, 3);
  const els = ['authImg1', 'authImg2', 'authImg3'];
  els.forEach((id, i) => {
    const el = document.getElementById(id);
    if (spots[i]) {
      el.style.backgroundImage = `url(${getSpotImage(spots[i])})`;
    } else {
      el.classList.add('auth-img-placeholder');
    }
  });
}

// ============================================
// CITY CARDS (homepage)
// ============================================

function initCityCards() {
  const track = document.getElementById('citiesTrack');
  const regionMap = {};
  allSpots.forEach(spot => {
    const r = spot.region || spot.district || 'Unknown';
    if (!regionMap[r]) regionMap[r] = [];
    regionMap[r].push(spot);
  });
  const cities = Object.entries(regionMap).sort((a, b) => b[1].length - a[1].length);
  track.innerHTML = cities.map(([region, spots]) => {
    const img = getSpotImage(spots[0]);
    const imgStyle = img ? `background-image:url('${img}')` : '';
    const imgClass = img ? 'city-card-image' : 'city-card-image city-card-image-placeholder';
    return `
    <div class="city-card" onclick="navigateTo('city/${encodeURIComponent(region)}')">
      <div class="${imgClass}" style="${imgStyle}">
        <div class="city-card-overlay"></div>
      </div>
      <div class="city-card-info">
        <div class="city-card-name">${region}</div>
        <div class="city-card-count">${spots.length} hidden ${spots.length === 1 ? 'gem' : 'gems'}</div>
      </div>
    </div>
  `; }).join('');
}

function scrollCities(dir) {
  document.getElementById('citiesTrack').scrollBy({ left: dir * 300, behavior: 'smooth' });
}

// ============================================
// TAG DISCOVERY
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
  const label = [...selectedTags].join(' + ');
  navigateTo('explore/' + encodeURIComponent(label));
}

function showTagResults(title) {
  document.getElementById('tagResultsTitle').textContent = title;
  document.getElementById('tagResultsDesc').textContent = 'Places matching your interests from the Hidden Gems dataset.';

  const spots = allSpots.filter(spot => {
    const tags = getTags(spot).map(t => t.toLowerCase());
    return [...selectedTags].some(t => tags.includes(t.toLowerCase()));
  }).sort((a, b) => b._normalized - a._normalized);

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
  document.getElementById('tagResultsPage').style.display = '';
  document.title = `${title} — Hidden Gems`;
  window.scrollTo(0, 0);
}

function selectTagAndNavigate(tag) {
  selectedTags.clear();
  selectedTags.add(tag);
  navigateTo('explore/' + encodeURIComponent(tag));
}

// ============================================
// CITY PAGE
// ============================================

function showCityPage(region) {
  const spots = allSpots.filter(s => (s.region || s.district) === region);
  if (spots.length === 0) { showHomePage(); return; }

  currentCity = region;
  currentPage = 'city';

  document.getElementById('homeSections').style.display = 'none';
  document.getElementById('placePage').style.display = 'none';
  document.getElementById('tagResultsPage').style.display = 'none';

  const page = document.getElementById('cityPage');
  page.style.display = '';

  const heroImg = getSpotImage(spots[0]);
  const cityHeroImg = document.getElementById('cityHeroImg');
  if (heroImg) {
    cityHeroImg.src = heroImg;
    cityHeroImg.style.display = '';
  } else {
    cityHeroImg.style.display = 'none';
  }
  document.getElementById('cityEyebrow').textContent = 'MAHARASHTRA';
  document.getElementById('cityTitle').textContent = region;
  document.getElementById('citySubtitle').textContent = 'Discover the places beyond the usual recommendations.';

  document.getElementById('cityIntro').innerHTML =
    `<p>Exploring the hidden gems of ${region} — places that are genuinely worth visiting but relatively unknown to mainstream tourism.</p>`;

  document.getElementById('cityGemsTitle').textContent = `Hidden Gems in ${region}`;
  document.getElementById('cityGemsDesc').textContent =
    `${spots.length} verified ${spots.length === 1 ? 'place' : 'places'} documented by real experiences.`;

  // Tags filter
  const allTags = new Set();
  spots.forEach(s => getTags(s).forEach(t => allTags.add(t.toLowerCase())));
  const tagList = document.getElementById('cityTagList');
  tagList.innerHTML = '';
  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'city-tag-btn';
    btn.dataset.tag = tag;
    btn.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
    btn.onclick = () => { btn.classList.toggle('active'); filterCityGems(); };
    tagList.appendChild(btn);
  });

  renderCityGems(spots);

  showBreadcrumb([
    { label: 'Maharashtra', href: '#' },
    { label: region, href: `#city/${encodeURIComponent(region)}` }
  ]);

  document.title = `${region} — Hidden Gems`;
  window.scrollTo(0, 0);
}

function renderCityGems(spots) {
  document.getElementById('cityGemsGrid').innerHTML =
    spots.map(spot => createCityGemCard(spot)).join('');
}

function createCityGemCard(spot) {
  const tags = getTags(spot).slice(0, 3);
  const img = getSpotImage(spot);
  const imgSection = img
    ? `<div class="city-gem-image"><img src="${img}" alt="${spot.spot_name}" loading="lazy"><span class="gem-score-badge">${spot._normalized}</span></div>`
    : `<div class="city-gem-image city-gem-image-placeholder"><span class="gem-score-badge">${spot._normalized}</span></div>`;
  return `
    <div class="city-gem-card" onclick="navigateTo('place/${encodeURIComponent(spot.spot_name)}')">
      ${imgSection}
      <h3 class="city-gem-name">${spot.spot_name}</h3>
      <p class="city-gem-district">${spot.region || spot.district}, Maharashtra</p>
      <p class="city-gem-desc">${spot.short_description || ''}</p>
      <div class="city-gem-tags">
        ${tags.map(t => `<span class="city-gem-tag">${t}</span>`).join('')}
      </div>
    </div>
  `;
}

function filterCityGems() {
  const activeTags = [...document.querySelectorAll('.city-tag-btn.active')].map(b => b.dataset.tag);
  let spots = allSpots.filter(s => (s.region || s.district) === currentCity);
  if (activeTags.length > 0) {
    spots = spots.filter(spot => {
      const tags = getTags(spot).map(t => t.toLowerCase());
      return activeTags.some(t => tags.includes(t));
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
  const placeImg = getSpotImage(spot);
  const placeHeroImg = document.getElementById('placeHeroImg');
  if (placeImg) {
    placeHeroImg.src = placeImg;
    placeHeroImg.style.display = '';
  } else {
    placeHeroImg.style.display = 'none';
  }
  document.getElementById('placeCategory').textContent =
    spot.experience_type || spot.category || PLACE_TYPE_ICONS[spot.place_type] || 'Destination';
  document.getElementById('placeTitle').textContent = spot.spot_name;
  document.getElementById('placeLocation').textContent =
    `${spot.region || spot.district}${spot.nearest_city ? ' — near ' + spot.nearest_city : ''}, Maharashtra`;

  // Gallery
  renderPlaceGallery(spot);

  // Tags
  const tags = getTags(spot);
  document.getElementById('placeTags').innerHTML = tags.map(t =>
    `<a class="place-tag" href="#explore/${encodeURIComponent(t)}" onclick="selectTagAndNavigate('${t.replace(/'/g, "\\'")}'); return false;">${t}</a>`
  ).join('');

  // Description
  document.getElementById('placeDescription').textContent =
    spot.short_description || 'No description available.';

  // Why visit
  document.getElementById('placeWhyVisit').textContent =
    spot.why_visit || spot.hidden_gem_reason || 'This is a verified hidden gem worth discovering.';

  // Local tip
  const tipEl = document.getElementById('placeLocalTip');
  if (spot.local_tip) {
    tipEl.parentElement.style.display = '';
    tipEl.textContent = spot.local_tip;
  } else {
    tipEl.parentElement.style.display = 'none';
  }

  // Our experience
  document.getElementById('placeExperience').textContent =
    spot.verification_notes || `We visited ${spot.spot_name} as part of our effort to document Maharashtra's overlooked destinations.`;

  // Score
  document.getElementById('placeDetailRating').textContent = spot.experience_score || '—';
  document.getElementById('placeDetailReviews').textContent = spot.verification_confidence || '—';
  document.getElementById('placeDetailRaw').textContent = spot._score;
  document.getElementById('placeDetailNormalized').textContent = spot._normalized;
  document.getElementById('sidebarScore').textContent = spot._normalized;

  // Map
  if (spot.latitude && spot.longitude && spot.latitude !== 'NULL' && spot.longitude !== 'NULL') {
    document.getElementById('placeMapSection').style.display = '';
    document.getElementById('placeDirections').href = spot.map_link ||
      `https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`;
    setTimeout(() => initPlaceMap(spot), 200);
  } else {
    document.getElementById('placeMapSection').style.display = 'none';
  }

  // Practical info
  const practical = document.getElementById('placePractical');
  const infoRows = [
    ['Region', spot.region],
    ['District', spot.district],
    ['Nearest city', spot.nearest_city],
    ['Best season', spot.best_season || spot.best_months],
    ['Best time of day', spot.best_time_of_day],
    ['Duration', spot.estimated_visit_duration],
    ['Entry fee', spot.entry_fee],
    ['Accessibility', spot.accessibility_status || spot.accessibility],
    ['Safety', spot.safety_level],
    ['Crowd level', spot.crowd_level],
    ['Popularity', spot.popularity_level],
    ['Family friendly', spot.family_friendly],
    ['Solo friendly', spot.solo_friendly],
  ].filter(([_, val]) => val && val !== 'NULL' && val !== 'Unknown');

  practical.innerHTML = infoRows.map(([label, val]) =>
    `<div class="sidebar-info-row"><span class="sidebar-info-label">${label}</span><span class="sidebar-info-value">${val}</span></div>`
  ).join('');

  // Safety note
  const safetyEl = document.getElementById('placeSafetyNote');
  if (spot.safety_note && spot.safety_note !== 'NULL') {
    safetyEl.parentElement.style.display = '';
    safetyEl.textContent = spot.safety_note;
  } else {
    safetyEl.parentElement.style.display = 'none';
  }

  // Events
  const eventsEl = document.getElementById('placeEvents');
  if (spot.place_type === 'EVENT') {
    eventsEl.innerHTML = `
      <div class="place-event-card">
        <h4>${spot.spot_name}</h4>
        <p>${spot.short_description || ''}</p>
        <span class="event-season">${spot.best_months || spot.best_season || ''}</span>
      </div>
    `;
  } else {
    eventsEl.innerHTML = '<div class="place-empty-state"><p>Local events will appear here as we document them.</p></div>';
  }

  // Sources
  const sourcesEl = document.getElementById('placeSources');
  const sources = [];
  if (spot.source_1_name && spot.source_1_url && spot.source_1_url !== 'NULL') {
    sources.push({ name: spot.source_1_name, url: spot.source_1_url });
  }
  if (spot.source_2_name && spot.source_2_url && spot.source_2_url !== 'NULL') {
    sources.push({ name: spot.source_2_name, url: spot.source_2_url });
  }
  if (spot.source_3_name && spot.source_3_url && spot.source_3_url !== 'NULL') {
    sources.push({ name: spot.source_3_name, url: spot.source_3_url });
  }
  if (sources.length > 0) {
    sourcesEl.innerHTML = sources.map(s =>
      `<a href="${s.url}" target="_blank" rel="noopener" class="source-link">${s.name}</a>`
    ).join('');
  } else {
    sourcesEl.innerHTML = '<span class="source-link muted">No sources available</span>';
  }

  // Related
  renderRelated(spot);

  // Breadcrumb
  showBreadcrumb([
    { label: 'Maharashtra', href: '#' },
    { label: spot.region || spot.district, href: `#city/${encodeURIComponent(spot.region || spot.district)}` },
    { label: spot.spot_name, href: `#place/${encodeURIComponent(spot.spot_name)}` }
  ]);

  document.title = `${spot.spot_name} — Hidden Gems`;
  window.scrollTo(0, 0);
}

function renderPlaceGallery(spot) {
  const gallery = document.getElementById('placeGallery');
  const images = getSpotImages(spot);
  if (images.length === 0) {
    gallery.style.display = 'none';
    return;
  }
  gallery.style.display = '';
  gallery.innerHTML = images.map((img, i) => `
    <div class="gallery-item${i === 0 ? ' hero-thumb' : ''}" onclick="openLightbox('${img}')">
      <img src="${img}" alt="${spot.spot_name}" loading="lazy">
    </div>
  `).join('');
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
  leafletMap = L.map(container, { scrollWheelZoom: false }).setView([lat, lng], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap', maxZoom: 18
  }).addTo(leafletMap);
  const icon = L.divIcon({
    className: '',
    html: '<div style="width:24px;height:24px;background:#b8530a;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
    iconSize: [24, 24], iconAnchor: [12, 12]
  });
  L.marker([lat, lng], { icon }).addTo(leafletMap)
    .bindPopup(`<strong>${spot.spot_name}</strong><br>${spot.region || spot.district}`);
  setTimeout(() => leafletMap.invalidateSize(), 250);
}

function renderRelated(spot) {
  const grid = document.getElementById('relatedGrid');
  const spotTags = getTags(spot).map(t => t.toLowerCase());
  const related = allSpots
    .filter(s => s.spot_name !== spot.spot_name)
    .map(s => {
      const sTags = getTags(s).map(t => t.toLowerCase());
      const overlap = sTags.filter(t => spotTags.includes(t)).length;
      const sameRegion = (s.region === spot.region) ? 2 : 0;
      return { spot: s, score: overlap + sameRegion };
    })
    .sort((a, b) => b.score - a.score || b.spot._normalized - a.spot._normalized)
    .slice(0, 4);

  grid.innerHTML = related.map(r => {
    const img = getSpotImage(r.spot);
    const imgSection = img
      ? `<div class="related-card-image"><img src="${img}" alt="${r.spot.spot_name}" loading="lazy"></div>`
      : `<div class="related-card-image related-card-image-placeholder"></div>`;
    return `
    <div class="related-card" onclick="navigateTo('place/${encodeURIComponent(r.spot.spot_name)}')">
      ${imgSection}
      <h3 class="related-card-name">${r.spot.spot_name}</h3>
      <p class="related-card-district">${r.spot.region || r.spot.district}, Maharashtra</p>
    </div>
  `; }).join('');
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

  const submissions = JSON.parse(localStorage.getItem('hg_submissions') || '[]');
  submissions.push(data);
  localStorage.setItem('hg_submissions', JSON.stringify(submissions));

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
// SERVICE WORKER (caching for performance)
// ============================================

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
