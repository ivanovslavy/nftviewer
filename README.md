# NFT Gallery Viewer

A multi-chain NFT gallery and metadata viewer with Moralis API integration, direct RPC fallback, and support for interactive HTML-based NFTs (ERC-721 / ERC-1155).

**Live instance:** [nftviewer.slavy.space](https://nftviewer.slavy.space)

## Overview

NFT Gallery Viewer is a full-stack application for browsing, inspecting, and rendering NFTs across multiple EVM-compatible blockchains. It provides three query modes — wallet address, contract address, or both combined — and renders rich metadata including images, attributes, animation content, and embedded HTML ticket viewers.

The application is designed to handle incomplete or delayed indexer data gracefully. When the Moralis API returns empty or partial results, the system falls back to direct RPC calls against on-chain contracts, fetches token URIs, resolves IPFS metadata, and enriches responses transparently.

## Architecture

```
Client (React 18 + Vite 6)
  |
  |-- REST API (/api/nfts/*)
  v
Server (Express.js, port 4002)
  |
  |-- Moralis Web3 API (primary indexer)
  |-- Direct RPC via ethers.js (fallback)
  |-- IPFS Gateway (metadata + media resolution)
  |-- HTML Proxy (/api/nfts/render — patches legacy NFT HTML)
```

## Features

- **Multi-chain support:** Ethereum, Sepolia, Polygon, BSC, localhost (Hardhat/Ganache)
- **Three query modes:** Wallet Address (WA), Contract Address (CA), or WA+CA combined with server-side filtering
- **Moralis + RPC dual-source:** Automatic fallback to direct contract calls when Moralis returns incomplete data
- **Metadata enrichment:** Fetches tokenURI from on-chain contracts when Moralis omits metadata fields (name, image, animation_url)
- **IPFS resolution:** Configurable gateway (default: self-hosted node) for `ipfs://` and `ar://` URI schemes
- **Lightbox detail view:** Full metadata display with attributes, contract links, explorer URLs, and raw JSON export
- **Interactive NFT rendering:** Detects `animation_url` HTML content and renders in embedded iframe with Image/Ticket view toggle
- **HTML proxy endpoint:** Fetches and patches legacy NFT HTML on the fly (navigation bug fixes, QR code injection)
- **Responsive UI:** Dark theme, grid layout with configurable density, mobile-compatible

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite 6, CSS custom props |
| Backend   | Node.js, Express.js                |
| Blockchain| ethers.js v6, Moralis SDK v2        |
| Storage   | IPFS (self-hosted node + gateway)   |
| Proxy     | Apache, Cloudflare DNS/SSL          |
| Process   | systemd                             |

## API Endpoints

### `GET /api/chains`
Returns supported chains and chain group definitions.

### `GET /api/nfts/contract/:chain/:address`
Fetches all NFTs for a given contract. Falls back to RPC scanning (ERC-1155 token IDs 1-100, ERC-721 via `tokenByIndex`) when Moralis returns empty results.

Query parameters: `limit` (default 20), `cursor` (pagination)

### `GET /api/nfts/wallet/:chain/:address`
Fetches all NFTs owned by a wallet. Supports optional `token_addresses` parameter for server-side contract filtering. Enriches results with on-chain metadata when Moralis data is incomplete.

Query parameters: `limit`, `cursor`, `token_addresses` (comma-separated)

### `GET /api/nfts/metadata/:chain/:address/:tokenId`
Fetches metadata for a single NFT by contract address and token ID.

### `GET /api/nfts/render?url=<ipfs_or_http_url>`
Proxy endpoint that fetches NFT HTML content, applies runtime patches (navigation fixes, QR code replacement), and serves the corrected HTML. Used for rendering `animation_url` content in iframes without CORS or X-Frame-Options issues.

## Configuration

Environment variables (`.env`):

```
MORALIS_API_KEY=<moralis_api_key>
SEPOLIA_RPC=https://sepolia.infura.io/v3/<key>
ETHEREUM_RPC=https://ethereum-rpc.publicnode.com
POLYGON_RPC=https://polygon-rpc.publicnode.com
BSC_RPC=https://bsc-rpc.publicnode.com
LOCALHOST_RPC=http://127.0.0.1:8545
PORT=4002
```

IPFS gateway is configured in `server/routes/nfts.js` via the `resolveIPFS()` function. Default maps `ipfs://` to `https://ipfs.gembaticket.com/ipfs/`.

## Installation

```bash
git clone https://github.com/<owner>/nft-viewer.git
cd nft-viewer

# Server
cd server
npm install
cp .env.example .env  # configure API keys and RPC endpoints

# Client
cd ../client
npm install
npm run build

# Start
cd ..
node server/index.js
```

Production deployment with systemd:

```bash
sudo cp nft-viewer.service /etc/systemd/system/
sudo systemctl enable nft-viewer
sudo systemctl start nft-viewer
```

## RPC Fallback Logic

The RPC fallback activates in two scenarios:

1. **Moralis returns an error or empty result set** for a known contract — the system scans token IDs directly via `uri()` (ERC-1155) or `tokenURI()` / `tokenByIndex()` (ERC-721).

2. **Moralis returns NFTs with missing metadata** (null tokenUri, null image, null animation_url) — the enrichment layer queries the contract for the token URI, fetches JSON metadata from IPFS, and backfills missing fields.

This ensures NFTs are visible even when newly minted contracts have not yet been indexed.

## HTML Proxy and Patching

The `/api/nfts/render` endpoint addresses two common issues with on-chain HTML NFTs:

- **Navigation bug:** Some NFT HTML viewers use `classList.add('')` which throws a `SyntaxError` in strict environments, breaking slide navigation. The proxy patches this at serve time.
- **QR code rendering:** CDN-hosted QR libraries (e.g., qrcodejs) may be blocked in iframe contexts. The proxy replaces `<canvas>` elements with static `<img>` tags pointing to `api.qrserver.com`.

This allows legacy immutable IPFS content to render correctly without requiring re-minting.

## Project Structure

```
nft-viewer/
  server/
    index.js            # Express app entry, Moralis init
    routes/
      nfts.js           # All API routes, RPC fallback, enrichment, HTML proxy
    config/
      chains.js         # Chain definitions, Moralis chain mapping, explorer URLs
  client/
    src/
      App.jsx           # Main app, query mode logic, chain selector
      App.css            # Global styles, dark theme, CSS variables
      hooks/
        useNFTs.js      # Data fetching hook with pagination
      components/
        NFTCard.jsx     # Grid card component
        Lightbox.jsx    # Detail view with Image/Ticket toggle, iframe rendering
    vite.config.js      # Dev server proxy config
```

## License

MIT
