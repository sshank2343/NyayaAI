const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshAccessToken, logoutUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/refresh', refreshAccessToken); // Route to ask for a new token
router.post('/logout', logoutUser);         // Route to kill the session

module.exports = router;