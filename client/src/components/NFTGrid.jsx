import React from 'react';
import NFTCard from './NFTCard';

export default function NFTGrid({ nfts, loading, onCardClick }) {
  if (loading) {
    return (
      <div className="loading-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-img" />
            <div className="skeleton-text">
              <div className="skeleton-line" />
              <div className="skeleton-line" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!nfts.length) return null;

  return (
    <div className="nft-grid">
      {nfts.map((nft, idx) => (
        <NFTCard
          key={`${nft.tokenAddress}-${nft.tokenId}-${idx}`}
          nft={nft}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
