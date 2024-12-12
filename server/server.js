const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // Import the path module

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve React static files from the dist directory
app.use(express.static(path.join(__dirname, '../client/npm/dist')));

// Catch-all route to serve the React app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/npm/dist', 'index.html'));
});

// app.get('/', (req, res) => {
//     res.send('Welcome to the Enterprise Node.js and React Application');
// });

app.get('/api', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
