import WebSocket from 'ws';

const WS_URL = 'ws://localhost:9000/ws/market';

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('Connected to', WS_URL);
  // Subscribe to AAPL
  ws.send(JSON.stringify({ type: 'subscribe', tickers: ['AAPL'] }));
  console.log('Subscribed to AAPL');
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('Message:', JSON.stringify(msg, null, 2));
  } catch (e) {
    console.log('Raw message:', data.toString());
  }
});

ws.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err.message || err);
  process.exit(1);
});

// Exit after 20 seconds
setTimeout(() => {
  console.log('Exiting test client');
  ws.close();
}, 20000);
