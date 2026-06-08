import React from 'react';

const chainGroups = {
  Mainnets: [
    { key: 'ethereum',   name: 'Ethereum' },
    { key: 'polygon',    name: 'Polygon' },
    { key: 'bsc',        name: 'BNB Chain' },
    { key: 'arbitrum',   name: 'Arbitrum' },
    { key: 'base',       name: 'Base' },
    { key: 'avalanche',  name: 'Avalanche' },
    { key: 'optimism',   name: 'Optimism' },
    { key: 'linea',      name: 'Linea' },
    { key: 'fantom',     name: 'Fantom' },
    { key: 'cronos',     name: 'Cronos' },
    { key: 'gnosis',     name: 'Gnosis' },
    { key: 'moonbeam',   name: 'Moonbeam' },
    { key: 'gemba',      name: 'Gemba' },
  ],
  Testnets: [
    { key: 'sepolia',          name: 'Sepolia' },
    { key: 'holesky',          name: 'Holesky' },
    { key: 'amoy',             name: 'Polygon Amoy' },
    { key: 'bsc_testnet',      name: 'BSC Testnet' },
    { key: 'arbitrum_sepolia', name: 'Arbitrum Sepolia' },
    { key: 'base_sepolia',     name: 'Base Sepolia' },
    { key: 'gemba_testnet',    name: 'Gemba Testnet' },
  ],
  Local: [
    { key: 'localhost', name: 'Localhost' },
  ],
};

const LIMITS = [20, 50, 100];

export default function TopBar({
  mode, chain, walletAddress, contractAddress, limit, loading, onlyWithImage,
  onModeChange, onChainChange, onWalletAddressChange, onContractAddressChange,
  onLimitChange, onSearch, onOnlyWithImageChange,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="topbar-logo">
          <div className="logo-icon">◆</div>
          NFT Viewer
        </div>

        <div className="topbar-divider" />

        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'wallet' ? 'active' : ''}`}
            onClick={() => onModeChange('wallet')}
          >
            WA
          </button>
          <button
            className={`mode-tab ${mode === 'both' ? 'active' : ''}`}
            onClick={() => onModeChange('both')}
          >
            WA + CA
          </button>
        </div>

        <select
          className="topbar-select"
          value={chain}
          onChange={(e) => onChainChange(e.target.value)}
        >
          {Object.entries(chainGroups).map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map((c) => (
                <option key={c.key} value={c.key}>{c.name}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <input
          className="topbar-input"
          type="text"
          value={walletAddress}
          onChange={(e) => onWalletAddressChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0x… Wallet Address"
          spellCheck={false}
          autoComplete="off"
        />

        {mode === 'both' && (
          <input
            className="topbar-input topbar-input-ca"
            type="text"
            value={contractAddress}
            onChange={(e) => onContractAddressChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0x… Contract Address (filter)"
            spellCheck={false}
            autoComplete="off"
          />
        )}

        <button
          className={`topbar-toggle ${onlyWithImage ? 'active' : ''}`}
          onClick={() => onOnlyWithImageChange(!onlyWithImage)}
          title="Show only NFTs with images"
        >
          🖼
        </button>

        <div className="limit-group">
          {LIMITS.map((l) => (
            <button
              key={l}
              className={`limit-btn ${limit === l ? 'active' : ''}`}
              onClick={() => onLimitChange(l)}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          className="topbar-btn"
          onClick={onSearch}
          disabled={loading || !walletAddress.trim()}
        >
          {loading ? '⟳' : 'Fetch'}
        </button>
      </div>
    </div>
  );
}
