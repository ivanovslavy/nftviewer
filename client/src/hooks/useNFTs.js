import { useState, useCallback } from 'react';

export default function useNFTs() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [cursors, setCursors] = useState([]);
  const [page, setPage] = useState(0);

  const fetchNFTs = useCallback(async ({ mode, chain, address, limit, nextCursor, direction, tokenAddresses }) => {
    if (!chain || !address) return;
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === 'contract'
        ? `/api/nfts/contract/${chain}/${address}`
        : `/api/nfts/wallet/${chain}/${address}`;
      const params = new URLSearchParams({ limit: String(limit) });
      if (nextCursor) params.set('cursor', nextCursor);
      if (tokenAddresses) params.set('token_addresses', tokenAddresses);
      const res = await fetch(`${endpoint}?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setNfts(data.results || []);
      setTotal(data.total || 0);
      if (direction === 'next' && cursor) {
        setCursors(prev => [...prev, cursor]);
      } else if (direction === 'prev') {
        setCursors(prev => prev.slice(0, -1));
      } else {
        setCursors([]);
        setPage(0);
      }
      setCursor(data.cursor || null);
      if (direction === 'next') setPage(p => p + 1);
      else if (direction === 'prev') setPage(p => Math.max(0, p - 1));
    } catch (err) {
      setError(err.message);
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  const reset = useCallback(() => {
    setNfts([]); setTotal(0); setCursor(null); setCursors([]); setPage(0); setError(null);
  }, []);

  return { nfts, loading, error, total, cursor, cursors, page, fetchNFTs, reset };
}
