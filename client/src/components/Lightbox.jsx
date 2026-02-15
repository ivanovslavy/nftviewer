import React, { useEffect, useState } from 'react';

function truncateAddress(addr) {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function resolveIPFS(url) {
  if (!url) return null;
  if (url.startsWith('ipfs://')) return url.replace('ipfs://', 'https://ipfs.gembaticket.com/ipfs/');
  return url;
}

export default function Lightbox({ nft, chain, onClose }) {
  const [imgError, setImgError] = useState(false);
  const [viewMode, setViewMode] = useState('image'); // 'image' | 'slide'

  // Get animation_url from rawMetadata if main field is null
  const animationUrl = resolveIPFS(
    nft.animationUrl || nft.rawMetadata?.animation_url
  );
  const hasSlideViewer = !!animationUrl;

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const hasImage = nft.image && !imgError;
  const attributes = nft.attributes || [];

  const links = [];
  if (nft.explorerUrl) links.push({ label: '↗ Explorer', url: nft.explorerUrl });
  if (nft.tokenUri) links.push({ label: '{ } Metadata URI', url: resolveIPFS(nft.tokenUri) || nft.tokenUri });
  if (nft.image) links.push({ label: '🖼 Image', url: nft.image });

  return (
    <div className="lightbox-overlay" onClick={handleOverlayClick}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>✕</button>

        {/* View mode toggle */}
        {hasSlideViewer && (
          <div className="lightbox-view-toggle">
            <button
              className={`view-tab ${viewMode === 'image' ? 'active' : ''}`}
              onClick={() => setViewMode('image')}
            >
              🖼 Image
            </button>
            <button
              className={`view-tab ${viewMode === 'slide' ? 'active' : ''}`}
              onClick={() => setViewMode('slide')}
            >
              🎫 Ticket
            </button>
          </div>
        )}

        {/* Slide viewer (iframe) */}
        {viewMode === 'slide' && hasSlideViewer ? (
          <div className="lightbox-iframe-wrap">
            <iframe
              src={`/api/nfts/render?url=${encodeURIComponent(nft.rawMetadata?.animation_url || nft.animationUrl)}`}
              className="lightbox-iframe"
              title="NFT Slide Viewer"
             
            />
          </div>
        ) : (
          /* Image */
          <div className="lightbox-image-wrap">
            {hasImage ? (
              <img
                className="lightbox-image"
                src={nft.image}
                alt={nft.name}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="lightbox-image-placeholder">◇</div>
            )}
          </div>
        )}

        {/* Details */}
        <div className="lightbox-details">
          <h2 className="lightbox-name">{nft.name}</h2>
          <div className="lightbox-token-id">
            Token #{nft.tokenId}
            {nft.contractType && ` · ${nft.contractType}`}
            {nft.symbol && ` · ${nft.symbol}`}
          </div>

          {nft.description && (
            <p className="lightbox-description">{nft.description}</p>
          )}

          <div className="lightbox-meta">
            <div className="meta-item">
              <div className="meta-label">Contract</div>
              <div className="meta-value">
                {nft.explorerUrl ? (
                  <a href={nft.explorerUrl} target="_blank" rel="noopener noreferrer">
                    {truncateAddress(nft.tokenAddress)}
                  </a>
                ) : truncateAddress(nft.tokenAddress)}
              </div>
            </div>
            {nft.owner && (
              <div className="meta-item">
                <div className="meta-label">Owner</div>
                <div className="meta-value">{truncateAddress(nft.owner)}</div>
              </div>
            )}
            <div className="meta-item">
              <div className="meta-label">Chain</div>
              <div className="meta-value">{chain}</div>
            </div>
            {nft.amount && nft.amount !== '1' && (
              <div className="meta-item">
                <div className="meta-label">Amount</div>
                <div className="meta-value">{nft.amount}</div>
              </div>
            )}
          </div>

          {attributes.length > 0 && (
            <div className="attributes-section">
              <div className="attributes-title">Attributes</div>
              <div className="attributes-grid">
                {attributes.map((attr, i) => (
                  <div key={i} className="attribute-tag">
                    <span className="attr-trait">{attr.trait_type || 'trait'}</span>
                    <span className="attr-value">{String(attr.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {links.length > 0 && (
            <div className="lightbox-links">
              {links.map((link, i) => (
                <a key={i} className="lightbox-link" href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ))}
              {animationUrl && (
                <a className="lightbox-link" href={animationUrl} target="_blank" rel="noopener noreferrer">
                  🎫 Open Ticket
                </a>
              )}
              {nft.rawMetadata && (
                <button className="lightbox-link" onClick={() => {
                  const blob = new Blob([JSON.stringify(nft.rawMetadata, null, 2)], { type: 'application/json' });
                  window.open(URL.createObjectURL(blob), '_blank');
                }}>
                  📋 Raw JSON
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
