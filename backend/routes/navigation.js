const express = require('express');
const router = express.Router();

// Calculate route between points
router.post('/plan', (req,res) => {
    res.send('POST route plan');
}); 

// Get turn-by-turn directions
router.get('/directions', (req,res) => {
    res.send('Get directions');
});

// Optimize route for weather
router.post('/optimize', (req,res) => {
    res.send('POST optimize route');
});

// Get traffic conditions
router.post('/traffic', (req,res) => {
    res.send('POST traffic');
});

module.exports = router;