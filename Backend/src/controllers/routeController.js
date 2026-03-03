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
  const token = process.env.MAPBOX_TOKEN;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}`;
  const response = await axios.get(url, {
    params: {
      geometries: 'geojson',
      access_token: token,
    },
  });
  const route = response.data.routes?.[0];
  res.json({ route });
});

module.exports = { directions, geocodeSearch };
