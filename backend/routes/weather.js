const express = require('express');
const router = express.Router();

// Current weather for location
router.get('/current', (req,res) => {
    res.send('get Current weather');
});

// Multi-day forecast for location
router.get('/forecast', (req,res) => {
    res.send('Get forecast');
});

// Hourly forecast for location
router.get('/hourly', (req,res) => {
    res.send('Get hourly');
});

//  Weather alerts for location
router.get('/alerts', (req,res) => {
    res.send('GEt alerts');
});

// Air quality index for location
router.get('/air-quality', (req,res) => {
    res.send('Get Air quality');
});


module.exports = router;