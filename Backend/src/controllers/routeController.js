const axios = require('axios');
const asyncHandler = require('../utils/asyncHandler');

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

module.exports = { directions };
