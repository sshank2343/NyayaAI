const express = require('express');
const router = express.Router();
const { handleSearchQuery } = require('../controllers/queryController');

router.post('/', handleSearchQuery);


module.exports = router;