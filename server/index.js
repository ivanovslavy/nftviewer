require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const nftRoutes = require('./routes/nfts');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3087;

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

// ── Error handler ───────────────────────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────
async function start() {
  try {
    // NFTs on public chains come from the Alchemy NFT API (ALCHEMY_API_KEY); Gemba chains from
    // Blockscout/RPC. Moralis was removed on 2026-11-10 after its free tier was withdrawn.
    const alchemyKeyCount = (process.env.ALCHEMY_API_KEYS || process.env.ALCHEMY_NFT_KEY || process.env.ALCHEMY_API_KEY || '')
      .split(/[,\s]+/).map((k) => k.trim()).filter(Boolean).length;
    if (alchemyKeyCount === 0) {
      console.warn('\n⚠️  No Alchemy key (ALCHEMY_API_KEYS) set — public-chain NFT lookups will be empty.');
      console.warn('   Gemba chains still work via Blockscout/RPC.\n');
    } else {
      console.log(`✓ NFT provider: Alchemy (${alchemyKeyCount} key${alchemyKeyCount > 1 ? 's, rotating' : ''})`);
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
