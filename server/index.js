require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const Moralis = require('moralis').default;
const nftRoutes = require('./routes/nfts');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Request logging ─────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ── API Routes ──────────────────────────────────────────
app.use('/api', nftRoutes);

// ── Health check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Serve React build in production ─────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// ── Error handler ───────────────────────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────
async function start() {
  try {
    if (!process.env.MORALIS_API_KEY || process.env.MORALIS_API_KEY === 'your_moralis_api_key_here') {
      console.warn('\n⚠️  MORALIS_API_KEY not set! Copy .env.example → .env and add your key.');
      console.warn('   Get one free at: https://admin.moralis.io/\n');
    } else {
      await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
      console.log('✓ Moralis SDK initialized');
    }

    app.listen(PORT, () => {
      console.log(`\n🖼  NFT Viewer API running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Chains: http://localhost:${PORT}/api/chains\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
