const axios = require('axios');
const asyncHandler = require('../utils/asyncHandler');

const isPlaceholderToken = (token = '') => {
  const value = String(token).trim().toLowerCase();
  return !value || value.includes('your-mapbox-token');
};

const searchWithMapbox = async ({ q, token, proximity, language, country, types }) => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`;
  const response = await axios.get(url, {
    params: {
      access_token: token,
      autocomplete: true,
      fuzzyMatch: true,
      language,
      limit: 10,
      ...(country ? { country } : {}),
      ...(types ? { types } : {}),
      ...(proximity ? { proximity } : {}),
    },
  });

  return Array.isArray(response.data?.features) ? response.data.features : [];
};

const searchWithNominatim = async ({ q, country, language }) => {
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      q,
      format: 'jsonv2',
      limit: 10,
      addressdetails: 1,
      ...(country ? { countrycodes: country.toLowerCase() } : {}),
      ...(language ? { 'accept-language': language } : {}),
    },
    headers: {
      'User-Agent': 'csp-backend/1.0 (map-search-fallback)',
    },
  });

  const rows = Array.isArray(response.data) ? response.data : [];
  return rows
    .map((item) => {
      const lon = Number(item?.lon);
      const lat = Number(item?.lat);
      if (Number.isNaN(lon) || Number.isNaN(lat)) return null;
      return {
        id: `osm-${item.place_id || `${lon}-${lat}`}`,
        text: item.name || item.display_name || 'Place',
        place_name: item.display_name || item.name || '',
        center: [lon, lat],
      };
    })
    .filter(Boolean);
};

const geocodeSearch = asyncHandler(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q) {
    return res.status(400).json({ message: 'Missing search query' });
  }

  const token = String(process.env.MAPBOX_TOKEN || '').trim();

  const proximity = typeof req.query.proximity === 'string' ? req.query.proximity.trim() : '';
  const language = typeof req.query.language === 'string' ? req.query.language.trim() : 'en';
  const country = typeof req.query.country === 'string' ? req.query.country.trim() : '';
  const types = typeof req.query.types === 'string' ? req.query.types.trim() : '';

  let features = [];
  if (!isPlaceholderToken(token)) {
    try {
      features = await searchWithMapbox({ q, token, proximity, language, country, types });
    } catch {
      features = [];
    }
  }

  if (!features.length) {
    features = await searchWithNominatim({ q, country, language });
  }

  res.json({ features });
});

const directions = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ message: 'Missing coordinates' });
  }
  const token = String(process.env.MAPBOX_TOKEN || '').trim();
  const startParts = String(start).split(',').map((item) => Number(item));
  const endParts = String(end).split(',').map((item) => Number(item));
  const startCoordValid = startParts.length === 2 && !Number.isNaN(startParts[0]) && !Number.isNaN(startParts[1]);
  const endCoordValid = endParts.length === 2 && !Number.isNaN(endParts[0]) && !Number.isNaN(endParts[1]);

  if (isPlaceholderToken(token) || !startCoordValid || !endCoordValid) {
    const geometry = {
      type: 'LineString',
      coordinates: startCoordValid && endCoordValid ? [startParts, endParts] : [],
    };
    return res.json({ route: { geometry, distance: null, duration: null, source: 'fallback' } });
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}`;
  try {
    const response = await axios.get(url, {
      params: {
        geometries: 'geojson',
        access_token: token,
      },
    });
    const route = response.data.routes?.[0];
    if (!route) {
      const geometry = {
        type: 'LineString',
        coordinates: [startParts, endParts],
      };
      return res.json({ route: { geometry, distance: null, duration: null, source: 'fallback' } });
    }
    return res.json({ route: { ...route, source: 'mapbox' } });
  } catch {
    const geometry = {
      type: 'LineString',
      coordinates: [startParts, endParts],
    };
    return res.json({ route: { geometry, distance: null, duration: null, source: 'fallback' } });
  }
});

module.exports = { directions, geocodeSearch };
