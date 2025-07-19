const express = require('express');
const router = express.Router();

// Get user's current location
router.get('/current', (req,res) => {
    res.send('get current');
});

// Search locations by query
router.get('/search', (req,res) => {
    res.send('Get search');
});

//Convert address to coordinates
router.get('/geocode', (req,res) => {
    res.send('get geocode');
});

//Convert coordinates to address
router.get('/reverse', (req,res) => {
    res.send('get reverse');
});

module.exports = router;
