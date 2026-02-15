// Moralis EVM API supported chains
// Docs: https://docs.moralis.io/supported-chains

const chains = {
  // ── Mainnets ──────────────────────────────────────
  ethereum:        { hex: '0x1',        decimal: 1,         name: 'Ethereum',           explorer: 'https://etherscan.io' },
  polygon:         { hex: '0x89',       decimal: 137,       name: 'Polygon',            explorer: 'https://polygonscan.com' },
  bsc:             { hex: '0x38',       decimal: 56,        name: 'BNB Smart Chain',    explorer: 'https://bscscan.com' },
  arbitrum:        { hex: '0xa4b1',     decimal: 42161,     name: 'Arbitrum One',       explorer: 'https://arbiscan.io' },
  base:            { hex: '0x2105',     decimal: 8453,      name: 'Base',               explorer: 'https://basescan.org' },
  avalanche:       { hex: '0xa86a',     decimal: 43114,     name: 'Avalanche C-Chain',  explorer: 'https://snowtrace.io' },
  optimism:        { hex: '0xa',        decimal: 10,        name: 'Optimism',           explorer: 'https://optimistic.etherscan.io' },
  linea:           { hex: '0xe708',     decimal: 59144,     name: 'Linea',              explorer: 'https://lineascan.build' },
  fantom:          { hex: '0xfa',       decimal: 250,       name: 'Fantom',             explorer: 'https://ftmscan.com' },
  cronos:          { hex: '0x19',       decimal: 25,        name: 'Cronos',             explorer: 'https://cronoscan.com' },
  gnosis:          { hex: '0x64',       decimal: 100,       name: 'Gnosis',             explorer: 'https://gnosisscan.io' },
  chiliz:          { hex: '0x15b38',    decimal: 88888,     name: 'Chiliz',             explorer: 'https://scan.chiliz.com' },
  moonbeam:        { hex: '0x504',      decimal: 1284,      name: 'Moonbeam',           explorer: 'https://moonbeam.moonscan.io' },

  // ── Testnets ──────────────────────────────────────
  sepolia:         { hex: '0xaa36a7',   decimal: 11155111,  name: 'Sepolia',            explorer: 'https://sepolia.etherscan.io' },
  holesky:         { hex: '0x4268',     decimal: 17000,     name: 'Holesky',            explorer: 'https://holesky.etherscan.io' },
  amoy:            { hex: '0x13882',    decimal: 80002,     name: 'Polygon Amoy',       explorer: 'https://amoy.polygonscan.com' },
  bsc_testnet:     { hex: '0x61',       decimal: 97,        name: 'BSC Testnet',        explorer: 'https://testnet.bscscan.com' },
  arbitrum_sepolia:{ hex: '0x66eee',    decimal: 421614,    name: 'Arbitrum Sepolia',   explorer: 'https://sepolia.arbiscan.io' },
  base_sepolia:    { hex: '0x14a34',    decimal: 84532,     name: 'Base Sepolia',       explorer: 'https://sepolia.basescan.org' },

  // ── Local ─────────────────────────────────────────
  localhost:       { hex: '0x7a69',     decimal: 31337,     name: 'Localhost (Hardhat)', explorer: null },
};

// Group for frontend dropdown
const chainGroups = {
  'Mainnets': ['ethereum', 'polygon', 'bsc', 'arbitrum', 'base', 'avalanche', 'optimism', 'linea', 'fantom', 'cronos', 'gnosis', 'chiliz', 'moonbeam'],
  'Testnets': ['sepolia', 'holesky', 'amoy', 'bsc_testnet', 'arbitrum_sepolia', 'base_sepolia'],
  'Local':    ['localhost'],
};

function getMoralisChain(chainKey) {
  const chain = chains[chainKey];
  if (!chain) return null;
  return chain.hex;
}

function getExplorerUrl(chainKey, type, address) {
  const chain = chains[chainKey];
  if (!chain || !chain.explorer) return null;
  const paths = { address: 'address', token: 'token', tx: 'tx', nft: 'nft' };
  return `${chain.explorer}/${paths[type] || 'address'}/${address}`;
}

module.exports = { chains, chainGroups, getMoralisChain, getExplorerUrl };
