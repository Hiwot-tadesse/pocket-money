const express = require('express');
const { getPredictions } = require('../controllers/prediction.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getPredictions);

module.exports = router;
