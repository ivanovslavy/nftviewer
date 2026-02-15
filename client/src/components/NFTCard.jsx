import React, { useState } from 'react';

export default function NFTCard({ nft, onClick }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const hasImage = nft.image && !imgError;

  return (
    <div className="nft-card" onClick={() => onClick(nft)}>
      <div className="nft-card-img-wrap">
        {hasImage ? (
          <img
            className="nft-card-img"
            src={nft.image}
            alt={nft.name}
            loading="lazy"
            onError={() => setImgError(true)}
            onLoad={() => setImgLoaded(true)}
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
          />
        ) : (
          <div className="nft-card-img-placeholder">◇</div>
        )}
        {nft.contractType && (
          <span className="nft-card-badge">{nft.contractType}</span>
        )}
      </div>

      <div className="nft-card-body">
        <div className="nft-card-name" title={nft.name}>
          {nft.name}
        </div>
        <div className="nft-card-id">#{nft.tokenId}</div>
        {nft.description && (
          <div className="nft-card-desc">{nft.description}</div>
        )}
      </div>
    </div>
  );
}
