const express = require('express');
const router = express.Router();

// GET request to fetch user profile data
router.get('/profile', (req, res) => {
  res.send('GET User Profile');
});

// PUT request to update user profile data
router.put('/profile', (req, res) => {
  res.send('PUT user profile');
});

// GET request to retrieve user preferences
router.get('/preferences', (req, res) => {
  res.send('GET user preferences');
});

// PUT request to update user preferences
router.put('/preferences', (req, res) => {
  res.send('PUT user preference');
});

// GET request to retrieve user's route history
router.get('/routes/history', (req, res) => {
  res.send('GET routes history');
});

// GET request to fetch user's favorite items
router.get('/favorites', (req, res) => {
  res.send('GET favorites');
});

// POST request to add a new item to favorites
router.post('/favorites', (req, res) => {
  res.send('POST favorites');
});

// DELETE request to remove a favorite item by ID
router.delete('/favorites/:id', (req, res) => {
  res.send(`DELETE favorite with id ${req.params.id}`);
});

module.exports = router;
