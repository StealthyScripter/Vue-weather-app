const express = require('express');
const router = express.Router();

// Get weather predictions along route
router.post('/predict', (req,res) => {
    res.send('POST predict');
});

// Save route weather prediction
router.post('/save', (req,res) => {
    res.send('POST save route weather');
});

// Get saved route weather prediction
router.get('/saved/:id', (req,res) => {
    res.send('get saved route weather ');
});

// Delete saved route prediction
router.delete('/saved/:id', (req,res) => {
    res.send('delete route weather');
});

module.exports = router;

