const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const {
  hashFlightManifest,
  hashAdsbPing,
  FlightEscrow,
  FlightRegistry
} = require('../core');
const { startWakeLockDaemon } = require('./wakeLock');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const webDistPath = path.join(__dirname, '../web');
app.use(express.static(webDistPath));

// Health check endpoint for Render and WakeLock
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'AeroLease Dubai Aviation Gateway',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memoryRssMb: parseFloat((process.memoryUsage().rss / 1024 / 1024).toFixed(2))
  });
});

app.get('/api/config', (req, res) => {
  res.status(200).json({
    appName: 'AeroLease Dubai',
    version: '1.0.0',
    authority: 'UAE General Civil Aviation Authority (GCAA)',
    escrowModel: 'Tri-Stage 20/30/50 Milestone',
    adminContact: '+971508379080',
    mode: process.env.NODE_ENV || 'production'
  });
});

app.post('/api/flight/manifest', (req, res) => {
  try {
    const manifestHash = hashFlightManifest(req.body);
    res.status(200).json({ success: true, manifestHash });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// SPA catch-all (Express 5 safe)
app.use((req, res) => {
  res.sendFile(path.join(webDistPath, 'index.html'));
});

let server = null;
if (require.main === module) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AeroLease Server] Running on http://0.0.0.0:${PORT}`);
    startWakeLockDaemon();
  });
}

module.exports = { app, server };
