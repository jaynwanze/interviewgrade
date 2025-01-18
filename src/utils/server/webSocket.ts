'use server';

import WebSocket from 'ws';
const openAiKey = process.env.OPENAI_SECRET_KEY;

if (!openAiKey) {
  throw new Error(
    'OpenAI API key is missing. Please set OPENAI_SECRET_KEY in your environment variables.',
  );
}

const openAiUrl =
  'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';

const ws = new WebSocket();

ws.on('connection', (clientWs) => {
  console.log('Client connected to proxy server.');

  // Connect to OpenAI's WebSocket
  const openAiWs = new WebSocket(openAiUrl, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'realtime=v1',
    },
  });

  openAiWs.on('open', () => {
    console.log('Connected to OpenAI server.');
  });

  // Forward messages from OpenAI to the client
  openAiWs.on('message', (data) => {
    clientWs.send(data);
  });

  openAiWs.on('error', (error) => {
    console.error('OpenAI WebSocket error:', error);
    clientWs.send(JSON.stringify({ type: 'error', message: error.message }));
  });

  openAiWs.on('close', () => {
    console.log('OpenAI WebSocket connection closed.');
    clientWs.close();
  });

  // Forward messages from the client to OpenAI
  clientWs.on('message', (message) => {
    try {
      const event = JSON.parse(message);
      openAiWs.send(JSON.stringify(event));
    } catch (error) {
      console.error('Error parsing client message:', error);
      clientWs.send(JSON.stringify({ type: 'error', message: 'Invalid message format.' }));
    }
  });

  clientWs.on('close', () => {
    console.log('Client disconnected from proxy server.');
    openAiWs.close();
  });
});

export async function connectWebSocket() {
  return ws;
}
