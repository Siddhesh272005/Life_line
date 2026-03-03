const express = require('express');
const { directions } = require('../controllers/routeController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/directions', auth, directions);

module.exports = router;
