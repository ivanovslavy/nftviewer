import React, { useState, useCallback, useMemo } from 'react';
import TopBar from './components/TopBar';
import NFTGrid from './components/NFTGrid';
import Lightbox from './components/Lightbox';
import useNFTs from './hooks/useNFTs';

export default function App() {
  const [mode, setMode] = useState('wallet');
  const [chain, setChain] = useState('ethereum');
  const [walletAddress, setWalletAddress] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [limit, setLimit] = useState(20);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [onlyWithImage, setOnlyWithImage] = useState(false);

  const { nfts, loading, error, total, cursor, cursors, page, fetchNFTs, reset } = useNFTs();

  const filteredNFTs = useMemo(() => {
    if (onlyWithImage) return nfts.filter(nft => nft.image);
    return nfts;
  }, [nfts, onlyWithImage]);

  const withImageCount = useMemo(() => nfts.filter(nft => nft.image).length, [nfts]);

  const doFetch = useCallback((overrides = {}) => {
    const wa = walletAddress.trim();
    if (!wa) return;
    const ca = contractAddress.trim();
    fetchNFTs({
      mode: 'wallet',
      chain,
      address: wa,
      limit,
      tokenAddresses: mode === 'both' && ca ? ca : undefined,
      ...overrides,
    });
  }, [chain, walletAddress, contractAddress, limit, mode, fetchNFTs]);

  const handleSearch = useCallback(() => {
    setHasSearched(true);
    setSelectedNFT(null);
    doFetch();
  }, [doFetch]);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    if (newMode === 'wallet') setContractAddress('');
  }, []);

  const handleNext = useCallback(() => {
    if (!cursor) return;
    doFetch({ nextCursor: cursor, direction: 'next' });
  }, [cursor, doFetch]);

  const handlePrev = useCallback(() => {
    if (!cursors.length) return;
    const prevCursor = cursors.length > 1 ? cursors[cursors.length - 1] : undefined;
    doFetch({ nextCursor: prevCursor, direction: 'prev' });
  }, [cursors, doFetch]);

  const showPagination = nfts.length > 0 && (cursor || page > 0);

  return (
    <>
      <TopBar
        mode={mode} chain={chain} walletAddress={walletAddress}
        contractAddress={contractAddress} limit={limit} loading={loading}
        onlyWithImage={onlyWithImage} onModeChange={handleModeChange}
        onChainChange={setChain} onWalletAddressChange={setWalletAddress}
        onContractAddressChange={setContractAddress} onLimitChange={setLimit}
        onSearch={handleSearch} onOnlyWithImageChange={setOnlyWithImage}
      />
      <div className="main-content">
        {error && (
          <div className="error-banner"><span>⚠</span><span>{error}</span></div>
        )}
        {hasSearched && !loading && nfts.length > 0 && (
          <div className="status-bar">
            <div className="status-stats">
              <div className="stat-chip"><span className="stat-label">Total in wallet</span><span className="stat-value">{total.toLocaleString()}</span></div>
              <div className="stat-chip"><span className="stat-label">Fetched</span><span className="stat-value">{nfts.length}</span></div>
              <div className="stat-chip"><span className="stat-label">With image</span><span className="stat-value">{withImageCount}</span></div>
              <div className="stat-chip accent"><span className="stat-label">Showing</span><span className="stat-value">{filteredNFTs.length}</span></div>
              {page > 0 && (<div className="stat-chip"><span className="stat-label">Page</span><span className="stat-value">{page + 1}</span></div>)}
            </div>
          </div>
        )}
        <NFTGrid nfts={filteredNFTs} loading={loading} onCardClick={setSelectedNFT} />
        {hasSearched && !loading && !error && filteredNFTs.length === 0 && nfts.length > 0 && (
          <div className="empty-state"><div className="empty-icon">🔍</div><h2>No matches</h2><p>None of the fetched NFTs have images.</p></div>
        )}
        {hasSearched && !loading && !error && nfts.length === 0 && (
          <div className="empty-state"><div className="empty-icon">◇</div><h2>No NFTs found</h2><p>This wallet holds no NFTs on the selected chain{mode === 'both' ? ' for this contract' : ''}.</p></div>
        )}
        {!hasSearched && !loading && (
          <div className="empty-state"><div className="empty-icon">◆</div><h2>NFT Viewer</h2><p>Enter a wallet address, select a chain, and hit Fetch to browse NFTs. Use WA+CA mode to filter by a specific contract.</p></div>
        )}
        {showPagination && (
          <div className="pagination">
            <button className="page-btn" onClick={handlePrev} disabled={page === 0 || loading}>← Prev</button>
            <span className="page-info">Page {page + 1}</span>
            <button className="page-btn" onClick={handleNext} disabled={!cursor || loading}>Next →</button>
          </div>
        )}
      </div>
      {selectedNFT && (<Lightbox nft={selectedNFT} chain={chain} onClose={() => setSelectedNFT(null)} />)}
    </>
  );
}
