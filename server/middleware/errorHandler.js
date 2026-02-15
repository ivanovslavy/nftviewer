function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`);
  
  if (err.response) {
    // Moralis API error
    const status = err.response.status || 500;
    const message = err.response.data?.message || err.message;
    return res.status(status).json({ error: message, source: 'moralis' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
