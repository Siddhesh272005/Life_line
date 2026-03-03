const express = require('express');
const { directions, geocodeSearch } = require('../controllers/routeController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/directions', auth, directions);
router.get('/geocode/search', auth, geocodeSearch);

module.exports = router;
