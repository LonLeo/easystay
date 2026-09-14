require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    if (['POST', 'PUT'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) {
        return res.status(400).json({ success: false, message: 'A JSON object body is required.' });
    }
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/favourites', require('./routes/favourites'));
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/readiness', require('./routes/readiness'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use((err, req, res, next) => {
    const status = err.type === 'entity.parse.failed' ? 400 : err.type === 'entity.too.large' ? 413 : 500;
    res.status(status).json({ success: false, message: status === 400 ? 'Invalid JSON body.' : status === 413 ? 'Request body too large.' : 'Internal server error.' });
});


module.exports = app;
