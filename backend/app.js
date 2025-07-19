const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

//Register routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const locationRoutes = require('./routes/location');
const navigationRoutes = require('./routes/navigation');
const routeWeatherRoutes = require('./routes/route-weather');
const weatherRoutes = require('./routes/weather');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/route-weather', routeWeatherRoutes);
app.use('/api/weather', weatherRoutes);

//Root endpoint
app.get('/', (req, res) => {
  res.send('Hello world');
});

//Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


app.listen(PORT, () => {
  console.log('Server is listening on port', PORT);

});