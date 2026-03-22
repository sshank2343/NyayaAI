const express = require('express');
const router = express.Router();
const { handleSearchQuery, getUserHistory, deleteHistoryItem } = require('../controllers/queryController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, handleSearchQuery);
router.get('/history', protect, getUserHistory);
router.delete('/history/:id', protect, deleteHistoryItem);


module.exports = router;