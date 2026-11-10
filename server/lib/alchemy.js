// Alchemy NFT API adapter — replaces Moralis (2026-11-10).
// Returns objects in the SAME shape Moralis' .toJSON() produced, so routes/nfts.js and formatNFT()
// stay unchanged: { result: [...], total, page, page_size, cursor }, each item Moralis-flavoured
// (token_id, token_address, normalized_metadata, metadata, token_uri, contract_type, symbol,
//  owner_of, amount). Moralis is gone; Alchemy's key already lives in ALCHEMY_API_KEY.
//
// Only PUBLIC chains come here — Gemba stays on Blockscout/RPC (chains.js rpcOnly), unchanged.

// chainKey (config/chains.js) → Alchemy network subdomain. Chains Alchemy's NFT API does not serve
// are left out: the route then falls through to its existing RPC/Blockscout path instead of guessing.
const ALCHEMY_NET = {
  ethereum: 'eth-mainnet',
  polygon: 'polygon-mainnet',
  arbitrum: 'arb-mainnet',
  optimism: 'opt-mainnet',
  base: 'base-mainnet',
  bsc: 'bnb-mainnet',
  avalanche: 'avax-mainnet',
  gnosis: 'gnosis-mainnet',
  // testnets
  sepolia: 'eth-sepolia',
  amoy: 'polygon-amoy',
  base_sepolia: 'base-sepolia',
  arbitrum_sepolia: 'arb-sepolia',
  bsc_testnet: 'bnb-testnet',
};

// ── Key ring with rotation ──────────────────────────────────────────────────────────────────────
// Several keys may be given in ALCHEMY_API_KEYS (comma- or space-separated). When a key fails in a way
// that is the KEY's fault (401/403 auth, 429 rate limit, 5xx, or a network error) the next key in the
// ring is tried, wrapping around to the first after the last. The last key that WORKED becomes the
// starting point for the next request, so a dead key is not hammered on every call. An HTTP 200 — even
// with zero NFTs — is a real answer and never rotates. Falls back to the single ALCHEMY_NFT_KEY /
// ALCHEMY_API_KEY if the list is not set.
function alchemyKeys() {
  const list = process.env.ALCHEMY_API_KEYS || process.env.ALCHEMY_NFT_KEY || process.env.ALCHEMY_API_KEY || '';
  return list.split(/[,\s]+/).map((k) => k.trim()).filter(Boolean);
}

let keyIdx = 0; // remembers the last key that worked

function alchemyNetwork(chainKey) {
  return ALCHEMY_NET[chainKey] || null;
}

// Alchemy is available for this chain only if at least one key and a network mapping exist.
function alchemyAvailable(chainKey) {
  return Boolean(alchemyKeys().length && alchemyNetwork(chainKey));
}

// Should this failure make us try a DIFFERENT key? Auth / rate-limit / server / network — yes.
// A 400 (bad request) is our bug, not the key's, so it does not rotate.
function isKeyFault(status) {
  return status === 401 || status === 403 || status === 429 || status >= 500;
}

// Fetch <net>.g.alchemy.com/nft/v3/<KEY>/<pathAndQuery>, rotating keys on a key-level failure.
async function getJSON(chainKey, pathAndQuery, timeoutMs = 20000) {
  const net = alchemyNetwork(chainKey);
  const keys = alchemyKeys();
  if (!net || keys.length === 0) throw new Error('alchemy not configured for chain');

  let lastErr = null;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const idx = (keyIdx + attempt) % keys.length;
    const url = `https://${net}.g.alchemy.com/nft/v3/${keys[idx]}/${pathAndQuery}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const r = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
      if (r.ok) {
        keyIdx = idx; // this key works — start here next time
        return await r.json();
      }
      if (isKeyFault(r.status)) {
        lastErr = new Error(`alchemy key #${idx + 1} HTTP ${r.status}`);
        console.log(`[ALCHEMY ROTATE] key #${idx + 1} → HTTP ${r.status}, trying next`);
        continue; // next key
      }
      throw new Error(`alchemy HTTP ${r.status}`); // our fault — don't burn other keys
    } catch (e) {
      lastErr = e;
      console.log(`[ALCHEMY ROTATE] key #${idx + 1} → ${e.message}, trying next`);
      // network/abort — try the next key
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error('all alchemy keys failed');
}

// ── Map one Alchemy NFT → the Moralis item shape formatNFT() expects ──
function toMoralisItem(nft, ownerAddress) {
  const contractAddr = nft.contract && nft.contract.address;
  const md = (nft.raw && nft.raw.metadata) || {};
  // Prefer the ORIGINAL (often ipfs://) image so resolveIPFS routes it through our own IPFS node,
  // not Alchemy's CDN. Fall back to Alchemy's resolved originalUrl, then the cached CDN copy.
  const img =
    md.image || md.image_url ||
    (nft.image && (nft.image.originalUrl || nft.image.cachedUrl)) || null;
  const anim =
    md.animation_url ||
    (nft.animation && (nft.animation.originalUrl || nft.animation.cachedUrl)) || null;
  const ctype = nft.tokenType && nft.tokenType !== 'UNKNOWN' ? nft.tokenType : 'ERC721';

  return {
    token_id: String(nft.tokenId),
    token_address: contractAddr,
    contract_type: ctype,
    name: nft.name || (nft.contract && nft.contract.name) || null,
    symbol: (nft.contract && nft.contract.symbol) || null,
    token_uri: nft.tokenUri || (nft.raw && nft.raw.tokenUri) || null,
    metadata: Object.keys(md).length ? JSON.stringify(md) : null,
    normalized_metadata: {
      name: nft.name || md.name || null,
      description: nft.description || md.description || '',
      image: img,
      animation_url: anim,
      attributes: md.attributes || [],
    },
    owner_of: ownerAddress || null,
    amount: nft.balance || '1',
  };
}

// ── NFTs owned by a wallet (the main feature) ──
// opts: { limit, cursor, tokenAddresses: [..] }
async function walletNFTs(chainKey, address, opts = {}) {
  const limit = Math.min(parseInt(opts.limit) || 20, 100);
  const params = new URLSearchParams({ owner: address, withMetadata: 'true', pageSize: String(limit) });
  if (opts.cursor) params.set('pageKey', opts.cursor);
  for (const ca of opts.tokenAddresses || []) if (ca) params.append('contractAddresses[]', ca);
  const data = await getJSON(chainKey, `getNFTsForOwner?${params.toString()}`);
  const items = (data.ownedNfts || []).map((n) => toMoralisItem(n, address));
  return {
    result: items,
    total: data.totalCount != null ? data.totalCount : items.length,
    page: 0,
    page_size: limit,
    cursor: data.pageKey || null,
  };
}

// ── NFTs within a contract ──
async function contractNFTs(chainKey, contractAddress, opts = {}) {
  const limit = Math.min(parseInt(opts.limit) || 20, 100);
  const params = new URLSearchParams({ contractAddress, withMetadata: 'true', limit: String(limit) });
  if (opts.cursor) params.set('startToken', opts.cursor);
  const data = await getJSON(chainKey, `getNFTsForContract?${params.toString()}`);
  const items = (data.nfts || []).map((n) => toMoralisItem({ ...n, contract: n.contract || { address: contractAddress } }, null));
  return { result: items, total: items.length, page: 0, page_size: limit, cursor: data.pageKey || null };
}

// ── Single NFT metadata ──
async function nftMetadata(chainKey, contractAddress, tokenId) {
  const params = new URLSearchParams({ contractAddress, tokenId: String(tokenId), refreshCache: 'false' });
  const nft = await getJSON(chainKey, `getNFTMetadata?${params.toString()}`);
  if (!nft || nft.tokenId == null) return null;
  return toMoralisItem({ ...nft, contract: nft.contract || { address: contractAddress } }, null);
}

module.exports = { alchemyAvailable, alchemyNetwork, walletNFTs, contractNFTs, nftMetadata };
