const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Tax Filing PWA Test Server is running!',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  }));
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Test URL: http://localhost:${PORT}`);
});

module.exports = server; 