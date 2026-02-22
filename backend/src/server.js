require('dotenv').config();
const express = require('express');
const cors = require('cors');
const scanRoutes = require('./routes/scan');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/scan', scanRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(PORT, () => {
    console.log(`AutoQA Backend running on port ${PORT}`);
});
