const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

const userRoutes = require('./routes/users');

app.use('/api/user/', userRoutes);

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