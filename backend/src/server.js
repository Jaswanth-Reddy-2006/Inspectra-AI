require('dotenv').config();
const express = require('express');
const cors = require('cors');
<<<<<<< HEAD
const scanRoutes = require('./routes/scan');
=======

const scanRoutes = require('./routes/scan');
const discoveryRoutes = require('./routes/discovery');
const authRoutes = require('./routes/auth');
const classifierRoutes = require('./routes/classifier');
const domRoutes = require('./routes/dom');
const networkRoutes = require('./routes/network');
const perfRoutes = require('./routes/perf');
const functionalRoutes = require('./routes/functional');
const visualRoutes = require('./routes/visual');
const defectRoutes = require('./routes/defects');
const severityRoutes = require('./routes/severity');
const hygieneRoutes = require('./routes/hygiene');
const riskRoutes = require('./routes/risk');
>>>>>>> localcode

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
<<<<<<< HEAD
app.use(express.json());

// Routes
app.use('/api/scan', scanRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(PORT, () => {
    console.log(`AutoQA Backend running on port ${PORT}`);
=======
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/scan', scanRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/classifier', classifierRoutes);
app.use('/api/dom', domRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/perf', perfRoutes);
app.use('/api/functional', functionalRoutes);
app.use('/api/visual', visualRoutes);
app.use('/api/defects', defectRoutes);
app.use('/api/severity', severityRoutes);
app.use('/api/hygiene', hygieneRoutes);
app.use('/api/risk', riskRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'OK', ts: new Date().toISOString() }));

app.listen(PORT, () => {
    console.log(`Inspectra AI Backend — port ${PORT}`);
>>>>>>> localcode
});
